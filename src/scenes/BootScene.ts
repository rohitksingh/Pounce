import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create dynamic placeholder textures for sprites
    this.createSpriteTextures();
  }

  create() {
    // Boot complete, go to menu
    this.scene.start('MenuScene');
  }

  private createSpriteTextures(): void {
    const size = 32;
    const radius = 12;

    // Create CAT sprite (orange player)
    const catTexture = this.add.graphics();
    catTexture.fillStyle(0xFFA500, 1); // Orange
    catTexture.fillCircle(size / 2, size / 2, radius);
    catTexture.lineStyle(2, 0xFF8C00, 1); // Darker orange outline
    catTexture.strokeCircle(size / 2, size / 2, radius);
    // Add simple "ears"
    catTexture.fillStyle(0xFFA500, 1);
    catTexture.fillTriangle(size / 2 - 8, size / 2 - 8, size / 2 - 4, size / 2 - 12, size / 2, size / 2 - 8);
    catTexture.fillTriangle(size / 2 + 8, size / 2 - 8, size / 2 + 4, size / 2 - 12, size / 2, size / 2 - 8);
    catTexture.generateTexture('cat', size, size);
    catTexture.destroy();

    // Create PIRATE sprite (dark enemy with skull accent)
    const pirateTexture = this.add.graphics();
    pirateTexture.fillStyle(0x2C3E50, 1); // Dark blue-gray
    pirateTexture.fillCircle(size / 2, size / 2, radius);
    pirateTexture.lineStyle(2, 0x1A252F, 1); // Darker outline
    pirateTexture.strokeCircle(size / 2, size / 2, radius);
    // Add simple "hat" triangle
    pirateTexture.fillStyle(0x1A1A1A, 1);
    pirateTexture.fillTriangle(size / 2 - 10, size / 2 - 6, size / 2 + 10, size / 2 - 6, size / 2, size / 2 - 14);
    // Red accent (bandana)
    pirateTexture.fillStyle(0xE74C3C, 1);
    pirateTexture.fillRect(size / 2 - 10, size / 2 - 6, 20, 3);
    pirateTexture.generateTexture('pirate', size, size);
    pirateTexture.destroy();

    // Create SEA background texture (256x256 tileable)
    const seaSize = 256;
    const seaTexture = this.add.graphics();
    // Blue gradient
    const gradient = seaTexture.fillGradientStyle(0x1E3A5F, 0x1E3A5F, 0x2C5F8D, 0x2C5F8D, 1, 1, 1, 1);
    seaTexture.fillRect(0, 0, seaSize, seaSize);
    // Add some wave lines
    seaTexture.lineStyle(2, 0x3498DB, 0.3);
    for (let i = 0; i < 10; i++) {
      const y = (i * seaSize) / 10;
      seaTexture.beginPath();
      seaTexture.moveTo(0, y);
      seaTexture.lineTo(seaSize, y);
      seaTexture.strokePath();
    }
    seaTexture.generateTexture('sea', seaSize, seaSize);
    seaTexture.destroy();

    // Create ISLAND/DECK texture for captured territory
    const islandSize = 64;
    const islandTexture = this.add.graphics();
    islandTexture.fillStyle(0xD4A574, 1); // Sandy/wood color
    islandTexture.fillRect(0, 0, islandSize, islandSize);
    // Add wood grain lines
    islandTexture.lineStyle(1, 0xB8935C, 0.5);
    for (let i = 0; i < 8; i++) {
      const y = (i * islandSize) / 8;
      islandTexture.beginPath();
      islandTexture.moveTo(0, y);
      islandTexture.lineTo(islandSize, y);
      islandTexture.strokePath();
    }
    islandTexture.generateTexture('island', islandSize, islandSize);
    islandTexture.destroy();

    // Create TRAIL particle texture
    const particleSize = 8;
    const particleTexture = this.add.graphics();
    particleTexture.fillStyle(0xF1C40F, 1); // Yellow
    particleTexture.fillCircle(particleSize / 2, particleSize / 2, particleSize / 2);
    particleTexture.generateTexture('trail-particle', particleSize, particleSize);
    particleTexture.destroy();
  }
}
