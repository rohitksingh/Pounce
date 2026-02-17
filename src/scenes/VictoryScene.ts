import Phaser from 'phaser';

/**
 * Scene shown when player completes all levels
 */
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(data: { percentage: number }): void {
    // Get responsive dimensions from camera
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background overlay
    this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.85);

    // Victory title
    this.add.text(centerX, 150, 'VICTORY!', {
      fontSize: '64px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Congratulations message
    this.add.text(centerX, 250, 'You defeated the robot invasion!', {
      fontSize: '28px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Victory story
    this.add.text(centerX, 300,
      'Earth has been reclaimed from the alien robots.\nNature flourishes once again!', {
      fontSize: '20px',
      color: '#00FF00',
      align: 'center'
    }).setOrigin(0.5);

    // Final stats
    this.add.text(centerX, 370, `Final Capture: ${data.percentage.toFixed(1)}%`, {
      fontSize: '24px',
      color: '#FFD700'
    }).setOrigin(0.5);

    // Return to menu button
    const menuText = this.add.text(centerX, 450, 'Return to Menu', {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Track focus state for keyboard navigation
    let menuFocused = false;

    menuText.on('pointerdown', () => {
      // Hide game UI before returning to menu
      const levelIndicator = document.getElementById('level-indicator');
      if (levelIndicator) {
        levelIndicator.style.display = 'none';
      } else {
        console.error('[VictoryScene] UI element missing: level-indicator');
      }

      const uiContainer = document.getElementById('ui-container');
      if (uiContainer) {
        uiContainer.style.display = 'none';
      } else {
        console.error('[VictoryScene] UI element missing: ui-container');
      }

      const powerupContainer = document.getElementById('powerup-container');
      if (powerupContainer) {
        powerupContainer.style.display = 'none';
      } else {
        console.error('[VictoryScene] UI element missing: powerup-container');
      }

      try {
        this.scene.start('MenuScene');
      } catch (error) {
        console.error('[VictoryScene] Failed to start MenuScene:', error);
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

    // Keyboard focus indicator - Tab key support
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      if (!menuFocused) {
        menuText.setColor('#FFFFFF');
        menuText.setStroke('#FFD700', 3);
        menuFocused = true;
      } else {
        menuText.setColor('#FFD700');
        menuText.setStroke('', 0);
        menuFocused = false;
      }
    });

    // Keyboard accessibility - Enter/Space to activate
    this.input.keyboard?.on('keydown-ENTER', () => {
      const levelIndicator = document.getElementById('level-indicator');
      if (levelIndicator) {
        levelIndicator.style.display = 'none';
      }

      const uiContainer = document.getElementById('ui-container');
      if (uiContainer) {
        uiContainer.style.display = 'none';
      }

      const powerupContainer = document.getElementById('powerup-container');
      if (powerupContainer) {
        powerupContainer.style.display = 'none';
      }

      try {
        this.scene.start('MenuScene');
      } catch (error) {
        console.error('[VictoryScene] Failed to start MenuScene:', error);
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      const levelIndicator = document.getElementById('level-indicator');
      if (levelIndicator) {
        levelIndicator.style.display = 'none';
      }

      const uiContainer = document.getElementById('ui-container');
      if (uiContainer) {
        uiContainer.style.display = 'none';
      }

      const powerupContainer = document.getElementById('powerup-container');
      if (powerupContainer) {
        powerupContainer.style.display = 'none';
      }

      try {
        this.scene.start('MenuScene');
      } catch (error) {
        console.error('[VictoryScene] Failed to start MenuScene:', error);
      }
    });
  }
}
