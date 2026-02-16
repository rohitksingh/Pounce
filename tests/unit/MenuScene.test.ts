import { describe, it, expect } from 'vitest';
import { MenuScene } from '../../src/scenes/MenuScene';

/**
 * Unit tests for MenuScene
 * Tests menu configuration and retry functionality
 */
describe('MenuScene', () => {
  describe('Scene Creation', () => {
    it('should create scene with correct key', () => {
      const scene = new MenuScene();
      expect(scene.scene.key).toBe('MenuScene');
    });
  });

  describe('Scene Structure', () => {
    it('should have create method that optionally accepts lastLevel data', () => {
      const scene = new MenuScene();
      expect(scene.create).toBeDefined();
      expect(typeof scene.create).toBe('function');
    });

    it('should handle undefined data', () => {
      const scene = new MenuScene();
      expect(() => scene.create()).not.toThrow();
    });

    it('should handle lastLevel data', () => {
      const scene = new MenuScene();
      expect(() => scene.create({ lastLevel: 2 })).not.toThrow();
    });
  });
});
