import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';
import { Mouse } from '../entities/Mouse';
import { Cat } from '../entities/Cat';
import { FloodFill } from '../utils/FloodFill';

export class GameScene extends Phaser.Scene {
  private gridManager!: GridManager;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private catGraphics!: Phaser.GameObjects.Graphics;
  private mouse!: Mouse;
  private cats: Cat[] = [];
  private lives: number = GameConfig.initialLives;
  private gameOver: boolean = false;
  private uiText!: Phaser.GameObjects.Text;

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

    // Listen for events
    this.events.on('loop-completed', this.handleLoopCompleted, this);
    this.events.on('mouse-hit-trail', this.handleMouseHit, this);

    // Create UI
    this.uiText = this.add.text(10, 10, '', {
      fontSize: '20px',
      color: '#ecf0f1',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });

    // Render initial grid
    this.renderGrid();
  }

  private handleLoopCompleted(trail: { x: number; y: number }[]): void {
    const catsToDestroy = FloodFill.fillTerritory(this.gridManager, trail, this.cats);
    this.mouse.resetTrail();

    // Destroy trapped cats
    if (catsToDestroy.length > 0) {
      catsToDestroy.forEach(cat => {
        cat.destroy();
      });
      // Remove from cats array
      this.cats = this.cats.filter(cat => !catsToDestroy.includes(cat));
    }

    // Check win condition
    const percentage = this.gridManager.getPercentageCaptured();
    if (percentage >= GameConfig.winPercentage) {
      this.gameOver = true;
      this.showWin();
    }
  }

  private showGameOver(): void {
    const text = this.add.text(
      GameConfig.width / 2,
      GameConfig.height / 2,
      'GAME OVER\n\nClick to Restart',
      {
        fontSize: '48px',
        color: '#e74c3c',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 20, y: 20 }
      }
    );
    text.setOrigin(0.5);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.scene.restart());
  }

  private showWin(): void {
    const percentage = this.gridManager.getPercentageCaptured();
    const text = this.add.text(
      GameConfig.width / 2,
      GameConfig.height / 2,
      `YOU WIN!\n\nCaptured: ${percentage.toFixed(1)}%\n\nClick to Play Again`,
      {
        fontSize: '48px',
        color: '#2ecc71',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 20, y: 20 }
      }
    );
    text.setOrigin(0.5);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.scene.restart());
  }

  update(time: number, delta: number) {
    if (this.gameOver) return;

    this.mouse.update(time, delta);
    this.checkCollisions();
    this.renderGrid();
    this.renderCats();
    this.updateUI();
  }

  private updateUI(): void {
    const percentage = this.gridManager.getPercentageCaptured();
    this.uiText.setText(`Territory: ${percentage.toFixed(1)}% | Lives: ${this.lives}`);
  }

  private checkCollisions(): void {
    if (!this.mouse.isInVoid()) return; // Mouse is safe on captured territory

    const mousePos = this.mouse.getGridPosition();
    const cellSize = GameConfig.cellSize;
    const mouseX = mousePos.x * cellSize + cellSize / 2;
    const mouseY = mousePos.y * cellSize + cellSize / 2;
    const mouseRadius = cellSize * 0.4;
    const catRadius = cellSize * 0.4;
    const collisionDistance = mouseRadius + catRadius;

    // Check if any cat is touching the mouse or trail
    for (const cat of this.cats) {
      // Check collision with mouse position
      const mouseDistance = Phaser.Math.Distance.Between(mouseX, mouseY, cat.x, cat.y);
      if (mouseDistance < collisionDistance) {
        this.handleMouseHit();
        return;
      }

      // Check if cat touches any point on the trail
      const trail = this.mouse.getTrail();
      for (const point of trail) {
        const trailX = point.x * cellSize + cellSize / 2;
        const trailY = point.y * cellSize + cellSize / 2;
        const trailDistance = Phaser.Math.Distance.Between(trailX, trailY, cat.x, cat.y);

        // Use same collision distance (cat radius + trail point radius)
        if (trailDistance < collisionDistance) {
          this.handleMouseHit();
          return;
        }
      }
    }
  }

  private handleMouseHit(): void {
    this.lives--;
    this.mouse.resetTrail();

    if (this.lives <= 0) {
      this.gameOver = true;
      this.showGameOver();
    }
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
