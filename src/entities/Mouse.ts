import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';
import { CatGraphics } from '../utils/CatGraphics';

enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4
}

export class Mouse extends Phaser.GameObjects.Container {
  private gridX: number;
  private gridY: number;
  private visualX: number; // Smooth interpolated position for rendering
  private visualY: number;
  private gridManager: GridManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private trail: { x: number; y: number }[] = [];
  private isDrawingTrail: boolean = false;
  private currentDirection: Direction = Direction.NONE;
  private moveTimer: number = 0;
  private moveDelay: number = 150; // milliseconds between moves
  private baseMoveDelay: number = 150; // Base delay (used to calculate speed changes)
  private lerpSpeed: number = 0.3; // Interpolation speed (0-1, higher = faster)
  private catGraphics: Phaser.GameObjects.Graphics;
  private tailTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, gridManager: GridManager) {
    const cellSize = GameConfig.cellSize;
    super(scene, cellSize + cellSize / 2, cellSize + cellSize / 2);

    scene.add.existing(this);
    this.setDepth(10);

    this.gridManager = gridManager;

    // Create procedural cat graphics
    this.catGraphics = scene.add.graphics();
    const catSize = 35; // Visible size in pixels
    CatGraphics.drawCat(this.catGraphics, catSize, GameConfig.colors.mouse, 'player');
    this.add(this.catGraphics);

    // Add tail sway animation
    this.createTailAnimation();

    // Start position - random location in captured territory
    const spawnCell = gridManager.getRandomCapturedCell();
    if (spawnCell) {
      this.gridX = spawnCell.x;
      this.gridY = spawnCell.y;
    } else {
      // Fallback to center if no captured cells
      this.gridX = Math.floor(GameConfig.gridCols / 2);
      this.gridY = Math.floor(GameConfig.gridRows / 2);
    }
    this.visualX = this.gridX;
    this.visualY = this.gridY;

    // Update sprite position to match spawn
    this.x = this.gridX * cellSize + cellSize / 2;
    this.y = this.gridY * cellSize + cellSize / 2;

    // Initialize base move delay
    this.baseMoveDelay = this.moveDelay;

    // Set up input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(_time: number, delta: number): void {
    this.handleInput();
    this.handleAutoMovement(delta);
    this.updateVisualPosition();
    this.updateSpritePosition();
  }

  private createTailAnimation(): void {
    // Add a subtle tail sway animation for liveliness
    this.tailTween = this.scene.tweens.add({
      targets: this.catGraphics,
      angle: { from: -3, to: 3 },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private updateVisualPosition(): void {
    // Smoothly interpolate visual position towards grid position
    this.visualX = Phaser.Math.Linear(this.visualX, this.gridX, this.lerpSpeed);
    this.visualY = Phaser.Math.Linear(this.visualY, this.gridY, this.lerpSpeed);
  }

  private updateSpritePosition(): void {
    const cellSize = GameConfig.cellSize;
    this.x = this.visualX * cellSize + cellSize / 2;
    this.y = this.visualY * cellSize + cellSize / 2;

    // Flip cat based on movement direction
    if (this.currentDirection === Direction.LEFT) {
      this.catGraphics.setScale(-1, 1);
    } else if (this.currentDirection === Direction.RIGHT) {
      this.catGraphics.setScale(1, 1);
    }
  }

  private handleInput(): void {
    // Change direction based on key press
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!) || Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
      this.currentDirection = Direction.LEFT;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!) || Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
      this.currentDirection = Direction.RIGHT;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
      this.currentDirection = Direction.UP;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!) || Phaser.Input.Keyboard.JustDown(this.wasd.S)) {
      this.currentDirection = Direction.DOWN;
    }
  }

  private handleAutoMovement(delta: number): void {
    if (this.currentDirection === Direction.NONE) return;

    this.moveTimer += delta;

    if (this.moveTimer >= this.moveDelay) {
      this.moveTimer = 0;

      let newX = this.gridX;
      let newY = this.gridY;

      switch (this.currentDirection) {
        case Direction.UP:
          newY--;
          break;
        case Direction.DOWN:
          newY++;
          break;
        case Direction.LEFT:
          newX--;
          break;
        case Direction.RIGHT:
          newX++;
          break;
      }

      // Check bounds
      if (newX < 0 || newX >= this.gridManager.getCols() || newY < 0 || newY >= this.gridManager.getRows()) {
        this.currentDirection = Direction.NONE; // Stop at boundary
        return;
      }

      // Move to new position
      this.moveToGrid(newX, newY);
    }
  }

  private moveToGrid(newX: number, newY: number): void {
    const currentState = this.gridManager.getCellState(this.gridX, this.gridY);
    const targetState = this.gridManager.getCellState(newX, newY);

    // Update position
    this.gridX = newX;
    this.gridY = newY;

    // Handle trail logic
    if (currentState === CellState.CAPTURED && targetState === CellState.VOID) {
      // Starting to draw trail
      this.isDrawingTrail = true;
      this.trail = [{ x: newX, y: newY }];
      this.gridManager.setCellState(newX, newY, CellState.TRAIL);
    } else if (this.isDrawingTrail && targetState === CellState.VOID) {
      // Continue drawing trail
      this.trail.push({ x: newX, y: newY });
      this.gridManager.setCellState(newX, newY, CellState.TRAIL);
    } else if (this.isDrawingTrail && targetState === CellState.CAPTURED) {
      // Completed loop - trigger territory capture
      this.completeLoop();
    } else if (this.isDrawingTrail && targetState === CellState.TRAIL) {
      // Hit own trail - game over
      this.scene.events.emit('mouse-hit-trail');
    }
  }

  private completeLoop(): void {
    this.isDrawingTrail = false;
    this.scene.events.emit('loop-completed', this.trail);
    this.trail = [];
  }

  getGridPosition(): { x: number; y: number } {
    return { x: this.gridX, y: this.gridY };
  }

  getVisualPosition(): { x: number; y: number } {
    // Ensure visual positions are valid numbers
    const x = isNaN(this.visualX) ? this.gridX : this.visualX;
    const y = isNaN(this.visualY) ? this.gridY : this.visualY;
    return { x, y };
  }

  getTrail(): { x: number; y: number }[] {
    return this.trail;
  }

  isInVoid(): boolean {
    return this.isDrawingTrail;
  }

  resetTrail(): void {
    this.gridManager.clearTrail();
    this.trail = [];
    this.isDrawingTrail = false;
  }

  // Speed management methods
  public getSpeedMultiplier(): number {
    // Speed is inversely proportional to move delay
    // Higher delay = slower speed, lower delay = faster speed
    return this.baseMoveDelay / this.moveDelay;
  }

  public increaseSpeed(multiplier: number): void {
    // Decrease move delay to increase speed (multiplicative)
    // multiplier = 1.1 means 10% speed increase = delay / 1.1
    this.moveDelay = this.moveDelay / multiplier;

    // Cap at max speed (min delay)
    const maxMultiplier = GameConfig.maxSpeedMultiplier;
    const minDelay = this.baseMoveDelay / maxMultiplier;
    if (this.moveDelay < minDelay) {
      this.moveDelay = minDelay;
    }
  }

  public resetSpeed(): void {
    // Reset to base speed
    this.moveDelay = this.baseMoveDelay;
  }

  /**
   * Respawn the player at a random captured cell after death
   */
  public respawn(): void {
    // Get random captured cell from grid manager
    const spawnCell = this.gridManager.getRandomCapturedCell();

    if (!spawnCell) {
      console.error('[Mouse] No captured cells available for respawn');
      return;
    }

    console.log(`[Mouse] Respawning at (${spawnCell.x}, ${spawnCell.y})`);

    // Update grid position
    this.gridX = spawnCell.x;
    this.gridY = spawnCell.y;

    // Update visual position (no interpolation on spawn - instant teleport)
    this.visualX = spawnCell.x;
    this.visualY = spawnCell.y;

    // Update sprite position
    const cellSize = GameConfig.cellSize;
    this.x = spawnCell.x * cellSize + cellSize / 2;
    this.y = spawnCell.y * cellSize + cellSize / 2;

    // Clear trail
    this.trail = [];
    this.isDrawingTrail = false;

    // Reset direction to stopped
    this.currentDirection = Direction.NONE;
  }

  destroy(fromScene?: boolean): void {
    if (this.tailTween) {
      this.tailTween.remove();
      this.tailTween = undefined;
    }
    if (this.catGraphics) {
      this.catGraphics.destroy();
    }
    super.destroy(fromScene);
  }
}
