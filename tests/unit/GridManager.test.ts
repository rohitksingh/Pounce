import { describe, it, expect, beforeEach } from 'vitest';
import { GridManager } from '../../src/utils/GridManager';
import { CellState, GameConfig } from '../../src/config/GameConfig';

describe('GridManager', () => {
  let gridManager: GridManager;

  beforeEach(() => {
    gridManager = new GridManager();
  });

  describe('Initialization', () => {
    it('should initialize with correct dimensions', () => {
      expect(gridManager.getCols()).toBe(GameConfig.gridCols);
      expect(gridManager.getRows()).toBe(GameConfig.gridRows);
    });

    it('should initialize border as captured', () => {
      // Top left corner
      expect(gridManager.getCellState(0, 0)).toBe(CellState.CAPTURED);

      // Top right corner
      expect(gridManager.getCellState(GameConfig.gridCols - 1, 0)).toBe(CellState.CAPTURED);

      // Bottom left corner
      expect(gridManager.getCellState(0, GameConfig.gridRows - 1)).toBe(CellState.CAPTURED);

      // Bottom right corner
      expect(gridManager.getCellState(GameConfig.gridCols - 1, GameConfig.gridRows - 1)).toBe(CellState.CAPTURED);
    });

    it('should initialize center as void', () => {
      const centerX = Math.floor(GameConfig.gridCols / 2);
      const centerY = Math.floor(GameConfig.gridRows / 2);

      expect(gridManager.getCellState(centerX, centerY)).toBe(CellState.VOID);
    });
  });

  describe('Cell State Management', () => {
    it('should set and get cell state correctly', () => {
      gridManager.setCellState(5, 5, CellState.TRAIL);
      expect(gridManager.getCellState(5, 5)).toBe(CellState.TRAIL);

      gridManager.setCellState(5, 5, CellState.CAPTURED);
      expect(gridManager.getCellState(5, 5)).toBe(CellState.CAPTURED);
    });

    it('should return VOID for out of bounds coordinates', () => {
      expect(gridManager.getCellState(-1, 0)).toBe(CellState.VOID);
      expect(gridManager.getCellState(0, -1)).toBe(CellState.VOID);
      expect(gridManager.getCellState(1000, 1000)).toBe(CellState.VOID);
    });

    it('should not set state for out of bounds coordinates', () => {
      gridManager.setCellState(-1, 0, CellState.CAPTURED);
      gridManager.setCellState(1000, 1000, CellState.CAPTURED);
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate initial percentage correctly', () => {
      const percentage = gridManager.getPercentageCaptured();
      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThan(100);
    });

    it('should update percentage when capturing territory', () => {
      const initialPercentage = gridManager.getPercentageCaptured();

      // Capture some cells
      for (let x = 10; x < 20; x++) {
        for (let y = 10; y < 20; y++) {
          gridManager.setCellState(x, y, CellState.CAPTURED);
        }
      }

      const newPercentage = gridManager.getPercentageCaptured();
      expect(newPercentage).toBeGreaterThan(initialPercentage);
    });

    it('should return 100% when all cells captured', () => {
      for (let y = 0; y < GameConfig.gridRows; y++) {
        for (let x = 0; x < GameConfig.gridCols; x++) {
          gridManager.setCellState(x, y, CellState.CAPTURED);
        }
      }

      expect(gridManager.getPercentageCaptured()).toBe(100);
    });
  });

  describe('Trail Management', () => {
    it('should clear trail cells', () => {
      gridManager.setCellState(5, 5, CellState.TRAIL);
      gridManager.setCellState(6, 5, CellState.TRAIL);
      gridManager.setCellState(7, 5, CellState.TRAIL);

      gridManager.clearTrail();

      expect(gridManager.getCellState(5, 5)).toBe(CellState.VOID);
      expect(gridManager.getCellState(6, 5)).toBe(CellState.VOID);
      expect(gridManager.getCellState(7, 5)).toBe(CellState.VOID);
    });

    it('should not affect captured cells when clearing trail', () => {
      gridManager.setCellState(5, 5, CellState.CAPTURED);
      gridManager.setCellState(6, 5, CellState.TRAIL);

      gridManager.clearTrail();

      expect(gridManager.getCellState(5, 5)).toBe(CellState.CAPTURED);
      expect(gridManager.getCellState(6, 5)).toBe(CellState.VOID);
    });
  });
});
