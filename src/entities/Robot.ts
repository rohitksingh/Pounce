import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';

export enum RobotState {
  NORMAL = 'normal',
  FROZEN = 'frozen',
  SLOWED = 'slowed'
}

export class Robot extends Phaser.Physics.Arcade.Sprite {
  private gridManager: GridManager;
  private lastValidX: number;
  private lastValidY: number;
  private robotState: RobotState = RobotState.NORMAL;
  private baseSpeed: number;
  private stateOverlay?: Phaser.GameObjects.Graphics;
  private savedVelocityX: number = 0;
  private savedVelocityY: number = 0;
  private level: number;
  private robotGraphics?: Phaser.GameObjects.Graphics;
  private blinkTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, gridManager: GridManager, level: number = 1) {
    // Create procedural robot texture first
    const textureKey = `robot-level-${level}`;

    // Only create texture if it doesn't exist
    if (!scene.textures.exists(textureKey)) {
      Robot.createRobotTexture(scene, level);
    }

    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.gridManager = gridManager;
    this.lastValidX = x;
    this.lastValidY = y;
    this.baseSpeed = GameConfig.catSpeed;
    this.level = level;

    // Scale sprite to match cell size (doubled for better visibility)
    const cellSize = GameConfig.cellSize;
    this.setOrigin(0.5, 0.5);
    this.setScale((cellSize / 32) * 2);

    // Set random velocity
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = this.baseSpeed;
    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed;
    this.setVelocity(velX, velY);

    // Save initial velocity
    this.savedVelocityX = velX;
    this.savedVelocityY = velY;

    this.setCircle(GameConfig.cellSize * 0.4);
    this.setBounce(1, 1);
    this.setCollideWorldBounds(true);

    // Create state overlay graphics
    this.stateOverlay = this.scene.add.graphics();
    this.stateOverlay.setDepth(6); // Above robot sprite
  }

  /**
   * Create procedural robot texture based on level
   */
  private static createRobotTexture(scene: Phaser.Scene, level: number): void {
    const textureKey = `robot-level-${level}`;
    const graphics = scene.add.graphics();
    const size = 32; // Base size for texture

    graphics.clear();

    if (level === 1) {
      // Level 1 - Basic Robot
      // Body: Gray rectangle
      graphics.fillStyle(0x555555, 1);
      graphics.fillRect(6, 7, 20, 25);

      // Head: Dark gray square
      graphics.fillStyle(0x333333, 1);
      graphics.fillRect(8.5, 0, 15, 15);

      // Eyes: Red glowing circles
      graphics.fillStyle(0xFF0000, 1);
      graphics.fillCircle(12, 7, 3);
      graphics.fillCircle(20, 7, 3);

      // Antenna: Line with circle
      graphics.lineStyle(2, 0x888888, 1);
      graphics.beginPath();
      graphics.moveTo(16, 0);
      graphics.lineTo(16, -4);
      graphics.strokePath();
      graphics.fillStyle(0xFF0000, 1);
      graphics.fillCircle(16, -4, 2);

      // Legs: Small circles at bottom
      graphics.fillStyle(0x444444, 1);
      graphics.fillCircle(11, 32, 3);
      graphics.fillCircle(21, 32, 3);

    } else if (level === 2) {
      // Level 2 - Advanced Robot
      // Body: Hexagon shape
      graphics.fillStyle(0x333333, 1);
      graphics.beginPath();
      graphics.moveTo(16, 2);
      graphics.lineTo(26, 8);
      graphics.lineTo(26, 24);
      graphics.lineTo(16, 30);
      graphics.lineTo(6, 24);
      graphics.lineTo(6, 8);
      graphics.closePath();
      graphics.fillPath();

      // Head: Trapezoidal shape
      graphics.fillStyle(0x222222, 1);
      graphics.beginPath();
      graphics.moveTo(11, 0);
      graphics.lineTo(21, 0);
      graphics.lineTo(24, 8);
      graphics.lineTo(8, 8);
      graphics.closePath();
      graphics.fillPath();

      // Core: Blue glowing circle
      graphics.fillStyle(0x00AAFF, 1);
      graphics.fillCircle(16, 16, 5);

      // Hover jets: Blue triangles at bottom
      graphics.fillStyle(0x0088DD, 1);
      graphics.beginPath();
      graphics.moveTo(11, 30);
      graphics.lineTo(9, 32);
      graphics.lineTo(13, 32);
      graphics.closePath();
      graphics.fillPath();

      graphics.beginPath();
      graphics.moveTo(21, 30);
      graphics.lineTo(19, 32);
      graphics.lineTo(23, 32);
      graphics.closePath();
      graphics.fillPath();

    } else {
      // Level 3 - Elite Robot (tank-like)
      // Body: Wide rectangular tank
      graphics.fillStyle(0x222222, 1);
      graphics.fillRect(1, 8, 30, 24);

      // Armor plating: Angular shapes overlay
      graphics.fillStyle(0x333333, 1);
      graphics.beginPath();
      graphics.moveTo(1, 8);
      graphics.lineTo(8, 8);
      graphics.lineTo(6, 14);
      graphics.lineTo(1, 14);
      graphics.closePath();
      graphics.fillPath();

      graphics.beginPath();
      graphics.moveTo(24, 8);
      graphics.lineTo(31, 8);
      graphics.lineTo(31, 14);
      graphics.lineTo(26, 14);
      graphics.closePath();
      graphics.fillPath();

      // Head/Turret
      graphics.fillStyle(0x1A1A1A, 1);
      graphics.fillRect(11, 0, 10, 12);

      // Warning lights: Orange/red circles (will blink in update)
      graphics.fillStyle(0xFF6600, 1);
      graphics.fillCircle(8, 16, 2);
      graphics.fillCircle(24, 16, 2);

      // Weapon mounts: Small rectangles on sides
      graphics.fillStyle(0x444444, 1);
      graphics.fillRect(0, 14, 4, 6);
      graphics.fillRect(28, 14, 4, 6);

      // Treads/wheels at bottom
      graphics.fillStyle(0x111111, 1);
      graphics.fillRect(2, 28, 28, 4);
    }

    // Generate texture from graphics
    graphics.generateTexture(textureKey, size, size);
    graphics.destroy();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    // Update blink timer for level 3 robots
    if (this.level === 3) {
      this.blinkTimer += delta;
      if (this.blinkTimer > 500) {
        this.blinkTimer = 0;
        // Toggle tint for blinking effect
        if (this.tint === 0xFFFFFF) {
          this.setTint(0xFF6600);
        } else {
          this.clearTint();
        }
      }
    }

    // Update state overlay position
    this.updateStateOverlay();

    // If frozen, physics body is disabled, skip movement logic
    if (this.robotState === RobotState.FROZEN) {
      return;
    }

    const cellSize = GameConfig.cellSize;
    const currentGridX = Math.floor(this.x / cellSize);
    const currentGridY = Math.floor(this.y / cellSize);

    // Check current cell state
    const currentCellState = this.gridManager.getCellState(currentGridX, currentGridY);

    // If robot is in captured territory, push it back to last valid position
    if (currentCellState === CellState.CAPTURED) {
      // Push robot back to void
      this.x = this.lastValidX;
      this.y = this.lastValidY;

      // Bounce by reversing velocity
      this.setVelocity(-this.body!.velocity.x, -this.body!.velocity.y);
      return;
    }

    // Calculate next position based on velocity
    const nextX = this.x + (this.body!.velocity.x * delta / 1000);
    const nextY = this.y + (this.body!.velocity.y * delta / 1000);

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
        this.setVelocity(-this.body!.velocity.x, this.body!.velocity.y);
      } else {
        // Vertical collision - reverse Y velocity
        this.setVelocity(this.body!.velocity.x, -this.body!.velocity.y);
      }
    } else {
      // Update last valid position (robot is in void)
      this.lastValidX = this.x;
      this.lastValidY = this.y;
    }
  }

  public setRobotState(newState: RobotState): void {
    const oldState = this.robotState;
    this.robotState = newState;

    // Get current velocity before state change
    const currentVelX = this.body!.velocity.x;
    const currentVelY = this.body!.velocity.y;
    const currentSpeed = Math.sqrt(currentVelX * currentVelX + currentVelY * currentVelY);

    // Save current velocity if it's non-zero
    if (currentSpeed > 0) {
      this.savedVelocityX = currentVelX;
      this.savedVelocityY = currentVelY;
    }

    if (newState === RobotState.FROZEN) {
      // Disable physics body and stop movement
      if (this.body) {
        this.body.enable = false;
      }
      this.setVelocity(0, 0);
    } else if (newState === RobotState.SLOWED) {
      // Re-enable physics if coming from frozen
      if (oldState === RobotState.FROZEN && this.body) {
        this.body.enable = true;
      }

      // Apply slow multiplier
      const multiplier = GameConfig.powerUps.slowSpeedMultiplier;

      // If we have saved velocity, use it, otherwise generate random direction
      if (this.savedVelocityX !== 0 || this.savedVelocityY !== 0) {
        const savedSpeed = Math.sqrt(this.savedVelocityX * this.savedVelocityX + this.savedVelocityY * this.savedVelocityY);
        const dirX = this.savedVelocityX / savedSpeed;
        const dirY = this.savedVelocityY / savedSpeed;
        this.setVelocity(
          dirX * this.baseSpeed * multiplier,
          dirY * this.baseSpeed * multiplier
        );
      } else {
        // Generate new random direction
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.setVelocity(
          Math.cos(angle) * this.baseSpeed * multiplier,
          Math.sin(angle) * this.baseSpeed * multiplier
        );
      }
    } else if (newState === RobotState.NORMAL) {
      // Re-enable physics if coming from frozen
      if (oldState === RobotState.FROZEN && this.body) {
        this.body.enable = true;
      }

      // Restore normal speed using saved velocity direction
      if (this.savedVelocityX !== 0 || this.savedVelocityY !== 0) {
        const savedSpeed = Math.sqrt(this.savedVelocityX * this.savedVelocityX + this.savedVelocityY * this.savedVelocityY);
        const dirX = this.savedVelocityX / savedSpeed;
        const dirY = this.savedVelocityY / savedSpeed;
        this.setVelocity(
          dirX * this.baseSpeed,
          dirY * this.baseSpeed
        );
      } else {
        // Generate new random direction
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.setVelocity(
          Math.cos(angle) * this.baseSpeed,
          Math.sin(angle) * this.baseSpeed
        );
      }
    }
  }

  public getRobotState(): RobotState {
    return this.robotState;
  }

  private updateStateOverlay(): void {
    if (!this.stateOverlay) return;

    this.stateOverlay.clear();

    if (this.robotState === RobotState.FROZEN) {
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
    } else if (this.robotState === RobotState.SLOWED) {
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
    if (this.robotGraphics) {
      this.robotGraphics.destroy();
      this.robotGraphics = undefined;
    }
    super.destroy(fromScene);
  }
}
