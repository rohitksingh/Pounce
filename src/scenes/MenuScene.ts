import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(data?: { lastLevel?: number }) {
    console.log('[MenuScene] Menu scene started');

    // Hide all game UI elements when menu starts
    const levelIndicator = document.getElementById('level-indicator');
    if (levelIndicator) {
      levelIndicator.style.display = 'none';
    } else {
      console.error('[MenuScene] UI element missing: level-indicator');
    }

    const uiContainer = document.getElementById('ui-container');
    if (uiContainer) {
      uiContainer.style.display = 'none';
    } else {
      console.error('[MenuScene] UI element missing: ui-container');
    }

    const powerupContainer = document.getElementById('powerup-container');
    if (powerupContainer) {
      powerupContainer.style.display = 'none';
    } else {
      console.error('[MenuScene] UI element missing: powerup-container');
    }

    const { width, height } = GameConfig;

    // Title
    const title = this.add.text(width / 2, height / 3, 'POUNCE', {
      fontSize: '64px',
      color: GameConfig.colors.menuTitle,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 2 - 60, 'Cat vs Robot Invasion', {
      fontSize: '24px',
      color: GameConfig.colors.menuText
    });
    subtitle.setOrigin(0.5);

    // Story text
    const story = this.add.text(width / 2, height / 2 - 20,
      'Alien robots have conquered Earth.\nOne brave cat must restore nature...', {
      fontSize: '16px',
      color: '#95a5a6',
      align: 'center'
    });
    story.setOrigin(0.5);

    // Start button
    const startButton = this.add.text(width / 2, height / 2 + 40, 'START GAME', {
      fontSize: '32px',
      color: GameConfig.colors.menuButton,
      backgroundColor: '#1a1a1a',
      padding: { x: 20, y: 10 }
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    // Track focus state for keyboard navigation
    let startButtonFocused = false;

    startButton.on('pointerover', () => {
      startButton.setColor(GameConfig.colors.menuButtonHover);
      startButton.setStroke('#FFD700', 2);
      startButtonFocused = true;
    });

    startButton.on('pointerout', () => {
      if (!startButtonFocused) {
        startButton.setColor(GameConfig.colors.menuButton);
        startButton.setStroke('', 0);
      }
    });

    startButton.on('pointerdown', () => {
      console.log('[MenuScene] START GAME clicked, starting at Level 1');
      try {
        this.scene.start('GameScene', { level: 1 });
      } catch (error) {
        console.error('[MenuScene] Failed to start GameScene:', error);
      }
    });

    // Keyboard focus indicator - Tab key support
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      if (!startButtonFocused) {
        startButton.setColor(GameConfig.colors.menuButtonHover);
        startButton.setStroke('#FFD700', 3);
        startButtonFocused = true;
      } else {
        startButton.setColor(GameConfig.colors.menuButton);
        startButton.setStroke('', 0);
        startButtonFocused = false;
      }
    });

    // Keyboard accessibility - Enter/Space to start game
    this.input.keyboard?.on('keydown-ENTER', () => {
      console.log('[MenuScene] START GAME via Enter key');
      try {
        this.scene.start('GameScene', { level: 1 });
      } catch (error) {
        console.error('[MenuScene] Failed to start GameScene:', error);
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      console.log('[MenuScene] START GAME via Space key');
      try {
        this.scene.start('GameScene', { level: 1 });
      } catch (error) {
        console.error('[MenuScene] Failed to start GameScene:', error);
      }
    });

    // If player died, show option to retry last level
    if (data?.lastLevel) {
      const retryButton = this.add.text(width / 2, height / 2 + 100, `Retry Level ${data.lastLevel}`, {
        fontSize: '24px',
        color: GameConfig.colors.retryButton,
        backgroundColor: '#1a1a1a',
        padding: { x: 15, y: 8 }
      });
      retryButton.setOrigin(0.5);
      retryButton.setInteractive({ useHandCursor: true });

      // Track focus state for keyboard navigation
      let retryButtonFocused = false;

      retryButton.on('pointerover', () => {
        retryButton.setColor(GameConfig.colors.retryButtonHover);
        retryButton.setStroke('#FFD700', 2);
        retryButtonFocused = true;
      });

      retryButton.on('pointerout', () => {
        if (!retryButtonFocused) {
          retryButton.setColor(GameConfig.colors.retryButton);
          retryButton.setStroke('', 0);
        }
      });

      retryButton.on('pointerdown', () => {
        console.log(`[MenuScene] Retry Level ${data.lastLevel} clicked`);
        try {
          this.scene.start('GameScene', { level: data.lastLevel });
        } catch (error) {
          console.error('[MenuScene] Failed to start GameScene:', error);
        }
      });
    }

    // Instructions
    const instructions = this.add.text(width / 2, height - 80,
      'Use WASD or Arrow Keys to move\nCapture territory to win each level!', {
      fontSize: '16px',
      color: '#95a5a6',
      align: 'center'
    });
    instructions.setOrigin(0.5);
  }
}
