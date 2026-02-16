import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';

export enum CatState {
  NORMAL = 'normal',
  FROZEN = 'frozen',
  SLOWED = 'slowed'
}

export class Cat extends Phaser.Physics.Arcade.Sprite {
  private gridManager: GridManager;
  private lastValidX: number;
  private lastValidY: number;
  private catState: CatState = CatState.NORMAL;
  private baseSpeed: number;
  private stateOverlay?: Phaser.GameObjects.Graphics;
  private savedVelocityX: number = 0;
  private savedVelocityY: number = 0;

  // Visual enhancement elements
  private particleTrail?: Phaser.GameObjects.Particles.ParticleEmitter;
  private glowGraphics?: Phaser.GameObjects.Graphics;
  private shadowSprite?: Phaser.GameObjects.Ellipse;
  private iceParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private chainParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number, gridManager: GridManager) {
    super(scene, x, y, 'pirate');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.gridManager = gridManager;
    this.lastValidX = x;
    this.lastValidY = y;
    this.baseSpeed = GameConfig.catSpeed;

    // Scale sprite to match cell size - proportional to mouse (0.15 scale factor)
    const cellSize = GameConfig.cellSize;
    this.setOrigin(0.5, 0.5);
    // Pirate sprite is 32x32, scale to match mouse visibility
    this.setScale((cellSize / 32) * 3); // Increased from 2 to 3 to match mouse at 0.15

    // Set random velocity
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = this.baseSpeed;
    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed;
    this.setVelocity(velX, velY);

    // Save initial velocity
    this.savedVelocityX = velX;
    this.savedVelocityY = velY;

    this.setCircle(GameConfig.cellSize * 0.4);
    this.setBounce(1, 1);
    this.setCollideWorldBounds(true);

    // Create state overlay graphics
    this.stateOverlay = this.scene.add.graphics();
    this.stateOverlay.setDepth(6); // Above cat sprite

    // Create visual enhancements
    this.createVisualEffects();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    // Update state overlay position
    this.updateStateOverlay();

    // Update visual effects
    this.updateVisualEffects();

    // If frozen, physics body is disabled, skip movement logic
    if (this.catState === CatState.FROZEN) {
      return;
    }

    const cellSize = GameConfig.cellSize;
    const currentGridX = Math.floor(this.x / cellSize);
    const currentGridY = Math.floor(this.y / cellSize);

    // Check current cell state
    const currentCellState = this.gridManager.getCellState(currentGridX, currentGridY);

    // If cat is in captured territory, push it back to last valid position
    if (currentCellState === CellState.CAPTURED) {
      // Push cat back to void
      this.x = this.lastValidX;
      this.y = this.lastValidY;

      // Bounce by reversing velocity
      this.setVelocity(-this.body!.velocity.x, -this.body!.velocity.y);
      return;
    }

    // Calculate next position based on velocity
    const nextX = this.x + (this.body!.velocity.x * delta / 1000);
    const nextY = this.y + (this.body!.velocity.y * delta / 1000);

    // Check if next position would enter captured territory
    const nextGridX = Math.floor(nextX / cellSize);
    const nextGridY = Math.floor(nextY / cellSize);
    const nextCellState = this.gridManager.getCellState(nextGridX, nextGridY);

    if (nextCellState === CellState.CAPTURED) {
      // About to hit captured territory - bounce
      const dx = nextX - this.x;
      const dy = nextY - this.y;

      // Determine which axis to bounce on
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal collision - reverse X velocity
        this.setVelocity(-this.body!.velocity.x, this.body!.velocity.y);
      } else {
        // Vertical collision - reverse Y velocity
        this.setVelocity(this.body!.velocity.x, -this.body!.velocity.y);
      }
    } else {
      // Update last valid position (cat is in void)
      this.lastValidX = this.x;
      this.lastValidY = this.y;
    }
  }

  public setCatState(newState: CatState): void {
    const oldState = this.catState;
    this.catState = newState;

    // Get current velocity before state change
    const currentVelX = this.body!.velocity.x;
    const currentVelY = this.body!.velocity.y;
    const currentSpeed = Math.sqrt(currentVelX * currentVelX + currentVelY * currentVelY);

    // Save current velocity if it's non-zero
    if (currentSpeed > 0) {
      this.savedVelocityX = currentVelX;
      this.savedVelocityY = currentVelY;
    }

    if (newState === CatState.FROZEN) {
      // Disable physics body and stop movement
      if (this.body) {
        this.body.enable = false;
      }
      this.setVelocity(0, 0);
    } else if (newState === CatState.SLOWED) {
      // Re-enable physics if coming from frozen
      if (oldState === CatState.FROZEN && this.body) {
        this.body.enable = true;
      }

      // Apply slow multiplier
      const multiplier = GameConfig.powerUps.slowSpeedMultiplier;

      // If we have saved velocity, use it, otherwise generate random direction
      if (this.savedVelocityX !== 0 || this.savedVelocityY !== 0) {
        const savedSpeed = Math.sqrt(this.savedVelocityX * this.savedVelocityX + this.savedVelocityY * this.savedVelocityY);
        const dirX = this.savedVelocityX / savedSpeed;
        const dirY = this.savedVelocityY / savedSpeed;
        this.setVelocity(
          dirX * this.baseSpeed * multiplier,
          dirY * this.baseSpeed * multiplier
        );
      } else {
        // Generate new random direction
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.setVelocity(
          Math.cos(angle) * this.baseSpeed * multiplier,
          Math.sin(angle) * this.baseSpeed * multiplier
        );
      }
    } else if (newState === CatState.NORMAL) {
      // Re-enable physics if coming from frozen
      if (oldState === CatState.FROZEN && this.body) {
        this.body.enable = true;
      }

      // Restore normal speed using saved velocity direction
      if (this.savedVelocityX !== 0 || this.savedVelocityY !== 0) {
        const savedSpeed = Math.sqrt(this.savedVelocityX * this.savedVelocityX + this.savedVelocityY * this.savedVelocityY);
        const dirX = this.savedVelocityX / savedSpeed;
        const dirY = this.savedVelocityY / savedSpeed;
        this.setVelocity(
          dirX * this.baseSpeed,
          dirY * this.baseSpeed
        );
      } else {
        // Generate new random direction
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.setVelocity(
          Math.cos(angle) * this.baseSpeed,
          Math.sin(angle) * this.baseSpeed
        );
      }
    }
  }

  public getCatState(): CatState {
    return this.catState;
  }

  private updateStateOverlay(): void {
    if (!this.stateOverlay) return;

    this.stateOverlay.clear();

    if (this.catState === CatState.FROZEN) {
      // Draw ice blue circle overlay
      this.stateOverlay.fillStyle(0x3498DB, 0.4);
      this.stateOverlay.fillCircle(this.x, this.y, GameConfig.cellSize * 1.2);

      // Draw ice crystals (static for simplicity)
      this.stateOverlay.lineStyle(2, 0xECF0F1, 0.8);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const r = GameConfig.cellSize * 0.8;
        this.stateOverlay.beginPath();
        this.stateOverlay.moveTo(this.x, this.y);
        this.stateOverlay.lineTo(this.x + Math.cos(angle) * r, this.y + Math.sin(angle) * r);
        this.stateOverlay.strokePath();
      }
    } else if (this.catState === CatState.SLOWED) {
      // Draw gray chain overlay
      this.stateOverlay.fillStyle(0x7F8C8D, 0.3);
      this.stateOverlay.fillCircle(this.x, this.y, GameConfig.cellSize * 1.2);

      // Draw chain links
      this.stateOverlay.lineStyle(2, 0x95A5A6, 0.8);
      this.stateOverlay.strokeCircle(this.x - 5, this.y - 5, 4);
      this.stateOverlay.strokeCircle(this.x + 5, this.y + 5, 4);
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.stateOverlay) {
      this.stateOverlay.destroy();
      this.stateOverlay = undefined;
    }

    // Cleanup visual effects
    if (this.particleTrail) {
      this.particleTrail.destroy();
      this.particleTrail = undefined;
    }
    if (this.glowGraphics) {
      this.glowGraphics.destroy();
      this.glowGraphics = undefined;
    }
    if (this.shadowSprite) {
      this.shadowSprite.destroy();
      this.shadowSprite = undefined;
    }
    if (this.iceParticles) {
      this.iceParticles.destroy();
      this.iceParticles = undefined;
    }
    if (this.chainParticles) {
      this.chainParticles.destroy();
      this.chainParticles = undefined;
    }

    super.destroy(fromScene);
  }

  // ===============================
  // Visual Enhancement Methods
  // ===============================

  private createVisualEffects(): void {
    // Create drop shadow
    this.shadowSprite = this.scene.add.ellipse(this.x, this.y + 5, 30, 15, 0x000000, 0.3);
    this.shadowSprite.setDepth(4.5); // Just below cat (depth 5)

    // Create glow graphics (red outline effect)
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setDepth(4.8); // Between shadow and cat

    // Create particle trail (if texture exists)
    if (this.scene.textures.exists('trail-particle')) {
      this.particleTrail = this.scene.add.particles(this.x, this.y, 'trail-particle', {
        speed: { min: 10, max: 25 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 500,
        frequency: 60,
        tint: 0xFF4500, // Red-orange for pirates
        blendMode: Phaser.BlendModes.ADD
      });
      this.particleTrail.setDepth(4.5); // Below cat
    }
  }

  private updateVisualEffects(): void {
    // Update shadow position
    if (this.shadowSprite) {
      this.shadowSprite.setPosition(this.x, this.y + 5);
    }

    // Update glow outline
    if (this.glowGraphics) {
      this.glowGraphics.clear();

      // Draw glowing red outline (pulsing effect)
      const pulseAlpha = 0.4 + Math.sin(Date.now() * 0.004) * 0.2;
      this.glowGraphics.lineStyle(3, 0xFF0000, pulseAlpha);
      this.glowGraphics.strokeCircle(this.x, this.y, this.displayWidth / 2 + 3);
    }

    // Update particle trail position
    if (this.particleTrail) {
      this.particleTrail.setPosition(this.x, this.y);

      // Pause particles if frozen
      if (this.catState === CatState.FROZEN) {
        this.particleTrail.stop();
      } else {
        this.particleTrail.start();
      }
    }

    // Update ice particles for frozen state
    if (this.catState === CatState.FROZEN) {
      if (!this.iceParticles && this.scene.textures.exists('trail-particle')) {
        // Create ice particles around frozen cat
        this.iceParticles = this.scene.add.particles(this.x, this.y, 'trail-particle', {
          speed: { min: 5, max: 15 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 800,
          frequency: 100,
          tint: 0x3498DB, // Ice blue
          blendMode: Phaser.BlendModes.ADD,
          moveToX: this.x,
          moveToY: this.y,
          radial: true
        });
        this.iceParticles.setDepth(6.5); // Above cat overlay
      }

      if (this.iceParticles) {
        this.iceParticles.setPosition(this.x, this.y);
      }
    } else {
      // Remove ice particles when not frozen
      if (this.iceParticles) {
        this.iceParticles.destroy();
        this.iceParticles = undefined;
      }
    }

    // Update chain particles for slowed state
    if (this.catState === CatState.SLOWED) {
      if (!this.chainParticles && this.scene.textures.exists('trail-particle')) {
        this.chainParticles = this.scene.add.particles(this.x, this.y, 'trail-particle', {
          speed: { min: 3, max: 8 },
          scale: { start: 0.4, end: 0 },
          alpha: { start: 0.6, end: 0 },
          lifespan: 600,
          frequency: 120,
          tint: 0x7F8C8D, // Gray for chains
          blendMode: Phaser.BlendModes.NORMAL
        });
        this.chainParticles.setDepth(6.5); // Above cat overlay
      }

      if (this.chainParticles) {
        this.chainParticles.setPosition(this.x, this.y);
      }
    } else {
      // Remove chain particles when not slowed
      if (this.chainParticles) {
        this.chainParticles.destroy();
        this.chainParticles = undefined;
      }
    }
  }
}
