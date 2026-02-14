import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';

enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4
}

export class Mouse extends Phaser.GameObjects.Sprite {
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
  private lerpSpeed: number = 0.3; // Interpolation speed (0-1, higher = faster)

  constructor(scene: Phaser.Scene, gridManager: GridManager) {
    const cellSize = GameConfig.cellSize;
    super(scene, cellSize + cellSize / 2, cellSize + cellSize / 2, 'cat');

    scene.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setScale(cellSize / 32); // Scale sprite to match cell size

    this.gridManager = gridManager;

    // Start position - top-left corner on captured border
    this.gridX = 1;
    this.gridY = 1;
    this.visualX = 1;
    this.visualY = 1;

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

  private updateVisualPosition(): void {
    // Smoothly interpolate visual position towards grid position
    this.visualX = Phaser.Math.Linear(this.visualX, this.gridX, this.lerpSpeed);
    this.visualY = Phaser.Math.Linear(this.visualY, this.gridY, this.lerpSpeed);
  }

  private updateSpritePosition(): void {
    const cellSize = GameConfig.cellSize;
    this.x = this.visualX * cellSize + cellSize / 2;
    this.y = this.visualY * cellSize + cellSize / 2;
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
}
