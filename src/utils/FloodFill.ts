import { CellState, GameConfig } from '../config/GameConfig';
import { GridManager } from './GridManager';
import { Cat } from '../entities/Cat';
import { Robot } from '../entities/Robot';

// Type alias for enemy entities (can be Cat or Robot)
type Enemy = Cat | Robot;

export class FloodFill {
  static fillTerritory(
    gridManager: GridManager,
    trail: { x: number; y: number }[],
    cats: Enemy[]
  ): Enemy[] {
    if (trail.length === 0) return [];

    const catsToDestroy: Enemy[] = [];

    // Mark trail as captured first
    trail.forEach(point => {
      gridManager.setCellState(point.x, point.y, CellState.CAPTURED);
    });

    // Find void regions and determine which to fill
    const regions = this.findVoidRegions(gridManager);

    if (regions.length === 0) return catsToDestroy;

    const cols = gridManager.getCols();
    const rows = gridManager.getRows();

    // Find regions adjacent to old territory (captured cells that are NOT the new trail)
    const adjacentRegions = regions.filter(r =>
      this.isAdjacentToOldTerritory(r, gridManager, trail, cols, rows)
    );

    // The outer ocean is the LARGEST region adjacent to old territory
    // This is the QIX/Volfied standard: the ocean is where the player came from
    let outerOcean = null;
    if (adjacentRegions.length > 0) {
      outerOcean = adjacentRegions.reduce((largest, current) =>
        current.length > largest.length ? current : largest
      );
    }

    regions.forEach(region => {
      // Skip the outer ocean
      if (region === outerOcean) {
        return;
      }

      // Fill this enclosed region
      region.forEach(cell => {
        gridManager.setCellState(cell.x, cell.y, CellState.CAPTURED);
      });

      // Destroy any cats trapped in the enclosed region
      const hasCats = this.regionHasCats(region, cats);
      if (hasCats) {
        const trappedCats = this.getCatsInRegion(region, cats);
        catsToDestroy.push(...trappedCats);
      }
    });

    return catsToDestroy;
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

  /**
   * Determines if a VOID region is adjacent to old captured territory.
   *
   * "Old territory" = captured cells that existed BEFORE this loop (border + previous captures)
   * "New trail" = cells just marked as CAPTURED from completing the current loop
   *
   * The outer ocean is the region connected to where the player came from (old territory).
   * This is the QIX/Volfied standard algorithm - no heuristics needed.
   *
   * @param region - The VOID region to check
   * @param gridManager - The grid manager to access cell states
   * @param trail - The cells just marked as CAPTURED (the new loop)
   * @param cols - Grid width
   * @param rows - Grid height
   * @returns true if region touches old captured territory (not including the new trail)
   */
  private static isAdjacentToOldTerritory(
    region: { x: number; y: number }[],
    gridManager: GridManager,
    trail: { x: number; y: number }[],
    cols: number,
    rows: number
  ): boolean {
    const grid = gridManager.getGrid();

    // Create a set of trail cells for fast lookup
    const trailSet = new Set(trail.map(c => `${c.x},${c.y}`));

    // Check if any cell in the region is adjacent to old captured territory
    for (const cell of region) {
      const neighbors = [
        { x: cell.x - 1, y: cell.y },
        { x: cell.x + 1, y: cell.y },
        { x: cell.x, y: cell.y - 1 },
        { x: cell.x, y: cell.y + 1 }
      ];

      for (const n of neighbors) {
        // Skip out of bounds
        if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows) continue;

        // Check if neighbor is CAPTURED but NOT part of the new trail
        if (grid[n.y][n.x] === CellState.CAPTURED &&
            !trailSet.has(`${n.x},${n.y}`)) {
          return true;
        }
      }
    }

    return false;
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

  private static regionHasCats(region: { x: number; y: number }[], cats: Enemy[]): boolean {
    const cellSize = GameConfig.cellSize;

    return cats.some(cat => {
      const catGridX = Math.floor(cat.x / cellSize);
      const catGridY = Math.floor(cat.y / cellSize);

      return region.some(cell => cell.x === catGridX && cell.y === catGridY);
    });
  }

  private static getCatsInRegion(region: { x: number; y: number }[], cats: Enemy[]): Enemy[] {
    const cellSize = GameConfig.cellSize;
    const trappedCats: Enemy[] = [];

    cats.forEach(cat => {
      const catGridX = Math.floor(cat.x / cellSize);
      const catGridY = Math.floor(cat.y / cellSize);

      const isInRegion = region.some(cell => cell.x === catGridX && cell.y === catGridY);
      if (isInRegion) {
        trappedCats.push(cat);
      }
    });

    return trappedCats;
  }
}
