import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';

export class Cat extends Phaser.Physics.Arcade.Sprite {
  private gridManager: GridManager;
  private lastValidX: number;
  private lastValidY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, gridManager: GridManager) {
    super(scene, x, y, 'pirate');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.gridManager = gridManager;
    this.lastValidX = x;
    this.lastValidY = y;

    // Scale sprite to match cell size (doubled for better visibility)
    const cellSize = GameConfig.cellSize;
    this.setOrigin(0.5, 0.5);
    this.setScale((cellSize / 32) * 2);

    // Set random velocity
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = GameConfig.catSpeed;
    this.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    this.setCircle(GameConfig.cellSize * 0.4);
    this.setBounce(1, 1);
    this.setCollideWorldBounds(true);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

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
      // Update last valid position (cat is in void)
      this.lastValidX = this.x;
      this.lastValidY = this.y;
    }
  }
}
