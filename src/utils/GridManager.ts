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

    return (captured / total) * 100;
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
}
