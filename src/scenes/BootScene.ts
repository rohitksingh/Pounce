import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load cat animation frames
    this.loadCatAnimations();

    // Create placeholder textures for other sprites
    this.createSpriteTextures();
  }

  private loadCatAnimations(): void {
    // Load Idle animation frames (10 frames)
    for (let i = 1; i <= 10; i++) {
      this.load.image(`cat-idle-${i}`, `assets/sprites/cat/Idle (${i}).png`);
    }

    // Load Walk animation frames (10 frames)
    for (let i = 1; i <= 10; i++) {
      this.load.image(`cat-walk-${i}`, `assets/sprites/cat/Walk (${i}).png`);
    }

    // Load Hurt animation frames (10 frames) - for when hit
    for (let i = 1; i <= 10; i++) {
      this.load.image(`cat-hurt-${i}`, `assets/sprites/cat/Hurt (${i}).png`);
    }

    // Load Dead animation frames (10 frames) - for game over
    for (let i = 1; i <= 10; i++) {
      this.load.image(`cat-dead-${i}`, `assets/sprites/cat/Dead (${i}).png`);
    }
  }

  create() {
    // Boot complete, go to menu
    this.scene.start('MenuScene');
  }

  private createSpriteTextures(): void {
    const size = 32;
    const radius = 12;

    // Cat sprite is now loaded from animation frames, no need to create placeholder

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
    seaTexture.fillGradientStyle(0x1E3A5F, 0x1E3A5F, 0x2C5F8D, 0x2C5F8D, 1, 1, 1, 1);
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
