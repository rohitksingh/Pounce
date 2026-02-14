import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = GameConfig;

    // Title
    const title = this.add.text(width / 2, height / 3, 'POUNCE', {
      fontSize: '64px',
      color: '#3498db',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 2 - 40, 'Territory Capture Game', {
      fontSize: '24px',
      color: '#ecf0f1'
    });
    subtitle.setOrigin(0.5);

    // Start button
    const startButton = this.add.text(width / 2, height / 2 + 40, 'START GAME', {
      fontSize: '32px',
      color: '#2ecc71',
      backgroundColor: '#1a1a1a',
      padding: { x: 20, y: 10 }
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setColor('#27ae60');
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#2ecc71');
    });

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Instructions
    const instructions = this.add.text(width / 2, height - 80,
      'Use WASD or Arrow Keys to move\nCapture 75% of territory to win!', {
      fontSize: '16px',
      color: '#95a5a6',
      align: 'center'
    });
    instructions.setOrigin(0.5);
  }
}
