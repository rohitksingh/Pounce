import { describe, it, expect } from 'vitest';
import VictoryScene from '../../src/scenes/VictoryScene';

/**
 * Unit tests for VictoryScene
 * Tests victory screen configuration
 */
describe('VictoryScene', () => {
  describe('Scene Creation', () => {
    it('should create scene with correct key', () => {
      const scene = new VictoryScene();
      expect(scene.scene.key).toBe('VictoryScene');
    });
  });

  describe('Scene Structure', () => {
    it('should have create method that accepts percentage data', () => {
      const scene = new VictoryScene();
      expect(scene.create).toBeDefined();
      expect(typeof scene.create).toBe('function');
    });
  });
});
