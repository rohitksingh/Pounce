import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GameConfig.width,
  height: GameConfig.height,
  parent: 'game-container',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: GameConfig.physics.gravity,
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene]
};

new Phaser.Game(config);
