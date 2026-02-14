import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // For MVP, we're using simple shapes, so no assets to load
    // This is where we'd load sprites, sounds, etc.
  }

  create() {
    // Boot complete, go to menu
    this.scene.start('MenuScene');
  }
}
