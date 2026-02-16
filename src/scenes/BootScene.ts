import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('[BootScene] Starting asset preload...');

    // Create loading UI
    this.createLoadingScreen();

    // Add error handling for failed assets
    this.load.on('loaderror', (fileObj: any) => {
      console.error('[BootScene] Failed to load asset:', fileObj.key, fileObj.src);
    });

    // Update progress bar as assets load
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0xFFD700, 1);
      this.progressBar.fillRect(250, 290, 300 * value, 30);
      this.loadingText.setText(`Loading: ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      console.log('[BootScene] All assets loaded successfully');
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
    });

    // Create placeholder textures for sprites (background/terrain only)
    this.createSpriteTextures();
  }

  private createLoadingScreen(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading: 0%', {
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Progress bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(240, 280, 320, 50);

    // Progress bar border
    this.progressBox.lineStyle(3, 0xFFD700, 1);
    this.progressBox.strokeRect(240, 280, 320, 50);

    // Progress bar fill
    this.progressBar = this.add.graphics();
  }

  create() {
    console.log('[BootScene] Boot complete, transitioning to MenuScene');

    // Boot complete, go to menu
    try {
      this.scene.start('MenuScene');
    } catch (error) {
      console.error('[BootScene] Failed to start MenuScene:', error);
    }
  }

  private createSpriteTextures(): void {
    // Note: Cat and pirate sprites are now procedurally generated in-game
    // Only background textures are created here

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
