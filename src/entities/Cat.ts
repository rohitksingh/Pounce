import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';

export class Cat extends Phaser.Physics.Arcade.Sprite {
  private gridManager: GridManager;

  constructor(scene: Phaser.Scene, x: number, y: number, gridManager: GridManager) {
    super(scene, x, y, '');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.gridManager = gridManager;

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

    // Check if cat is in VOID area (cats should stay in VOID)
    const gridX = Math.floor(this.x / GameConfig.cellSize);
    const gridY = Math.floor(this.y / GameConfig.cellSize);
    const cellState = this.gridManager.getCellState(gridX, gridY);

    // If cat enters captured territory, bounce back
    if (cellState === CellState.CAPTURED) {
      this.setVelocity(-this.body!.velocity.x, -this.body!.velocity.y);
    }
  }

  render(graphics: Phaser.GameObjects.Graphics): void {
    const radius = GameConfig.cellSize * 0.4;
    graphics.fillStyle(GameConfig.colors.cat, 1);
    graphics.fillCircle(this.x, this.y, radius);
  }
}
