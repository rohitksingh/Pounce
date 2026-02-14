import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';

export class GameScene extends Phaser.Scene {
  private gridManager!: GridManager;
  private gridGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor(GameConfig.colors.void);

    // Initialize grid
    this.gridManager = new GridManager();

    // Create graphics object for rendering grid
    this.gridGraphics = this.add.graphics();

    // Render initial grid
    this.renderGrid();
  }

  update() {
    // Grid updates will happen here
  }

  private renderGrid(): void {
    this.gridGraphics.clear();

    const grid = this.gridManager.getGrid();
    const cellSize = GameConfig.cellSize;

    for (let y = 0; y < this.gridManager.getRows(); y++) {
      for (let x = 0; x < this.gridManager.getCols(); x++) {
        const state = grid[y][x];
        let color: number;

        switch (state) {
          case CellState.CAPTURED:
            color = GameConfig.colors.captured;
            break;
          case CellState.TRAIL:
            color = GameConfig.colors.trail;
            break;
          case CellState.VOID:
          default:
            continue; // Skip rendering void (background)
        }

        this.gridGraphics.fillStyle(color, 0.7);
        this.gridGraphics.fillRect(
          x * cellSize,
          y * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }
}
