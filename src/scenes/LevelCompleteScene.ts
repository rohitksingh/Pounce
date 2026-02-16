import Phaser from 'phaser';

/**
 * Scene shown between levels when player completes a level
 */
export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  create(data: { completedLevel: number; nextLevel: number; percentage: number }): void {
    const { completedLevel, nextLevel, percentage } = data;

    // Get responsive dimensions from camera
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Semi-transparent background overlay
    this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.85);

    // Title
    this.add.text(centerX, 150, `Level ${completedLevel} Complete!`, {
      fontSize: '56px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stats
    this.add.text(centerX, 250, `Territory Captured: ${percentage.toFixed(1)}%`, {
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Next level button
    const nextLevelText = this.add.text(centerX, 400, `Continue to Level ${nextLevel}`, {
      fontSize: '32px',
      color: '#00FF00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Track focus state for keyboard navigation
    let nextLevelFocused = false;

    nextLevelText.on('pointerdown', () => {
      try {
        this.scene.start('GameScene', { level: nextLevel });
      } catch (error) {
        console.error('[LevelCompleteScene] Failed to start GameScene:', error);
        // Fallback to menu on error
        this.scene.start('MenuScene');
      }
    });

    nextLevelText.on('pointerover', () => {
      nextLevelText.setColor('#FFFFFF');
      nextLevelText.setStroke('#FFD700', 2);
      nextLevelFocused = true;
    });

    nextLevelText.on('pointerout', () => {
      if (!nextLevelFocused) {
        nextLevelText.setColor('#00FF00');
        nextLevelText.setStroke('', 0);
      }
    });

    // Keyboard accessibility - Enter/Space to activate
    this.input.keyboard?.on('keydown-ENTER', () => {
      try {
        this.scene.start('GameScene', { level: nextLevel });
      } catch (error) {
        console.error('[LevelCompleteScene] Failed to start GameScene:', error);
        this.scene.start('MenuScene');
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      try {
        this.scene.start('GameScene', { level: nextLevel });
      } catch (error) {
        console.error('[LevelCompleteScene] Failed to start GameScene:', error);
        this.scene.start('MenuScene');
      }
    });

    // Menu button
    const menuText = this.add.text(centerX, 470, 'Return to Menu', {
      fontSize: '24px',
      color: '#FFD700'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Track focus state for keyboard navigation
    let menuFocused = false;
    let currentFocus: 'next' | 'menu' = 'next'; // Track which button is focused

    menuText.on('pointerdown', () => {
      // Hide game UI before returning to menu
      const levelIndicator = document.getElementById('level-indicator');
      if (levelIndicator) {
        levelIndicator.style.display = 'none';
      } else {
        console.error('[LevelCompleteScene] UI element missing: level-indicator');
      }

      const uiContainer = document.getElementById('ui-container');
      if (uiContainer) {
        uiContainer.style.display = 'none';
      } else {
        console.error('[LevelCompleteScene] UI element missing: ui-container');
      }

      const powerupContainer = document.getElementById('powerup-container');
      if (powerupContainer) {
        powerupContainer.style.display = 'none';
      } else {
        console.error('[LevelCompleteScene] UI element missing: powerup-container');
      }

      try {
        this.scene.start('MenuScene');
      } catch (error) {
        console.error('[LevelCompleteScene] Failed to start MenuScene:', error);
      }
    });

    menuText.on('pointerover', () => {
      menuText.setColor('#FFFFFF');
      menuText.setStroke('#FFD700', 2);
      menuFocused = true;
    });

    menuText.on('pointerout', () => {
      if (!menuFocused) {
        menuText.setColor('#FFD700');
        menuText.setStroke('', 0);
      }
    });

    // Keyboard focus indicator - Tab key cycles between buttons
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();

      if (currentFocus === 'next') {
        // Remove focus from next button
        nextLevelText.setColor('#00FF00');
        nextLevelText.setStroke('', 0);
        nextLevelFocused = false;

        // Add focus to menu button
        menuText.setColor('#FFFFFF');
        menuText.setStroke('#FFD700', 3);
        menuFocused = true;
        currentFocus = 'menu';
      } else {
        // Remove focus from menu button
        menuText.setColor('#FFD700');
        menuText.setStroke('', 0);
        menuFocused = false;

        // Add focus to next button
        nextLevelText.setColor('#FFFFFF');
        nextLevelText.setStroke('#FFD700', 3);
        nextLevelFocused = true;
        currentFocus = 'next';
      }
    });
  }
}
