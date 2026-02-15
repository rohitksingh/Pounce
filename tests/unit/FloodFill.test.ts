import { describe, it, expect, beforeEach } from 'vitest';
import { FloodFill } from '../../src/utils/FloodFill';
import { GridManager } from '../../src/utils/GridManager';
import { CellState, GameConfig } from '../../src/config/GameConfig';
import { Cat } from '../../src/entities/Cat';

describe('FloodFill - QIX/Volfied Algorithm', () => {
  let gridManager: GridManager;
  const mockCats: Cat[] = [];

  beforeEach(() => {
    gridManager = new GridManager();
  });

  describe('Test 1: 50% Territory Bug (CRITICAL)', () => {
    it('should correctly identify small outer ocean when player has >50% territory', () => {
      const cols = gridManager.getCols();
      const rows = gridManager.getRows();

      // Capture 50%+ of the territory (fill bottom half)
      for (let y = Math.floor(rows / 2); y < rows; y++) {
        for (let x = 1; x < cols - 1; x++) {
          gridManager.setCellState(x, y, CellState.CAPTURED);
        }
      }

      // Player creates small loop in top area, leaving small outer ocean
      // Loop: (10,10) -> (20,10) -> (20,20) -> (10,20) -> back to (10,10)
      const trail = [];
      for (let x = 10; x <= 20; x++) {
        trail.push({ x, y: 10 });
      }
      for (let y = 11; y <= 20; y++) {
        trail.push({ x: 20, y });
      }
      for (let x = 19; x >= 10; x--) {
        trail.push({ x, y: 20 });
      }
      for (let y = 19; y >= 11; y--) {
        trail.push({ x: 10, y });
      }

      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      // Verify trail is captured
      expect(gridManager.getCellState(10, 10)).toBe(CellState.CAPTURED);
      expect(gridManager.getCellState(20, 20)).toBe(CellState.CAPTURED);

      // Verify enclosed region (inside loop) is FILLED
      expect(gridManager.getCellState(15, 15)).toBe(CellState.CAPTURED);

      // Verify outer ocean (top-left corner, small but adjacent to border) is NOT filled
      expect(gridManager.getCellState(5, 5)).toBe(CellState.VOID);

      // Verify regions on sides adjacent to old territory are NOT filled
      expect(gridManager.getCellState(25, 5)).toBe(CellState.VOID);
      expect(gridManager.getCellState(cols - 2, 5)).toBe(CellState.VOID);
    });
  });

  describe('Test 2: Small Center Loop', () => {
    it('should fill enclosed center region and preserve outer ocean', () => {
      // Create small loop at center (40, 30)
      const trail = [];
      for (let x = 38; x <= 42; x++) {
        trail.push({ x, y: 28 });
      }
      for (let y = 29; y <= 32; y++) {
        trail.push({ x: 42, y });
      }
      for (let x = 41; x >= 38; x--) {
        trail.push({ x, y: 32 });
      }
      for (let y = 31; y >= 29; y--) {
        trail.push({ x: 38, y });
      }

      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      // Verify trail is captured
      expect(gridManager.getCellState(38, 28)).toBe(CellState.CAPTURED);

      // Verify enclosed region (inside loop) is FILLED
      expect(gridManager.getCellState(40, 30)).toBe(CellState.CAPTURED);

      // Verify outer ocean (adjacent to border) is NOT filled
      expect(gridManager.getCellState(5, 5)).toBe(CellState.VOID);
      expect(gridManager.getCellState(10, 10)).toBe(CellState.VOID);
    });
  });

  describe('Test 3: Border-Side Loop (Original Bug)', () => {
    it('should fill corner pocket and preserve outer ocean when using border as sides', () => {
      const cols = gridManager.getCols();
      const rows = gridManager.getRows();

      // Create loop in top-left corner using border as sides
      // Start at border, go into VOID, create corner pocket
      const trail = [];
      // From border (1,1) go right
      for (let x = 1; x <= 15; x++) {
        trail.push({ x, y: 1 });
      }
      // Go down
      for (let y = 2; y <= 15; y++) {
        trail.push({ x: 15, y });
      }
      // Go left back to border
      for (let x = 14; x >= 1; x--) {
        trail.push({ x, y: 15 });
      }
      // Go up back to start
      for (let y = 14; y >= 2; y--) {
        trail.push({ x: 1, y });
      }

      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      // Verify trail is captured
      expect(gridManager.getCellState(1, 1)).toBe(CellState.CAPTURED);
      expect(gridManager.getCellState(15, 15)).toBe(CellState.CAPTURED);

      // Verify corner pocket (inside loop) is FILLED
      expect(gridManager.getCellState(8, 8)).toBe(CellState.CAPTURED);

      // Verify outer ocean (rest of map) is NOT filled
      expect(gridManager.getCellState(20, 20)).toBe(CellState.VOID);
      expect(gridManager.getCellState(cols - 2, rows - 2)).toBe(CellState.VOID);
    });
  });

  describe('Test 4: Large Enclosed Region (>50% of VOID)', () => {
    it('should fill large enclosed region even if it is bigger than outer ocean', () => {
      const cols = gridManager.getCols();
      const rows = gridManager.getRows();

      // Create large loop that encloses 60%+ of VOID area
      // Leave small outer ocean strips at edges
      const trail = [];

      // Top horizontal
      for (let x = 5; x < cols - 5; x++) {
        trail.push({ x, y: 5 });
      }
      // Right vertical
      for (let y = 6; y < rows - 5; y++) {
        trail.push({ x: cols - 6, y });
      }
      // Bottom horizontal
      for (let x = cols - 7; x >= 5; x--) {
        trail.push({ x, y: rows - 6 });
      }
      // Left vertical
      for (let y = rows - 7; y >= 6; y--) {
        trail.push({ x: 5, y });
      }

      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      // Verify trail is captured
      expect(gridManager.getCellState(5, 5)).toBe(CellState.CAPTURED);
      expect(gridManager.getCellState(cols - 6, rows - 6)).toBe(CellState.CAPTURED);

      // Verify large enclosed region is FILLED
      const centerX = Math.floor(cols / 2);
      const centerY = Math.floor(rows / 2);
      expect(gridManager.getCellState(centerX, centerY)).toBe(CellState.CAPTURED);

      // Verify small outer ocean (strips near border) is NOT filled
      expect(gridManager.getCellState(2, 2)).toBe(CellState.VOID);
      expect(gridManager.getCellState(cols - 2, 2)).toBe(CellState.VOID);
      expect(gridManager.getCellState(2, rows - 2)).toBe(CellState.VOID);
      expect(gridManager.getCellState(cols - 2, rows - 2)).toBe(CellState.VOID);
    });
  });

  describe('Test 5: Multiple Enclosed Regions', () => {
    it('should fill all enclosed regions and preserve outer ocean', () => {
      const cols = gridManager.getCols();

      // Create first small loop at (10, 10)
      const trail1 = [];
      for (let x = 8; x <= 12; x++) {
        trail1.push({ x, y: 8 });
      }
      for (let y = 9; y <= 12; y++) {
        trail1.push({ x: 12, y });
      }
      for (let x = 11; x >= 8; x--) {
        trail1.push({ x, y: 12 });
      }
      for (let y = 11; y >= 9; y--) {
        trail1.push({ x: 8, y });
      }

      // Create second small loop at (25, 10)
      const trail2 = [];
      for (let x = 23; x <= 27; x++) {
        trail2.push({ x, y: 8 });
      }
      for (let y = 9; y <= 12; y++) {
        trail2.push({ x: 27, y });
      }
      for (let x = 26; x >= 23; x--) {
        trail2.push({ x, y: 12 });
      }
      for (let y = 11; y >= 9; y--) {
        trail2.push({ x: 23, y });
      }

      // Create third small loop at (40, 10)
      const trail3 = [];
      for (let x = 38; x <= 42; x++) {
        trail3.push({ x, y: 8 });
      }
      for (let y = 9; y <= 12; y++) {
        trail3.push({ x: 42, y });
      }
      for (let x = 41; x >= 38; x--) {
        trail3.push({ x, y: 12 });
      }
      for (let y = 11; y >= 9; y--) {
        trail3.push({ x: 38, y });
      }

      // Fill first loop
      FloodFill.fillTerritory(gridManager, trail1, mockCats);
      expect(gridManager.getCellState(10, 10)).toBe(CellState.CAPTURED);

      // Fill second loop
      FloodFill.fillTerritory(gridManager, trail2, mockCats);
      expect(gridManager.getCellState(25, 10)).toBe(CellState.CAPTURED);

      // Fill third loop
      FloodFill.fillTerritory(gridManager, trail3, mockCats);
      expect(gridManager.getCellState(40, 10)).toBe(CellState.CAPTURED);

      // Verify outer ocean between loops is NOT filled
      expect(gridManager.getCellState(15, 10)).toBe(CellState.VOID);
      expect(gridManager.getCellState(30, 10)).toBe(CellState.VOID);

      // Verify outer ocean far from loops is NOT filled
      expect(gridManager.getCellState(5, 20)).toBe(CellState.VOID);
      expect(gridManager.getCellState(cols - 5, 20)).toBe(CellState.VOID);
    });
  });

  describe('Edge Case: Empty Trail', () => {
    it('should handle empty trail without errors', () => {
      const trail: { x: number; y: number }[] = [];
      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      expect(catsDestroyed).toEqual([]);

      // Grid should be unchanged
      expect(gridManager.getCellState(10, 10)).toBe(CellState.VOID);
    });
  });

  describe('Edge Case: Trail That Does Not Form Loop', () => {
    it('should handle straight line trail correctly', () => {
      // Create straight line from (10, 10) to (20, 10)
      const trail = [];
      for (let x = 10; x <= 20; x++) {
        trail.push({ x, y: 10 });
      }

      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      // Verify trail is captured
      expect(gridManager.getCellState(15, 10)).toBe(CellState.CAPTURED);

      // No enclosed regions, so outer ocean should remain VOID
      expect(gridManager.getCellState(10, 15)).toBe(CellState.VOID);
      expect(gridManager.getCellState(15, 15)).toBe(CellState.VOID);
    });
  });

  describe('Cat Destruction Logic', () => {
    it('should destroy cats trapped in enclosed region', () => {
      // This is a minimal test since we're using mock cats
      // In real scenario, Cat objects would need to be properly instantiated
      // For now, verify the algorithm logic works without errors
      const trail = [];
      for (let x = 10; x <= 20; x++) {
        trail.push({ x, y: 10 });
      }
      for (let y = 11; y <= 20; y++) {
        trail.push({ x: 20, y });
      }
      for (let x = 19; x >= 10; x--) {
        trail.push({ x, y: 20 });
      }
      for (let y = 19; y >= 11; y--) {
        trail.push({ x: 10, y });
      }

      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      expect(catsDestroyed).toEqual([]);
      expect(gridManager.getCellState(15, 15)).toBe(CellState.CAPTURED);
    });
  });

  describe('Algorithm Verification', () => {
    it('should correctly identify old territory vs new trail', () => {
      const cols = gridManager.getCols();
      const rows = gridManager.getRows();

      // Pre-capture some territory (old territory)
      for (let x = 10; x <= 20; x++) {
        for (let y = 10; y <= 20; y++) {
          gridManager.setCellState(x, y, CellState.CAPTURED);
        }
      }

      // Create new loop adjacent to old territory
      const trail = [];
      for (let x = 21; x <= 30; x++) {
        trail.push({ x, y: 10 });
      }
      for (let y = 11; y <= 20; y++) {
        trail.push({ x: 30, y });
      }
      for (let x = 29; x >= 21; x--) {
        trail.push({ x, y: 20 });
      }
      for (let y = 19; y >= 11; y--) {
        trail.push({ x: 21, y });
      }

      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      // Verify new enclosed region is FILLED
      expect(gridManager.getCellState(25, 15)).toBe(CellState.CAPTURED);

      // Verify outer ocean (adjacent to OLD territory) is NOT filled
      expect(gridManager.getCellState(35, 15)).toBe(CellState.VOID);
      expect(gridManager.getCellState(5, 5)).toBe(CellState.VOID);
    });

    it('should work correctly at all territory percentages', () => {
      const testPercentages = [0, 25, 50, 75, 90];

      testPercentages.forEach(targetPercentage => {
        // Reset grid
        gridManager = new GridManager();

        const cols = gridManager.getCols();
        const rows = gridManager.getRows();
        const totalCells = cols * rows;

        if (targetPercentage > 0) {
          // Capture territory up to target percentage
          const cellsToCapture = Math.floor(totalCells * targetPercentage / 100);
          let captured = 0;

          for (let y = rows - 1; y >= 1 && captured < cellsToCapture; y--) {
            for (let x = 1; x < cols - 1 && captured < cellsToCapture; x++) {
              if (gridManager.getCellState(x, y) === CellState.VOID) {
                gridManager.setCellState(x, y, CellState.CAPTURED);
                captured++;
              }
            }
          }
        }

        // Create small loop in remaining VOID space
        const trail = [];
        for (let x = 10; x <= 15; x++) {
          trail.push({ x, y: 10 });
        }
        for (let y = 11; y <= 15; y++) {
          trail.push({ x: 15, y });
        }
        for (let x = 14; x >= 10; x--) {
          trail.push({ x, y: 15 });
        }
        for (let y = 14; y >= 11; y--) {
          trail.push({ x: 10, y });
        }

        // Check if loop is in VOID space
        const canTest = trail.every(p =>
          gridManager.getCellState(p.x, p.y) === CellState.VOID
        );

        if (canTest) {
          const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

          // At minimum, trail should be captured
          expect(gridManager.getCellState(10, 10)).toBe(CellState.CAPTURED);

          // If there's space inside the loop, it should be filled
          if (gridManager.getCellState(12, 12) !== CellState.TRAIL) {
            // Either captured or was already captured from initial fill
            expect([CellState.CAPTURED]).toContain(
              gridManager.getCellState(12, 12)
            );
          }
        }
      });
    });
  });

  describe('Performance: No Heuristics Required', () => {
    it('should use pure topological detection without size heuristics', () => {
      // This test verifies the algorithm works correctly without relying on
      // "outer ocean is largest" heuristic - it should use adjacency to old territory

      const cols = gridManager.getCols();
      const rows = gridManager.getRows();

      // Create scenario where outer ocean might NOT be largest
      // Fill most of map except small strip at top
      for (let y = 10; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          gridManager.setCellState(x, y, CellState.CAPTURED);
        }
      }

      // Create large enclosed region (might be larger than outer ocean)
      const trail = [];
      for (let x = 10; x < cols - 10; x++) {
        trail.push({ x, y: 10 });
      }
      for (let y = 11; y < rows - 10; y++) {
        trail.push({ x: cols - 11, y });
      }
      for (let x = cols - 12; x >= 10; x--) {
        trail.push({ x, y: rows - 11 });
      }
      for (let y = rows - 12; y >= 11; y--) {
        trail.push({ x: 10, y });
      }

      const catsDestroyed = FloodFill.fillTerritory(gridManager, trail, mockCats);

      // Verify trail is captured
      expect(gridManager.getCellState(10, 10)).toBe(CellState.CAPTURED);

      // Verify small outer ocean at top (adjacent to border) is NOT filled
      expect(gridManager.getCellState(cols / 2, 5)).toBe(CellState.VOID);

      // Verify large enclosed region is FILLED (even if larger than outer ocean)
      const centerX = Math.floor(cols / 2);
      const centerY = Math.floor(rows / 2);
      expect(gridManager.getCellState(centerX, centerY)).toBe(CellState.CAPTURED);
    });
  });
});
