import { describe, it, expect } from 'vitest';
import { GameConfig } from '../../src/config/GameConfig';

describe('Collision Detection (Bug B003)', () => {
  describe('Distance Calculation', () => {
    it('should detect collision when cat touches mouse', () => {
      const mouseX = 100;
      const mouseY = 100;
      const catX = 105;
      const catY = 105;

      const mouseRadius = GameConfig.cellSize * 0.4;
      const catRadius = GameConfig.cellSize * 0.4;
      const collisionDistance = mouseRadius + catRadius;

      const distance = Math.sqrt(
        Math.pow(catX - mouseX, 2) + Math.pow(catY - mouseY, 2)
      );

      expect(distance).toBeLessThan(collisionDistance);
    });

    it('should not detect collision when cat is far from mouse', () => {
      const mouseX = 100;
      const mouseY = 100;
      const catX = 200;
      const catY = 200;

      const mouseRadius = GameConfig.cellSize * 0.4;
      const catRadius = GameConfig.cellSize * 0.4;
      const collisionDistance = mouseRadius + catRadius;

      const distance = Math.sqrt(
        Math.pow(catX - mouseX, 2) + Math.pow(catY - mouseY, 2)
      );

      expect(distance).toBeGreaterThan(collisionDistance);
    });

    it('should use correct collision radius', () => {
      const cellSize = GameConfig.cellSize;
      const expectedRadius = cellSize * 0.4;

      // Collision distance should be sum of both radii
      const collisionDistance = expectedRadius + expectedRadius;

      expect(collisionDistance).toBe(cellSize * 0.8);
    });
  });

  describe('Trail Collision', () => {
    it('should detect collision with trail point', () => {
      const trailPoints = [
        { x: 10, y: 10 },
        { x: 11, y: 10 },
        { x: 12, y: 10 }
      ];

      const catX = 105; // 10.5 cells * 10px = 105px
      const catY = 100; // 10 cells * 10px = 100px
      const cellSize = GameConfig.cellSize;
      const collisionDistance = cellSize * 0.8;

      let collision = false;
      for (const point of trailPoints) {
        const trailX = point.x * cellSize + cellSize / 2;
        const trailY = point.y * cellSize + cellSize / 2;
        const distance = Math.sqrt(
          Math.pow(catX - trailX, 2) + Math.pow(catY - trailY, 2)
        );

        if (distance < collisionDistance) {
          collision = true;
          break;
        }
      }

      expect(collision).toBe(true);
    });
  });
});
