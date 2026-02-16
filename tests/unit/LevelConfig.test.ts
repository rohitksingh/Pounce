import { describe, it, expect } from 'vitest';
import { LEVELS, getLevelConfig, LevelDefinition } from '../../src/config/LevelConfig';

describe('LevelConfig', () => {
  describe('LEVELS configuration', () => {
    it('should have exactly 3 levels defined', () => {
      expect(LEVELS).toHaveLength(3);
    });

    it('should have sequential level numbers starting from 1', () => {
      expect(LEVELS[0].level).toBe(1);
      expect(LEVELS[1].level).toBe(2);
      expect(LEVELS[2].level).toBe(3);
    });

    it('should have correct Level 1 configuration', () => {
      const level1 = LEVELS[0];
      expect(level1).toEqual({
        level: 1,
        name: 'Tropical Paradise',
        catCount: 5,
        catSpeed: 70,
        winPercentage: 85,
        theme: 'tropical'
      });
    });

    it('should have correct Level 2 configuration', () => {
      const level2 = LEVELS[1];
      expect(level2).toEqual({
        level: 2,
        name: 'Deeper Waters',
        catCount: 7,
        catSpeed: 85,
        winPercentage: 90,
        theme: 'tropical'
      });
    });

    it('should have correct Level 3 configuration', () => {
      const level3 = LEVELS[2];
      expect(level3).toEqual({
        level: 3,
        name: 'Pirate\'s Lair',
        catCount: 10,
        catSpeed: 100,
        winPercentage: 95,
        theme: 'tropical'
      });
    });

    it('should have progressive difficulty (increasing cat count)', () => {
      expect(LEVELS[1].catCount).toBeGreaterThan(LEVELS[0].catCount);
      expect(LEVELS[2].catCount).toBeGreaterThan(LEVELS[1].catCount);
    });

    it('should have progressive difficulty (increasing cat speed)', () => {
      expect(LEVELS[1].catSpeed).toBeGreaterThan(LEVELS[0].catSpeed);
      expect(LEVELS[2].catSpeed).toBeGreaterThan(LEVELS[1].catSpeed);
    });

    it('should have progressive difficulty (increasing win percentage)', () => {
      expect(LEVELS[1].winPercentage).toBeGreaterThan(LEVELS[0].winPercentage);
      expect(LEVELS[2].winPercentage).toBeGreaterThan(LEVELS[1].winPercentage);
    });
  });

  describe('getLevelConfig()', () => {
    it('should return level 1 config when passed 1', () => {
      const config = getLevelConfig(1);
      expect(config.level).toBe(1);
      expect(config.catCount).toBe(5);
    });

    it('should return level 2 config when passed 2', () => {
      const config = getLevelConfig(2);
      expect(config.level).toBe(2);
      expect(config.catCount).toBe(7);
    });

    it('should return level 3 config when passed 3', () => {
      const config = getLevelConfig(3);
      expect(config.level).toBe(3);
      expect(config.catCount).toBe(10);
    });

    it('should return level 1 config when passed 0 (invalid)', () => {
      const config = getLevelConfig(0);
      expect(config.level).toBe(1);
      expect(config.catCount).toBe(5);
    });

    it('should return level 1 config when passed negative number', () => {
      const config = getLevelConfig(-1);
      expect(config.level).toBe(1);
    });

    it('should return level 1 config when passed number > 3', () => {
      const config = getLevelConfig(99);
      expect(config.level).toBe(1);
    });

    it('should return level 1 config as default fallback', () => {
      const config = getLevelConfig(4);
      expect(config).toBe(LEVELS[0]);
    });
  });

  describe('LevelDefinition interface', () => {
    it('should have all required properties', () => {
      const level: LevelDefinition = LEVELS[0];
      expect(level).toHaveProperty('level');
      expect(level).toHaveProperty('name');
      expect(level).toHaveProperty('catCount');
      expect(level).toHaveProperty('catSpeed');
      expect(level).toHaveProperty('winPercentage');
      expect(level).toHaveProperty('theme');
    });
  });
});
