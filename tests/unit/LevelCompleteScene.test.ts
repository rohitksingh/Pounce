import { describe, it, expect } from 'vitest';
import LevelCompleteScene from '../../src/scenes/LevelCompleteScene';

/**
 * Unit tests for LevelCompleteScene
 * Tests scene configuration
 */
describe('LevelCompleteScene', () => {
  describe('Scene Creation', () => {
    it('should create scene with correct key', () => {
      const scene = new LevelCompleteScene();
      expect(scene.scene.key).toBe('LevelCompleteScene');
    });
  });

  describe('Scene Structure', () => {
    it('should have create method that accepts level data', () => {
      const scene = new LevelCompleteScene();
      expect(scene.create).toBeDefined();
      expect(typeof scene.create).toBe('function');
    });
  });
});
