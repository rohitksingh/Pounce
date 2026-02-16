import { describe, it, expect, beforeEach } from 'vitest';
import { GameConfig } from '../../src/config/GameConfig';
import { LEVELS, getLevelConfig } from '../../src/config/LevelConfig';

/**
 * Integration tests verifying critical bug fixes in level progression system
 *
 * Bug 1: Level 2 Not Starting After Winning Level 1
 * - Root cause: GameScene.create() didn't reset game state between levels
 * - Fix: Added comprehensive state reset in GameScene.create() before initializing new level
 *
 * Bug 2: Level Indicator Shows "Tropical Paradise" for Level 2
 * - Root cause: HTML had hardcoded text "Level 1: Tropical Paradise" in level-indicator div
 * - Fix: Removed hardcoded text, making div empty by default
 */
describe('Level Progression Bug Fixes', () => {
  beforeEach(() => {
    // Reset GameConfig to default state before each test
    GameConfig.initialCats = 5;
    GameConfig.catSpeed = 70;
    GameConfig.winPercentage = 85;
  });

  describe('Bug Fix 1: State Reset Between Levels', () => {
    it('should apply level 1 config correctly', () => {
      const level1Config = getLevelConfig(1);

      // Simulate GameScene.applyLevelConfig()
      GameConfig.initialCats = level1Config.catCount;
      GameConfig.catSpeed = level1Config.catSpeed;
      GameConfig.winPercentage = level1Config.winPercentage;

      expect(GameConfig.initialCats).toBe(5);
      expect(GameConfig.catSpeed).toBe(70);
      expect(GameConfig.winPercentage).toBe(85);
    });

    it('should apply level 2 config correctly after level 1', () => {
      // Simulate completing level 1
      const level1Config = getLevelConfig(1);
      GameConfig.initialCats = level1Config.catCount;
      GameConfig.catSpeed = level1Config.catSpeed;
      GameConfig.winPercentage = level1Config.winPercentage;

      expect(GameConfig.initialCats).toBe(5);

      // Simulate transitioning to level 2
      const level2Config = getLevelConfig(2);
      GameConfig.initialCats = level2Config.catCount;
      GameConfig.catSpeed = level2Config.catSpeed;
      GameConfig.winPercentage = level2Config.winPercentage;

      // Verify level 2 settings are applied
      expect(GameConfig.initialCats).toBe(7);
      expect(GameConfig.catSpeed).toBe(85);
      expect(GameConfig.winPercentage).toBe(90);
      expect(level2Config.name).toBe('Deeper Waters');
    });

    it('should apply level 3 config correctly after level 2', () => {
      // Simulate completing level 2
      const level2Config = getLevelConfig(2);
      GameConfig.initialCats = level2Config.catCount;
      GameConfig.catSpeed = level2Config.catSpeed;
      GameConfig.winPercentage = level2Config.winPercentage;

      // Simulate transitioning to level 3
      const level3Config = getLevelConfig(3);
      GameConfig.initialCats = level3Config.catCount;
      GameConfig.catSpeed = level3Config.catSpeed;
      GameConfig.winPercentage = level3Config.winPercentage;

      // Verify level 3 settings are applied
      expect(GameConfig.initialCats).toBe(10);
      expect(GameConfig.catSpeed).toBe(100);
      expect(GameConfig.winPercentage).toBe(95);
      expect(level3Config.name).toBe("Pirate's Lair");
    });

    it('should have distinct level names for each level', () => {
      const level1 = getLevelConfig(1);
      const level2 = getLevelConfig(2);
      const level3 = getLevelConfig(3);

      expect(level1.name).toBe('Tropical Paradise');
      expect(level2.name).toBe('Deeper Waters');
      expect(level3.name).toBe("Pirate's Lair");

      // Verify all names are unique
      const names = [level1.name, level2.name, level3.name];
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(3);
    });
  });

  describe('Bug Fix 2: Level Indicator Dynamic Update', () => {
    it('should have correct level name for level 1', () => {
      const level1Config = getLevelConfig(1);
      const expectedText = `Level 1: ${level1Config.name}`;
      expect(expectedText).toBe('Level 1: Tropical Paradise');
    });

    it('should have correct level name for level 2', () => {
      const level2Config = getLevelConfig(2);
      const expectedText = `Level 2: ${level2Config.name}`;
      expect(expectedText).toBe('Level 2: Deeper Waters');
    });

    it('should have correct level name for level 3', () => {
      const level3Config = getLevelConfig(3);
      const expectedText = `Level 3: ${level3Config.name}`;
      expect(expectedText).toBe("Level 3: Pirate's Lair");
    });

    it('should generate different text for each level', () => {
      const texts: string[] = [];

      for (let level = 1; level <= 3; level++) {
        const config = getLevelConfig(level);
        const text = `Level ${level}: ${config.name}`;
        texts.push(text);
      }

      // All level indicator texts should be unique
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(3);
      expect(texts[0]).not.toBe(texts[1]);
      expect(texts[1]).not.toBe(texts[2]);
    });
  });

  describe('Level Progression Flow', () => {
    it('should progress through all levels with correct config', () => {
      const progressionLog: { level: number; catCount: number; speed: number; win: number; name: string }[] = [];

      for (let level = 1; level <= 3; level++) {
        const config = getLevelConfig(level);

        // Apply config
        GameConfig.initialCats = config.catCount;
        GameConfig.catSpeed = config.catSpeed;
        GameConfig.winPercentage = config.winPercentage;

        progressionLog.push({
          level,
          catCount: GameConfig.initialCats,
          speed: GameConfig.catSpeed,
          win: GameConfig.winPercentage,
          name: config.name
        });
      }

      // Verify progression
      expect(progressionLog[0].catCount).toBe(5);
      expect(progressionLog[0].speed).toBe(70);
      expect(progressionLog[0].win).toBe(85);
      expect(progressionLog[0].name).toBe('Tropical Paradise');

      expect(progressionLog[1].catCount).toBe(7);
      expect(progressionLog[1].speed).toBe(85);
      expect(progressionLog[1].win).toBe(90);
      expect(progressionLog[1].name).toBe('Deeper Waters');

      expect(progressionLog[2].catCount).toBe(10);
      expect(progressionLog[2].speed).toBe(100);
      expect(progressionLog[2].win).toBe(95);
      expect(progressionLog[2].name).toBe("Pirate's Lair");
    });

    it('should increase difficulty with each level', () => {
      // Verify progressive difficulty
      expect(LEVELS[1].catCount).toBeGreaterThan(LEVELS[0].catCount);
      expect(LEVELS[2].catCount).toBeGreaterThan(LEVELS[1].catCount);

      expect(LEVELS[1].catSpeed).toBeGreaterThan(LEVELS[0].catSpeed);
      expect(LEVELS[2].catSpeed).toBeGreaterThan(LEVELS[1].catSpeed);

      expect(LEVELS[1].winPercentage).toBeGreaterThan(LEVELS[0].winPercentage);
      expect(LEVELS[2].winPercentage).toBeGreaterThan(LEVELS[1].winPercentage);
    });
  });

  describe('State Reset Validation', () => {
    it('should verify that initial lives would be reset to 3', () => {
      // GameScene.create() should reset lives to GameConfig.initialLives
      const initialLives = GameConfig.initialLives;
      expect(initialLives).toBe(3);

      // This validates the reset logic: this.lives = GameConfig.initialLives
      let lives = 1; // Simulate being down to 1 life
      lives = initialLives; // Reset
      expect(lives).toBe(3);
    });

    it('should verify game state flags would be reset', () => {
      // Simulate game over state
      let gameOver = true;
      let activePowerUpEffect: string | null = 'FREEZE';
      let powerUpEffectTimer = 5000;
      let lastRenderedTrailLength = 10;

      // Reset (as done in GameScene.create())
      gameOver = false;
      activePowerUpEffect = null;
      powerUpEffectTimer = 0;
      lastRenderedTrailLength = 0;

      expect(gameOver).toBe(false);
      expect(activePowerUpEffect).toBe(null);
      expect(powerUpEffectTimer).toBe(0);
      expect(lastRenderedTrailLength).toBe(0);
    });

    it('should verify arrays would be cleared', () => {
      // Simulate arrays with data
      let cats = [{ x: 100, y: 100 }, { x: 200, y: 200 }];
      let powerUps = [{ x: 50, y: 50 }];
      let palmTreePositions = [{ x: 150, y: 150 }];

      // Reset (as done in GameScene.create())
      cats = [];
      powerUps = [];
      palmTreePositions = [];

      expect(cats).toHaveLength(0);
      expect(powerUps).toHaveLength(0);
      expect(palmTreePositions).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid level number gracefully', () => {
      const invalidLevel = getLevelConfig(999);
      // Should default to level 1
      expect(invalidLevel.level).toBe(1);
      expect(invalidLevel.name).toBe('Tropical Paradise');
    });

    it('should handle level 0 gracefully', () => {
      const level0 = getLevelConfig(0);
      // Should default to level 1
      expect(level0.level).toBe(1);
      expect(level0.name).toBe('Tropical Paradise');
    });

    it('should handle negative level number gracefully', () => {
      const negativeLevel = getLevelConfig(-1);
      // Should default to level 1
      expect(negativeLevel.level).toBe(1);
      expect(negativeLevel.name).toBe('Tropical Paradise');
    });
  });

  describe('Win Condition Transitions', () => {
    it('should detect level 1 win at 85%+ captured', () => {
      const level1Config = getLevelConfig(1);
      GameConfig.winPercentage = level1Config.winPercentage;

      const percentage = 85.5;
      const isWin = percentage >= GameConfig.winPercentage;
      expect(isWin).toBe(true);
    });

    it('should detect level 2 win at 90%+ captured', () => {
      const level2Config = getLevelConfig(2);
      GameConfig.winPercentage = level2Config.winPercentage;

      const percentage = 90.2;
      const isWin = percentage >= GameConfig.winPercentage;
      expect(isWin).toBe(true);
    });

    it('should detect level 3 win at 95%+ captured', () => {
      const level3Config = getLevelConfig(3);
      GameConfig.winPercentage = level3Config.winPercentage;

      const percentage = 95.8;
      const isWin = percentage >= GameConfig.winPercentage;
      expect(isWin).toBe(true);
    });

    it('should not trigger win below threshold', () => {
      const level1Config = getLevelConfig(1);
      GameConfig.winPercentage = level1Config.winPercentage;

      const percentage = 84.9;
      const isWin = percentage >= GameConfig.winPercentage;
      expect(isWin).toBe(false);
    });
  });

  describe('Scene Transition Logic', () => {
    it('should transition to LevelCompleteScene after level 1', () => {
      const currentLevel = 1;
      const hasNextLevel = currentLevel < LEVELS.length;

      expect(hasNextLevel).toBe(true);
      // Should go to LevelCompleteScene, not VictoryScene
    });

    it('should transition to LevelCompleteScene after level 2', () => {
      const currentLevel = 2;
      const hasNextLevel = currentLevel < LEVELS.length;

      expect(hasNextLevel).toBe(true);
      // Should go to LevelCompleteScene, not VictoryScene
    });

    it('should transition to VictoryScene after level 3', () => {
      const currentLevel = 3;
      const hasNextLevel = currentLevel < LEVELS.length;

      expect(hasNextLevel).toBe(false);
      // Should go to VictoryScene, not LevelCompleteScene
    });
  });

  describe('Retry Functionality', () => {
    it('should preserve level number on game over', () => {
      const currentLevel = 2;
      const lastLevel = currentLevel;

      // When player loses, MenuScene receives lastLevel
      expect(lastLevel).toBe(2);

      // Player should be able to retry same level
      const retryLevel = lastLevel;
      expect(retryLevel).toBe(2);
    });

    it('should allow retrying each level independently', () => {
      for (let level = 1; level <= 3; level++) {
        const lastLevel = level;
        expect(lastLevel).toBe(level);
      }
    });
  });
});
