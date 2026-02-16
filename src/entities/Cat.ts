import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';
import { CatGraphics } from '../utils/CatGraphics';

export enum CatState {
  NORMAL = 'normal',
  FROZEN = 'frozen',
  SLOWED = 'slowed'
}

export class Cat extends Phaser.GameObjects.Container {
  private gridManager: GridManager;
  private lastValidX: number;
  private lastValidY: number;
  private catState: CatState = CatState.NORMAL;
  private baseSpeed: number;
  private stateOverlay?: Phaser.GameObjects.Graphics;
  private savedVelocityX: number = 0;
  private savedVelocityY: number = 0;
  private catGraphics: Phaser.GameObjects.Graphics;
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number, gridManager: GridManager) {
    super(scene, x, y);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.gridManager = gridManager;
    this.lastValidX = x;
    this.lastValidY = y;
    this.baseSpeed = GameConfig.catSpeed;

    // Create procedural pirate cat graphics
    this.catGraphics = scene.add.graphics();
    const catSize = 35; // Visible size in pixels
    const pirateColor = CatGraphics.getRandomPirateColor();
    CatGraphics.drawCat(this.catGraphics, catSize, pirateColor, 'pirate');
    this.add(this.catGraphics);

    this.setDepth(5);

    // Set random velocity using physics body
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = this.baseSpeed;
    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed;
    this.body.setVelocity(velX, velY);

    // Save initial velocity
    this.savedVelocityX = velX;
    this.savedVelocityY = velY;

    // Set up physics body
    this.body.setCircle(GameConfig.cellSize * 0.4);
    this.body.setBounce(1, 1);
    this.body.setCollideWorldBounds(true);

    // Create state overlay graphics
    this.stateOverlay = this.scene.add.graphics();
    this.stateOverlay.setDepth(6); // Above cat sprite
  }

  preUpdate(_time: number, delta: number): void {

    // Update state overlay position
    this.updateStateOverlay();

    // If frozen, physics body is disabled, skip movement logic
    if (this.catState === CatState.FROZEN) {
      return;
    }

    const cellSize = GameConfig.cellSize;
    const currentGridX = Math.floor(this.x / cellSize);
    const currentGridY = Math.floor(this.y / cellSize);

    // Check current cell state
    const currentCellState = this.gridManager.getCellState(currentGridX, currentGridY);

    // If cat is in captured territory, push it back to last valid position
    if (currentCellState === CellState.CAPTURED) {
      // Push cat back to void
      this.x = this.lastValidX;
      this.y = this.lastValidY;

      // Bounce by reversing velocity
      this.body.setVelocity(-this.body.velocity.x, -this.body.velocity.y);
      return;
    }

    // Calculate next position based on velocity
    const nextX = this.x + (this.body.velocity.x * delta / 1000);
    const nextY = this.y + (this.body.velocity.y * delta / 1000);

    // Check if next position would enter captured territory
    const nextGridX = Math.floor(nextX / cellSize);
    const nextGridY = Math.floor(nextY / cellSize);
    const nextCellState = this.gridManager.getCellState(nextGridX, nextGridY);

    if (nextCellState === CellState.CAPTURED) {
      // About to hit captured territory - bounce
      const dx = nextX - this.x;
      const dy = nextY - this.y;

      // Determine which axis to bounce on
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal collision - reverse X velocity
        this.body.setVelocity(-this.body.velocity.x, this.body.velocity.y);
      } else {
        // Vertical collision - reverse Y velocity
        this.body.setVelocity(this.body.velocity.x, -this.body.velocity.y);
      }
    } else {
      // Update last valid position (cat is in void)
      this.lastValidX = this.x;
      this.lastValidY = this.y;
    }

    // Flip cat based on movement direction
    if (this.body.velocity.x < -5) {
      this.catGraphics.setScale(-1, 1);
    } else if (this.body.velocity.x > 5) {
      this.catGraphics.setScale(1, 1);
    }
  }

  public setCatState(newState: CatState): void {
    const oldState = this.catState;
    this.catState = newState;

    // Get current velocity before state change
    const currentVelX = this.body.velocity.x;
    const currentVelY = this.body.velocity.y;
    const currentSpeed = Math.sqrt(currentVelX * currentVelX + currentVelY * currentVelY);

    // Save current velocity if it's non-zero
    if (currentSpeed > 0) {
      this.savedVelocityX = currentVelX;
      this.savedVelocityY = currentVelY;
    }

    if (newState === CatState.FROZEN) {
      // Disable physics body and stop movement
      if (this.body) {
        this.body.enable = false;
      }
      this.body.setVelocity(0, 0);
    } else if (newState === CatState.SLOWED) {
      // Re-enable physics if coming from frozen
      if (oldState === CatState.FROZEN && this.body) {
        this.body.enable = true;
      }

      // Apply slow multiplier
      const multiplier = GameConfig.powerUps.slowSpeedMultiplier;

      // If we have saved velocity, use it, otherwise generate random direction
      if (this.savedVelocityX !== 0 || this.savedVelocityY !== 0) {
        const savedSpeed = Math.sqrt(this.savedVelocityX * this.savedVelocityX + this.savedVelocityY * this.savedVelocityY);
        const dirX = this.savedVelocityX / savedSpeed;
        const dirY = this.savedVelocityY / savedSpeed;
        this.body.setVelocity(
          dirX * this.baseSpeed * multiplier,
          dirY * this.baseSpeed * multiplier
        );
      } else {
        // Generate new random direction
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.body.setVelocity(
          Math.cos(angle) * this.baseSpeed * multiplier,
          Math.sin(angle) * this.baseSpeed * multiplier
        );
      }
    } else if (newState === CatState.NORMAL) {
      // Re-enable physics if coming from frozen
      if (oldState === CatState.FROZEN && this.body) {
        this.body.enable = true;
      }

      // Restore normal speed using saved velocity direction
      if (this.savedVelocityX !== 0 || this.savedVelocityY !== 0) {
        const savedSpeed = Math.sqrt(this.savedVelocityX * this.savedVelocityX + this.savedVelocityY * this.savedVelocityY);
        const dirX = this.savedVelocityX / savedSpeed;
        const dirY = this.savedVelocityY / savedSpeed;
        this.body.setVelocity(
          dirX * this.baseSpeed,
          dirY * this.baseSpeed
        );
      } else {
        // Generate new random direction
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.body.setVelocity(
          Math.cos(angle) * this.baseSpeed,
          Math.sin(angle) * this.baseSpeed
        );
      }
    }
  }

  public getCatState(): CatState {
    return this.catState;
  }

  private updateStateOverlay(): void {
    if (!this.stateOverlay) return;

    this.stateOverlay.clear();

    if (this.catState === CatState.FROZEN) {
      // Draw ice blue circle overlay
      this.stateOverlay.fillStyle(0x3498DB, 0.4);
      this.stateOverlay.fillCircle(this.x, this.y, GameConfig.cellSize * 1.2);

      // Draw ice crystals (static for simplicity)
      this.stateOverlay.lineStyle(2, 0xECF0F1, 0.8);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const r = GameConfig.cellSize * 0.8;
        this.stateOverlay.beginPath();
        this.stateOverlay.moveTo(this.x, this.y);
        this.stateOverlay.lineTo(this.x + Math.cos(angle) * r, this.y + Math.sin(angle) * r);
        this.stateOverlay.strokePath();
      }
    } else if (this.catState === CatState.SLOWED) {
      // Draw gray chain overlay
      this.stateOverlay.fillStyle(0x7F8C8D, 0.3);
      this.stateOverlay.fillCircle(this.x, this.y, GameConfig.cellSize * 1.2);

      // Draw chain links
      this.stateOverlay.lineStyle(2, 0x95A5A6, 0.8);
      this.stateOverlay.strokeCircle(this.x - 5, this.y - 5, 4);
      this.stateOverlay.strokeCircle(this.x + 5, this.y + 5, 4);
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.stateOverlay) {
      this.stateOverlay.destroy();
      this.stateOverlay = undefined;
    }
    if (this.catGraphics) {
      this.catGraphics.destroy();
    }
    super.destroy(fromScene);
  }
}
