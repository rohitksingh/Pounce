import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor(GameConfig.colors.void);

    // Placeholder text
    const text = this.add.text(
      GameConfig.width / 2,
      GameConfig.height / 2,
      'Game Scene Ready\n(Features coming in next tickets)',
      {
        fontSize: '24px',
        color: '#ecf0f1',
        align: 'center'
      }
    );
    text.setOrigin(0.5);
  }
}
