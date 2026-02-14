import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';
import { Mouse } from '../entities/Mouse';
import { Cat } from '../entities/Cat';

export class GameScene extends Phaser.Scene {
  private gridManager!: GridManager;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private catGraphics!: Phaser.GameObjects.Graphics;
  private mouse!: Mouse;
  private cats: Cat[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor(GameConfig.colors.void);

    // Initialize grid
    this.gridManager = new GridManager();

    // Create graphics objects
    this.gridGraphics = this.add.graphics();
    this.catGraphics = this.add.graphics();

    // Create mouse player
    this.mouse = new Mouse(this, this.gridManager);

    // Spawn cats in VOID area
    this.spawnCats();

    // Render initial grid
    this.renderGrid();
  }

  update() {
    this.mouse.update();
    this.renderGrid();
    this.renderCats();
  }

  private spawnCats(): void {
    const cellSize = GameConfig.cellSize;
    const centerX = (this.gridManager.getCols() / 2) * cellSize;
    const centerY = (this.gridManager.getRows() / 2) * cellSize;

    for (let i = 0; i < GameConfig.initialCats; i++) {
      const offsetX = Phaser.Math.Between(-100, 100);
      const offsetY = Phaser.Math.Between(-100, 100);
      const cat = new Cat(this, centerX + offsetX, centerY + offsetY, this.gridManager);
      this.cats.push(cat);
    }
  }

  private renderCats(): void {
    this.catGraphics.clear();
    this.cats.forEach(cat => cat.render(this.catGraphics));
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
