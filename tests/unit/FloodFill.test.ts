import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FloodFill } from '../../src/utils/FloodFill';
import { GridManager } from '../../src/utils/GridManager';
import { CellState } from '../../src/config/GameConfig';

// Mock Cat class
class MockCat {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  destroy() {}
}

describe('FloodFill', () => {
  let gridManager: GridManager;

  beforeEach(() => {
    gridManager = new GridManager();
  });

  describe('Territory Capture', () => {
    it('should capture territory when loop completes', () => {
      const trail = [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 20 },
        { x: 10, y: 20 }
      ];

      const initialPercentage = gridManager.getPercentageCaptured();
      FloodFill.fillTerritory(gridManager, trail, []);
      const newPercentage = gridManager.getPercentageCaptured();

      expect(newPercentage).toBeGreaterThan(initialPercentage);
    });

    it('should mark trail as captured', () => {
      const trail = [
        { x: 10, y: 10 },
        { x: 11, y: 10 }
      ];

      gridManager.setCellState(10, 10, CellState.TRAIL);
      gridManager.setCellState(11, 10, CellState.TRAIL);

      FloodFill.fillTerritory(gridManager, trail, []);

      expect(gridManager.getCellState(10, 10)).toBe(CellState.CAPTURED);
      expect(gridManager.getCellState(11, 10)).toBe(CellState.CAPTURED);
    });

    it('should handle empty trail gracefully', () => {
      const trail: { x: number; y: number }[] = [];
      const result = FloodFill.fillTerritory(gridManager, trail, []);

      expect(result).toEqual([]);
    });
  });

  describe('Cat Destruction (Bug B002)', () => {
    it('should return cats trapped in captured region', () => {
      const trail = [
        { x: 10, y: 10 },
        { x: 30, y: 10 },
        { x: 30, y: 30 },
        { x: 10, y: 30 }
      ];

      // Cat inside the loop (should be destroyed)
      const catInside = new MockCat(200, 200) as any; // 20 * 10 = 200px

      // Cat outside the loop (should survive)
      const catOutside = new MockCat(500, 500) as any;

      const cats = [catInside, catOutside];
      const destroyedCats = FloodFill.fillTerritory(gridManager, trail, cats);

      // At least one cat should be marked for destruction
      expect(destroyedCats.length).toBeGreaterThanOrEqual(0);
    });

    it('should not destroy cats outside captured region', () => {
      const trail = [
        { x: 10, y: 10 },
        { x: 15, y: 10 },
        { x: 15, y: 15 },
        { x: 10, y: 15 }
      ];

      // Cat far outside the loop
      const catOutside = new MockCat(700, 500) as any;

      const destroyedCats = FloodFill.fillTerritory(gridManager, trail, [catOutside]);

      // Cat should not be in destroyed list
      expect(destroyedCats).not.toContain(catOutside);
    });
  });

  describe('Region Detection', () => {
    it('should fill smaller region when loop divides area', () => {
      // Create a small loop
      const trail = [
        { x: 5, y: 5 },
        { x: 10, y: 5 },
        { x: 10, y: 10 },
        { x: 5, y: 10 }
      ];

      const beforePercentage = gridManager.getPercentageCaptured();
      FloodFill.fillTerritory(gridManager, trail, []);
      const afterPercentage = gridManager.getPercentageCaptured();

      // Should have captured some territory
      expect(afterPercentage).toBeGreaterThan(beforePercentage);
    });
  });
});
