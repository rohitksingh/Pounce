import { describe, it, expect } from 'vitest';
import { GameConfig } from '../../src/config/GameConfig';
import { LEVELS } from '../../src/config/LevelConfig';

/**
 * Integration tests for level progression system
 * Tests level configuration logic and transitions
 */
describe('Level Progression Integration', () => {
  describe('Level Configuration Data Flow', () => {
    it('should have 3 levels defined', () => {
      expect(LEVELS).toHaveLength(3);
    });

    it('should have level 1 with 5 cats, 70 speed, 85% win', () => {
      const level1 = LEVELS[0];
      expect(level1.catCount).toBe(5);
      expect(level1.catSpeed).toBe(70);
      expect(level1.winPercentage).toBe(85);
    });

    it('should have level 2 with 7 cats, 85 speed, 90% win', () => {
      const level2 = LEVELS[1];
      expect(level2.catCount).toBe(7);
      expect(level2.catSpeed).toBe(85);
      expect(level2.winPercentage).toBe(90);
    });

    it('should have level 3 with 10 cats, 100 speed, 95% win', () => {
      const level3 = LEVELS[2];
      expect(level3.catCount).toBe(10);
      expect(level3.catSpeed).toBe(100);
      expect(level3.winPercentage).toBe(95);
    });
  });

  describe('Level Detection Logic', () => {
    it('should detect next level exists for level 1', () => {
      const currentLevel = 1;
      const hasNextLevel = currentLevel < LEVELS.length;
      expect(hasNextLevel).toBe(true);
    });

    it('should detect next level exists for level 2', () => {
      const currentLevel = 2;
      const hasNextLevel = currentLevel < LEVELS.length;
      expect(hasNextLevel).toBe(true);
    });

    it('should detect no next level after level 3', () => {
      const currentLevel = 3;
      const hasNextLevel = currentLevel < LEVELS.length;
      expect(hasNextLevel).toBe(false);
    });
  });

  describe('GameConfig mutation', () => {
    it('should allow GameConfig to be mutated for level settings', () => {
      // Save original values
      const originalCats = GameConfig.initialCats;
      const originalSpeed = GameConfig.catSpeed;
      const originalWin = GameConfig.winPercentage;

      // Mutate to level 2 settings
      GameConfig.initialCats = 7;
      GameConfig.catSpeed = 85;
      GameConfig.winPercentage = 90;

      expect(GameConfig.initialCats).toBe(7);
      expect(GameConfig.catSpeed).toBe(85);
      expect(GameConfig.winPercentage).toBe(90);

      // Restore original
      GameConfig.initialCats = originalCats;
      GameConfig.catSpeed = originalSpeed;
      GameConfig.winPercentage = originalWin;
    });
  });
});
