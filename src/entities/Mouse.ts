import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';

export class Mouse extends Phaser.GameObjects.Graphics {
  private gridX: number;
  private gridY: number;
  private gridManager: GridManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private trail: { x: number; y: number }[] = [];
  private isDrawingTrail: boolean = false;

  constructor(scene: Phaser.Scene, gridManager: GridManager) {
    super(scene);
    scene.add.existing(this);

    this.gridManager = gridManager;

    // Start position - top-left corner on captured border
    this.gridX = 1;
    this.gridY = 1;

    // Set up input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.render();
  }

  update(): void {
    this.handleInput();
    this.render();
  }

  private handleInput(): void {
    let newX = this.gridX;
    let newY = this.gridY;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!) || Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
      newX--;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!) || Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
      newX++;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
      newY--;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!) || Phaser.Input.Keyboard.JustDown(this.wasd.S)) {
      newY++;
    }

    // Check bounds
    if (newX < 0 || newX >= this.gridManager.getCols() || newY < 0 || newY >= this.gridManager.getRows()) {
      return; // Out of bounds
    }

    // Only move if position changed
    if (newX !== this.gridX || newY !== this.gridY) {
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

  private render(): void {
    this.clear();

    const cellSize = GameConfig.cellSize;
    const radius = cellSize * 0.4;

    // Draw mouse as blue circle
    this.fillStyle(GameConfig.colors.mouse, 1);
    this.fillCircle(
      this.gridX * cellSize + cellSize / 2,
      this.gridY * cellSize + cellSize / 2,
      radius
    );
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
