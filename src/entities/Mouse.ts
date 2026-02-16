import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';

enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4
}

export class Mouse extends Phaser.GameObjects.Sprite {
  private gridX: number;
  private gridY: number;
  private visualX: number; // Smooth interpolated position for rendering
  private visualY: number;
  private gridManager: GridManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private trail: { x: number; y: number }[] = [];
  private isDrawingTrail: boolean = false;
  private currentDirection: Direction = Direction.NONE;
  private moveTimer: number = 0;
  private moveDelay: number = 150; // milliseconds between moves
  private baseMoveDelay: number = 150; // Base delay (used to calculate speed changes)
  private lerpSpeed: number = 0.3; // Interpolation speed (0-1, higher = faster)

  // Visual enhancement elements
  private particleTrail?: Phaser.GameObjects.Particles.ParticleEmitter;
  private glowGraphics?: Phaser.GameObjects.Graphics;
  private shadowSprite?: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, gridManager: GridManager) {
    const cellSize = GameConfig.cellSize;
    super(scene, cellSize + cellSize / 2, cellSize + cellSize / 2, 'cat-idle-1');

    scene.add.existing(this);
    this.setOrigin(0.5, 0.5);
    // Scale up from 0.05 to 0.15 (3x bigger, animations more visible)
    this.setScale(0.15);

    this.gridManager = gridManager;

    // Create visual enhancements
    this.createVisualEffects();

    // Create animations
    this.createAnimations();
    // Start with idle animation
    this.play('cat-idle');

    // Start position - random location in captured territory
    const spawnCell = gridManager.getRandomCapturedCell();
    if (spawnCell) {
      this.gridX = spawnCell.x;
      this.gridY = spawnCell.y;
    } else {
      // Fallback to center if no captured cells
      this.gridX = Math.floor(GameConfig.gridCols / 2);
      this.gridY = Math.floor(GameConfig.gridRows / 2);
    }
    this.visualX = this.gridX;
    this.visualY = this.gridY;

    // Update sprite position to match spawn
    this.x = this.gridX * cellSize + cellSize / 2;
    this.y = this.gridY * cellSize + cellSize / 2;

    // Initialize base move delay
    this.baseMoveDelay = this.moveDelay;

    // Set up input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(_time: number, delta: number): void {
    this.handleInput();
    this.handleAutoMovement(delta);
    this.updateVisualPosition();
    this.updateSpritePosition();
    this.updateAnimation();
    this.updateVisualEffects();
  }

  private createAnimations(): void {
    // Create idle animation
    if (!this.scene.anims.exists('cat-idle')) {
      this.scene.anims.create({
        key: 'cat-idle',
        frames: Array.from({ length: 10 }, (_, i) => ({ key: `cat-idle-${i + 1}` })),
        frameRate: 10,
        repeat: -1
      });
    }

    // Create walk animation
    if (!this.scene.anims.exists('cat-walk')) {
      this.scene.anims.create({
        key: 'cat-walk',
        frames: Array.from({ length: 10 }, (_, i) => ({ key: `cat-walk-${i + 1}` })),
        frameRate: 15,
        repeat: -1
      });
    }

    // Create hurt animation
    if (!this.scene.anims.exists('cat-hurt')) {
      this.scene.anims.create({
        key: 'cat-hurt',
        frames: Array.from({ length: 10 }, (_, i) => ({ key: `cat-hurt-${i + 1}` })),
        frameRate: 12,
        repeat: 0
      });
    }

    // Create dead animation
    if (!this.scene.anims.exists('cat-dead')) {
      this.scene.anims.create({
        key: 'cat-dead',
        frames: Array.from({ length: 10 }, (_, i) => ({ key: `cat-dead-${i + 1}` })),
        frameRate: 10,
        repeat: 0
      });
    }
  }

  private updateAnimation(): void {
    // Play walk animation when moving, idle when stopped
    if (this.currentDirection !== Direction.NONE && this.anims.currentAnim?.key !== 'cat-walk') {
      this.play('cat-walk');
    } else if (this.currentDirection === Direction.NONE && this.anims.currentAnim?.key !== 'cat-idle') {
      this.play('cat-idle');
    }
  }

  private updateVisualPosition(): void {
    // Smoothly interpolate visual position towards grid position
    this.visualX = Phaser.Math.Linear(this.visualX, this.gridX, this.lerpSpeed);
    this.visualY = Phaser.Math.Linear(this.visualY, this.gridY, this.lerpSpeed);
  }

  private updateSpritePosition(): void {
    const cellSize = GameConfig.cellSize;
    this.x = this.visualX * cellSize + cellSize / 2;
    this.y = this.visualY * cellSize + cellSize / 2;
  }

  private handleInput(): void {
    // Store previous direction for rotation detection
    const oldDirection = this.currentDirection;

    // Change direction based on key press
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!) || Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
      this.currentDirection = Direction.LEFT;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!) || Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
      this.currentDirection = Direction.RIGHT;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
      this.currentDirection = Direction.UP;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!) || Phaser.Input.Keyboard.JustDown(this.wasd.S)) {
      this.currentDirection = Direction.DOWN;
    }

    // Detect direction change for rotation and particle burst
    if (oldDirection !== Direction.NONE && this.currentDirection !== oldDirection) {
      this.onDirectionChange();
    }
  }

  private handleAutoMovement(delta: number): void {
    if (this.currentDirection === Direction.NONE) return;

    this.moveTimer += delta;

    if (this.moveTimer >= this.moveDelay) {
      this.moveTimer = 0;

      let newX = this.gridX;
      let newY = this.gridY;

      switch (this.currentDirection) {
        case Direction.UP:
          newY--;
          break;
        case Direction.DOWN:
          newY++;
          break;
        case Direction.LEFT:
          newX--;
          break;
        case Direction.RIGHT:
          newX++;
          break;
      }

      // Check bounds
      if (newX < 0 || newX >= this.gridManager.getCols() || newY < 0 || newY >= this.gridManager.getRows()) {
        this.currentDirection = Direction.NONE; // Stop at boundary
        return;
      }

      // Move to new position
      this.moveToGrid(newX, newY);
    }
  }

  private moveToGrid(newX: number, newY: number): void {
    const currentState = this.gridManager.getCellState(this.gridX, this.gridY);
    const targetState = this.gridManager.getCellState(newX, newY);

    // Update position
    this.gridX = newX;
    this.gridY = newY;

    // Handle trail logic
    if (currentState === CellState.CAPTURED && targetState === CellState.VOID) {
      // Starting to draw trail
      this.isDrawingTrail = true;
      this.trail = [{ x: newX, y: newY }];
      this.gridManager.setCellState(newX, newY, CellState.TRAIL);
    } else if (this.isDrawingTrail && targetState === CellState.VOID) {
      // Continue drawing trail
      this.trail.push({ x: newX, y: newY });
      this.gridManager.setCellState(newX, newY, CellState.TRAIL);
    } else if (this.isDrawingTrail && targetState === CellState.CAPTURED) {
      // Completed loop - trigger territory capture
      this.completeLoop();
    } else if (this.isDrawingTrail && targetState === CellState.TRAIL) {
      // Hit own trail - game over
      this.scene.events.emit('mouse-hit-trail');
    }
  }

  private completeLoop(): void {
    this.isDrawingTrail = false;
    this.scene.events.emit('loop-completed', this.trail);
    this.trail = [];
  }

  getGridPosition(): { x: number; y: number } {
    return { x: this.gridX, y: this.gridY };
  }

  getVisualPosition(): { x: number; y: number } {
    // Ensure visual positions are valid numbers
    const x = isNaN(this.visualX) ? this.gridX : this.visualX;
    const y = isNaN(this.visualY) ? this.gridY : this.visualY;
    return { x, y };
  }

  getTrail(): { x: number; y: number }[] {
    return this.trail;
  }

  isInVoid(): boolean {
    return this.isDrawingTrail;
  }

  resetTrail(): void {
    this.gridManager.clearTrail();
    this.trail = [];
    this.isDrawingTrail = false;
  }

  // Speed management methods
  public getSpeedMultiplier(): number {
    // Speed is inversely proportional to move delay
    // Higher delay = slower speed, lower delay = faster speed
    return this.baseMoveDelay / this.moveDelay;
  }

  public increaseSpeed(multiplier: number): void {
    // Decrease move delay to increase speed (multiplicative)
    // multiplier = 1.1 means 10% speed increase = delay / 1.1
    this.moveDelay = this.moveDelay / multiplier;

    // Cap at max speed (min delay)
    const maxMultiplier = GameConfig.maxSpeedMultiplier;
    const minDelay = this.baseMoveDelay / maxMultiplier;
    if (this.moveDelay < minDelay) {
      this.moveDelay = minDelay;
    }
  }

  public resetSpeed(): void {
    // Reset to base speed
    this.moveDelay = this.baseMoveDelay;
  }

  /**
   * Respawn the player at a random captured cell after death
   */
  public respawn(): void {
    // Get random captured cell from grid manager
    const spawnCell = this.gridManager.getRandomCapturedCell();

    if (!spawnCell) {
      console.error('[Mouse] No captured cells available for respawn');
      return;
    }

    console.log(`[Mouse] Respawning at (${spawnCell.x}, ${spawnCell.y})`);

    // Update grid position
    this.gridX = spawnCell.x;
    this.gridY = spawnCell.y;

    // Update visual position (no interpolation on spawn - instant teleport)
    this.visualX = spawnCell.x;
    this.visualY = spawnCell.y;

    // Update sprite position
    const cellSize = GameConfig.cellSize;
    this.x = spawnCell.x * cellSize + cellSize / 2;
    this.y = spawnCell.y * cellSize + cellSize / 2;

    // Clear trail
    this.trail = [];
    this.isDrawingTrail = false;

    // Reset direction to stopped
    this.currentDirection = Direction.NONE;
  }

  // ===============================
  // Visual Enhancement Methods
  // ===============================

  private createVisualEffects(): void {
    // Create drop shadow
    this.shadowSprite = this.scene.add.ellipse(this.x, this.y + 5, 30, 15, 0x000000, 0.3);
    this.shadowSprite.setDepth(9); // Just below mouse (depth 10)

    // Create glow graphics (outline effect)
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setDepth(9.5); // Between shadow and mouse

    // Create particle trail (if texture exists)
    if (this.scene.textures.exists('trail-particle')) {
      this.particleTrail = this.scene.add.particles(this.x, this.y, 'trail-particle', {
        speed: { min: 5, max: 15 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 400,
        frequency: 50,
        tint: 0xFFD700, // Gold on captured territory (default)
        blendMode: Phaser.BlendModes.ADD
      });
      this.particleTrail.setDepth(9); // Below mouse
    } else {
      // Create fallback particle texture
      this.createParticleTexture();

      // Try again after creating texture
      if (this.scene.textures.exists('trail-particle')) {
        this.particleTrail = this.scene.add.particles(this.x, this.y, 'trail-particle', {
          speed: { min: 5, max: 15 },
          scale: { start: 0.4, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 400,
          frequency: 50,
          tint: 0xFFD700,
          blendMode: Phaser.BlendModes.ADD
        });
        this.particleTrail.setDepth(9);
      }
    }
  }

  private createParticleTexture(): void {
    // Create simple particle texture if it doesn't exist
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('trail-particle', 8, 8);
    graphics.destroy();
  }

  private updateVisualEffects(): void {
    // Update shadow position
    if (this.shadowSprite) {
      this.shadowSprite.setPosition(this.x, this.y + 5);
    }

    // Update glow outline
    if (this.glowGraphics) {
      this.glowGraphics.clear();

      // Draw glowing outline (pulsing effect)
      const pulseAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      this.glowGraphics.lineStyle(3, 0xFFD700, pulseAlpha);
      this.glowGraphics.strokeCircle(this.x, this.y, this.displayWidth / 2 + 2);
    }

    // Update particle trail position and color
    if (this.particleTrail) {
      this.particleTrail.setPosition(this.x, this.y);

      // Change particle color based on territory
      const particleColor = this.isDrawingTrail ? 0x00FFFF : 0xFFD700; // Cyan in void, gold on captured
      // Update particle tint via config property
      this.particleTrail.particleTint = particleColor;
    }
  }

  private onDirectionChange(): void {
    // Smooth rotation tween
    const targetRotation = this.getRotationForDirection(this.currentDirection);

    this.scene.tweens.add({
      targets: this,
      angle: targetRotation,
      duration: 150,
      ease: 'Sine.easeInOut'
    });

    // Dust particle burst on direction change
    if (this.scene.textures.exists('trail-particle')) {
      const burstParticles = this.scene.add.particles(this.x, this.y, 'trail-particle', {
        speed: { min: 30, max: 60 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 300,
        quantity: 8,
        tint: 0xFFFFFF,
        blendMode: Phaser.BlendModes.ADD
      });

      // Auto-destroy after 500ms
      this.scene.time.delayedCall(500, () => {
        burstParticles.destroy();
      });
    }
  }

  private getRotationForDirection(direction: Direction): number {
    switch (direction) {
      case Direction.UP:
        return -90;
      case Direction.DOWN:
        return 90;
      case Direction.LEFT:
        return 180;
      case Direction.RIGHT:
        return 0;
      default:
        return this.angle; // Keep current rotation
    }
  }

  destroy(fromScene?: boolean): void {
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

    super.destroy(fromScene);
  }
}
