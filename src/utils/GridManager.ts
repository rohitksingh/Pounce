import { CellState, GameConfig } from '../config/GameConfig';

export class GridManager {
  private grid: CellState[][];
  private cols: number;
  private rows: number;

  constructor() {
    this.cols = GameConfig.gridCols;
    this.rows = GameConfig.gridRows;
    this.grid = [];

    // Initialize grid with VOID
    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.grid[y][x] = CellState.VOID;
      }
    }

    // Set initial captured territory (border perimeter)
    this.initializeBorder();
  }

  private initializeBorder(): void {
    // Top and bottom rows
    for (let x = 0; x < this.cols; x++) {
      this.grid[0][x] = CellState.CAPTURED;
      this.grid[this.rows - 1][x] = CellState.CAPTURED;
    }

    // Left and right columns
    for (let y = 0; y < this.rows; y++) {
      this.grid[y][0] = CellState.CAPTURED;
      this.grid[y][this.cols - 1] = CellState.CAPTURED;
    }

    // Add center starting island
    this.initializeCenterIsland();
  }

  private initializeCenterIsland(): void {
    const centerX = Math.floor(this.cols / 2); // ~40 for 80 cols
    const centerY = Math.floor(this.rows / 2); // ~30 for 60 rows
    const islandRadius = 3; // Creates 7x7 island (bigger than player sprite)

    for (let dx = -islandRadius; dx <= islandRadius; dx++) {
      for (let dy = -islandRadius; dy <= islandRadius; dy++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
          this.grid[y][x] = CellState.CAPTURED;
        }
      }
    }
  }

  getCellState(x: number, y: number): CellState {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
      return CellState.VOID; // Out of bounds
    }
    return this.grid[y][x];
  }

  setCellState(x: number, y: number, state: CellState): void {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      this.grid[y][x] = state;
    }
  }

  getPercentageCaptured(): number {
    let captured = 0;
    let total = this.cols * this.rows;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === CellState.CAPTURED) {
          captured++;
        }
      }
    }

    const percentage = (captured / total) * 100;
    console.log(`[GridManager] Captured: ${captured}/${total} = ${percentage.toFixed(2)}%`);
    return percentage;
  }

  clearTrail(): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === CellState.TRAIL) {
          this.grid[y][x] = CellState.VOID;
        }
      }
    }
  }

  getGrid(): CellState[][] {
    return this.grid;
  }

  getCols(): number {
    return this.cols;
  }

  getRows(): number {
    return this.rows;
  }

  /**
   * Get a random captured cell for player spawn
   * Excludes border cells (2-cell margin) for safety
   * @returns {x, y} coordinates of random captured cell, or null if none available
   */
  getRandomCapturedCell(): { x: number; y: number } | null {
    const capturedCells: { x: number; y: number }[] = [];

    // Collect all CAPTURED cells (excluding border for safety)
    for (let y = 2; y < this.rows - 2; y++) {
      for (let x = 2; x < this.cols - 2; x++) {
        if (this.grid[y][x] === CellState.CAPTURED) {
          capturedCells.push({ x, y });
        }
      }
    }

    if (capturedCells.length === 0) {
      // Fallback to center if no captured cells available
      console.warn('[GridManager] No captured cells available for spawn, using center');
      return {
        x: Math.floor(this.cols / 2),
        y: Math.floor(this.rows / 2)
      };
    }

    // Return random captured cell
    const randomIndex = Math.floor(Math.random() * capturedCells.length);
    const spawnCell = capturedCells[randomIndex];
    console.log(`[GridManager] Random spawn selected: (${spawnCell.x}, ${spawnCell.y}) from ${capturedCells.length} captured cells`);
    return spawnCell;
  }
}
