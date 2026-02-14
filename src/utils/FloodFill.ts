import { CellState, GameConfig } from '../config/GameConfig';
import { GridManager } from './GridManager';
import { Cat } from '../entities/Cat';

export class FloodFill {
  static fillTerritory(
    gridManager: GridManager,
    trail: { x: number; y: number }[],
    cats: Cat[]
  ): void {
    if (trail.length === 0) return;

    const cols = gridManager.getCols();
    const rows = gridManager.getRows();

    // Mark trail as captured first
    trail.forEach(point => {
      gridManager.setCellState(point.x, point.y, CellState.CAPTURED);
    });

    // Find void regions and determine which to fill
    const regions = this.findVoidRegions(gridManager);

    // Fill the smaller region(s) or the one without cats
    regions.forEach(region => {
      const hasCats = this.regionHasCats(region, cats);

      // Fill region if it doesn't have cats, or if it's smaller
      if (!hasCats || region.length < (cols * rows) / 2) {
        region.forEach(cell => {
          gridManager.setCellState(cell.x, cell.y, CellState.CAPTURED);
        });
      }
    });
  }

  private static findVoidRegions(gridManager: GridManager): { x: number; y: number }[][] {
    const grid = gridManager.getGrid();
    const cols = gridManager.getCols();
    const rows = gridManager.getRows();
    const visited: boolean[][] = [];
    const regions: { x: number; y: number }[][] = [];

    // Initialize visited array
    for (let y = 0; y < rows; y++) {
      visited[y] = [];
      for (let x = 0; x < cols; x++) {
        visited[y][x] = false;
      }
    }

    // Find all void regions
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!visited[y][x] && grid[y][x] === CellState.VOID) {
          const region = this.floodFillRegion(gridManager, x, y, visited);
          if (region.length > 0) {
            regions.push(region);
          }
        }
      }
    }

    return regions;
  }

  private static floodFillRegion(
    gridManager: GridManager,
    startX: number,
    startY: number,
    visited: boolean[][]
  ): { x: number; y: number }[] {
    const grid = gridManager.getGrid();
    const cols = gridManager.getCols();
    const rows = gridManager.getRows();
    const region: { x: number; y: number }[] = [];
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];

    while (queue.length > 0) {
      const cell = queue.shift()!;
      const { x, y } = cell;

      if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
      if (visited[y][x]) continue;
      if (grid[y][x] !== CellState.VOID) continue;

      visited[y][x] = true;
      region.push({ x, y });

      // Add neighbors
      queue.push({ x: x + 1, y });
      queue.push({ x: x - 1, y });
      queue.push({ x, y: y + 1 });
      queue.push({ x, y: y - 1 });
    }

    return region;
  }

  private static regionHasCats(region: { x: number; y: number }[], cats: Cat[]): boolean {
    const cellSize = GameConfig.cellSize;

    return cats.some(cat => {
      const catGridX = Math.floor(cat.x / cellSize);
      const catGridY = Math.floor(cat.y / cellSize);

      return region.some(cell => cell.x === catGridX && cell.y === catGridY);
    });
  }
}
