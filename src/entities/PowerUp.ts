import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export enum PowerUpType {
  FREEZE = 'freeze',
  SLOW = 'slow'
}

export class PowerUp extends Phaser.GameObjects.Container {
  public type: PowerUpType;
  private sprite: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Graphics;
  private glowTween?: Phaser.Tweens.Tween;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    super(scene, x, y);

    this.type = type;

    // Add to scene
    scene.add.existing(this);

    // Create glow effect (behind sprite)
    this.glow = scene.add.graphics();
    this.add(this.glow);

    // Create sprite
    this.sprite = scene.add.graphics();
    this.add(this.sprite);

    // Draw the power-up based on type
    this.drawPowerUp();

    // Create particle effect (only if texture exists)
    const particleColor = this.type === PowerUpType.FREEZE ? 0x3498DB : 0x95A5A6;
    if (scene.textures.exists('trail-particle')) {
      this.particles = scene.add.particles(0, 0, 'trail-particle', {
        speed: { min: 10, max: 30 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 800,
        frequency: 100,
        tint: particleColor,
        blendMode: Phaser.BlendModes.ADD
      });
      this.add(this.particles);
    }

    // Add pulsing glow animation
    this.glowTween = scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.3, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Set depth
    this.setDepth(3);
  }

  private drawPowerUp(): void {
    const size = GameConfig.cellSize * 2;
    const centerX = 0;
    const centerY = 0;

    if (this.type === PowerUpType.FREEZE) {
      // Ice blue snowflake/ice crystal theme
      const color = 0x3498DB;
      const glowColor = 0x5DADE2;

      // Draw glow
      this.glow.clear();
      this.glow.fillStyle(glowColor, 0.5);
      this.glow.fillCircle(centerX, centerY, size * 0.6);

      // Draw main shape - snowflake
      this.sprite.clear();
      this.sprite.lineStyle(3, color, 1);

      // Six-pointed snowflake
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const endX = Math.cos(angle) * (size * 0.4);
        const endY = Math.sin(angle) * (size * 0.4);

        // Main spoke
        this.sprite.beginPath();
        this.sprite.moveTo(centerX, centerY);
        this.sprite.lineTo(centerX + endX, centerY + endY);
        this.sprite.strokePath();

        // Side branches
        const branchAngle1 = angle - Math.PI / 6;
        const branchAngle2 = angle + Math.PI / 6;
        const branchLength = size * 0.15;

        this.sprite.beginPath();
        this.sprite.moveTo(centerX + endX, centerY + endY);
        this.sprite.lineTo(
          centerX + endX + Math.cos(branchAngle1) * branchLength,
          centerY + endY + Math.sin(branchAngle1) * branchLength
        );
        this.sprite.strokePath();

        this.sprite.beginPath();
        this.sprite.moveTo(centerX + endX, centerY + endY);
        this.sprite.lineTo(
          centerX + endX + Math.cos(branchAngle2) * branchLength,
          centerY + endY + Math.sin(branchAngle2) * branchLength
        );
        this.sprite.strokePath();
      }

      // Center circle
      this.sprite.fillStyle(0xECF0F1, 1);
      this.sprite.fillCircle(centerX, centerY, size * 0.15);
      this.sprite.lineStyle(2, color, 1);
      this.sprite.strokeCircle(centerX, centerY, size * 0.15);

    } else if (this.type === PowerUpType.SLOW) {
      // Dark gray anchor/chain theme
      const color = 0x7F8C8D;
      const glowColor = 0x95A5A6;

      // Draw glow
      this.glow.clear();
      this.glow.fillStyle(glowColor, 0.5);
      this.glow.fillCircle(centerX, centerY, size * 0.6);

      // Draw main shape - anchor
      this.sprite.clear();
      this.sprite.lineStyle(3, color, 1);
      this.sprite.fillStyle(color, 1);

      // Anchor shank (vertical line)
      this.sprite.fillRect(centerX - 2, centerY - size * 0.3, 4, size * 0.5);

      // Anchor ring (top)
      this.sprite.lineStyle(3, color, 1);
      this.sprite.strokeCircle(centerX, centerY - size * 0.3, size * 0.12);

      // Anchor arms (bottom)
      const armWidth = size * 0.3;
      const armHeight = size * 0.15;

      // Left arm
      this.sprite.fillStyle(color, 1);
      this.sprite.beginPath();
      this.sprite.moveTo(centerX, centerY + size * 0.2);
      this.sprite.lineTo(centerX - armWidth, centerY + size * 0.2);
      this.sprite.lineTo(centerX - armWidth, centerY + size * 0.2 + armHeight);
      this.sprite.lineTo(centerX - armWidth + 5, centerY + size * 0.2 + armHeight);
      this.sprite.lineTo(centerX - armWidth + 5, centerY + size * 0.2 + 5);
      this.sprite.lineTo(centerX, centerY + size * 0.2 + 5);
      this.sprite.closePath();
      this.sprite.fillPath();

      // Right arm
      this.sprite.beginPath();
      this.sprite.moveTo(centerX, centerY + size * 0.2);
      this.sprite.lineTo(centerX + armWidth, centerY + size * 0.2);
      this.sprite.lineTo(centerX + armWidth, centerY + size * 0.2 + armHeight);
      this.sprite.lineTo(centerX + armWidth - 5, centerY + size * 0.2 + armHeight);
      this.sprite.lineTo(centerX + armWidth - 5, centerY + size * 0.2 + 5);
      this.sprite.lineTo(centerX, centerY + size * 0.2 + 5);
      this.sprite.closePath();
      this.sprite.fillPath();
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.glowTween) {
      this.glowTween.stop();
      this.glowTween = undefined;
    }
    super.destroy(fromScene);
  }
}
