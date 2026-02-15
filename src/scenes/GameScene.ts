import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';
import { Mouse } from '../entities/Mouse';
import { Cat, CatState } from '../entities/Cat';
import { PowerUp, PowerUpType } from '../entities/PowerUp';
import { FloodFill } from '../utils/FloodFill';

export class GameScene extends Phaser.Scene {
  private gridManager!: GridManager;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private islandOverlay!: Phaser.GameObjects.TileSprite;
  private mouse!: Mouse;
  private cats: Cat[] = [];
  private powerUps: PowerUp[] = [];
  private lives: number = GameConfig.initialLives;
  private gameOver: boolean = false;
  private uiElement: HTMLElement | null = null;
  private lastRenderedTrailLength: number = 0;

  // Power-up system state
  private powerUpSpawnTimer: number = 0;
  private activePowerUpEffect: PowerUpType | null = null;
  private powerUpEffectTimer: number = 0;
  private powerUpUIElement: HTMLElement | null = null;

  // Animated background elements
  private waveGraphics!: Phaser.GameObjects.Graphics;
  private causticsGraphics!: Phaser.GameObjects.Graphics;
  private bubbleParticleManager?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkleParticleManager?: Phaser.GameObjects.Particles.ParticleEmitter;
  private waveTime: number = 0;

  // Palm tree system
  private palmTreeGraphics!: Phaser.GameObjects.Graphics;
  private palmTreePositions: { x: number; y: number; size: number; phaseOffset: number }[] = [];
  private lastCapturedCells: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    console.log('[GameScene] Game scene started');

    // Create animated background layers
    this.createAnimatedBackground();

    // Create island texture overlay (will be masked by captured territory)
    this.islandOverlay = this.add.tileSprite(
      0,
      0,
      GameConfig.width,
      GameConfig.height,
      'island'
    );
    this.islandOverlay.setOrigin(0, 0);
    this.islandOverlay.setAlpha(0); // Start invisible
    this.islandOverlay.setDepth(1); // Above sea

    // Initialize grid
    this.gridManager = new GridManager();

    // Create graphics objects
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(2); // Above background

    // Create mouse player
    this.mouse = new Mouse(this, this.gridManager);
    this.mouse.setDepth(10); // Above everything except UI

    // Spawn cats in VOID area
    this.spawnCats();

    // Listen for events
    this.events.on('loop-completed', this.handleLoopCompleted, this);
    this.events.on('mouse-hit-trail', this.handleMouseHit, this);

    // Get reference to DOM UI elements and make them visible
    this.uiElement = document.getElementById('ui-container');
    if (this.uiElement) {
      this.uiElement.style.display = 'block';
    }
    this.powerUpUIElement = document.getElementById('powerup-container');

    // Start power-up spawn timer
    this.powerUpSpawnTimer = GameConfig.powerUps.spawnInterval;

    // Render initial grid
    this.renderGrid();
  }

  private handleLoopCompleted(trail: { x: number; y: number }[]): void {
    const catsToDestroy = FloodFill.fillTerritory(this.gridManager, trail, this.cats);
    this.mouse.resetTrail();

    // Destroy trapped cats and increase player speed
    if (catsToDestroy.length > 0) {
      console.log(`[GameScene] Captured ${catsToDestroy.length} pirate(s)!`);

      catsToDestroy.forEach(cat => {
        cat.destroy();
        // Increase speed by 10% for each captured cat
        this.increasePlayerSpeed();
      });

      // Remove from cats array
      this.cats = this.cats.filter(cat => !catsToDestroy.includes(cat));

      console.log(`[GameScene] ${this.cats.length} pirate(s) remaining. Speed: ${this.mouse.getSpeedMultiplier().toFixed(1)}×`);

      // Check if all cats eliminated
      if (this.cats.length === 0) {
        console.log('[GameScene] All pirates defeated! Victory!');
      }
    }

    // Check win condition
    const percentage = this.gridManager.getPercentageCaptured();
    if (percentage >= GameConfig.winPercentage) {
      this.gameOver = true;
      this.showWin();
    }
  }

  private showGameOver(): void {
    const text = this.add.text(
      GameConfig.width / 2,
      GameConfig.height / 2,
      '☠ WALK THE PLANK! ☠\n\nClick to Restart',
      {
        fontSize: '48px',
        color: '#E74C3C',
        align: 'center',
        backgroundColor: '#1A1A1A',
        padding: { x: 20, y: 20 },
        fontStyle: 'bold'
      }
    );
    text.setOrigin(0.5);
    text.setDepth(200);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.scene.restart());
  }

  private showWin(): void {
    const percentage = this.gridManager.getPercentageCaptured();
    const text = this.add.text(
      GameConfig.width / 2,
      GameConfig.height / 2,
      `⚓ TREASURE SECURED! ⚓\n\nCaptured: ${percentage.toFixed(1)}%\n\nClick to Play Again`,
      {
        fontSize: '48px',
        color: '#FFD700',
        align: 'center',
        backgroundColor: '#1A252F',
        padding: { x: 20, y: 20 },
        fontStyle: 'bold'
      }
    );
    text.setOrigin(0.5);
    text.setDepth(200);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.scene.restart());
  }

  update(time: number, delta: number) {
    if (this.gameOver) return;

    // Update animated background
    this.updateAnimatedBackground(time, delta);

    this.mouse.update(time, delta);
    this.updatePowerUpSystem(delta);
    this.checkCollisions();
    this.checkPowerUpCollection();
    this.renderGrid();
    this.updateUI();
  }

  private updateUI(): void {
    const percentage = this.gridManager.getPercentageCaptured();
    const speedMultiplier = this.mouse.getSpeedMultiplier();
    const speedDisplay = speedMultiplier > 1.0 ? ` | Speed: ${speedMultiplier.toFixed(1)}×` : '';

    if (this.uiElement) {
      this.uiElement.textContent = `Territory: ${percentage.toFixed(1)}% | Lives: ${this.lives} | Pirates: ${this.cats.length}${speedDisplay}`;
    }

    // Update power-up UI
    if (this.powerUpUIElement) {
      if (this.activePowerUpEffect && this.powerUpEffectTimer > 0) {
        const secondsLeft = Math.ceil(this.powerUpEffectTimer / 1000);
        const effectName = this.activePowerUpEffect === PowerUpType.FREEZE ? 'FROZEN' : 'SLOWED';
        const icon = this.activePowerUpEffect === PowerUpType.FREEZE ? '❄' : '⚓';
        this.powerUpUIElement.textContent = `${icon} ${effectName}: ${secondsLeft}s`;
        this.powerUpUIElement.style.display = 'block';
      } else {
        this.powerUpUIElement.style.display = 'none';
      }
    }
  }

  private checkCollisions(): void {
    if (!this.mouse.isInVoid()) return; // Mouse is safe on captured territory

    const mousePos = this.mouse.getGridPosition();
    const cellSize = GameConfig.cellSize;
    const mouseX = mousePos.x * cellSize + cellSize / 2;
    const mouseY = mousePos.y * cellSize + cellSize / 2;
    const mouseRadius = cellSize * 0.4;
    const catRadius = cellSize * 0.4;
    const collisionDistance = mouseRadius + catRadius;

    // Trail collision radius matches visual trail width (3px)
    const trailRadius = 1.5; // Half of 3px trail width
    const trailCollisionDistance = catRadius + trailRadius;

    // Check if any cat is touching the mouse or trail
    for (const cat of this.cats) {
      // Check collision with mouse position
      const mouseDistance = Phaser.Math.Distance.Between(mouseX, mouseY, cat.x, cat.y);
      if (mouseDistance < collisionDistance) {
        this.handleMouseHit();
        return;
      }

      // Check if cat touches any point on the trail
      const trail = this.mouse.getTrail();
      for (const point of trail) {
        const trailX = point.x * cellSize + cellSize / 2;
        const trailY = point.y * cellSize + cellSize / 2;
        const trailDistance = Phaser.Math.Distance.Between(trailX, trailY, cat.x, cat.y);

        // Use trail-specific collision distance (cat radius + trail radius = 3px)
        if (trailDistance < trailCollisionDistance) {
          this.handleMouseHit();
          return;
        }
      }

      // CRITICAL: Check collision with interpolated segment from last trail point to mouse visual position
      // This segment is rendered visually but wasn't being checked for collisions
      if (trail.length > 0) {
        const lastPoint = trail[trail.length - 1];
        const lastX = lastPoint.x * cellSize + cellSize / 2;
        const lastY = lastPoint.y * cellSize + cellSize / 2;

        const visualPos = this.mouse.getVisualPosition();
        const visualX = visualPos.x * cellSize + cellSize / 2;
        const visualY = visualPos.y * cellSize + cellSize / 2;

        // Calculate point-to-line-segment distance
        const segmentDistance = this.pointToSegmentDistance(
          cat.x, cat.y,
          lastX, lastY,
          visualX, visualY
        );

        if (segmentDistance < trailCollisionDistance) {
          this.handleMouseHit();
          return;
        }
      }
    }
  }

  // Calculate minimum distance from point (px, py) to line segment (x1,y1)-(x2,y2)
  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    // If segment has zero length, return distance to point
    if (lengthSquared === 0) {
      return Phaser.Math.Distance.Between(px, py, x1, y1);
    }

    // Calculate projection of point onto line (clamped to segment)
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    // Find closest point on segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    // Return distance to closest point
    return Phaser.Math.Distance.Between(px, py, closestX, closestY);
  }

  private handleMouseHit(): void {
    this.lives--;
    this.mouse.resetTrail();

    // Reset speed to base on death
    this.mouse.resetSpeed();
    console.log('[GameScene] Player hit! Speed reset to base.');

    if (this.lives <= 0) {
      this.gameOver = true;
      this.showGameOver();
    }
  }

  private spawnCats(): void {
    const cellSize = GameConfig.cellSize;
    const cols = this.gridManager.getCols();
    const rows = this.gridManager.getRows();
    const minDistance = 50; // Minimum distance between cats

    for (let i = 0; i < GameConfig.initialCats; i++) {
      let x: number = cellSize * 10;
      let y: number = cellSize * 10;
      let validPosition = false;
      let attempts = 0;

      // Try to find a valid position that's not too close to other cats
      while (!validPosition && attempts < 50) {
        // Spawn in VOID area (not near edges)
        x = Phaser.Math.Between(cellSize * 5, (cols - 5) * cellSize);
        y = Phaser.Math.Between(cellSize * 5, (rows - 5) * cellSize);

        // Check distance from other cats
        validPosition = true;
        for (const existingCat of this.cats) {
          const distance = Phaser.Math.Distance.Between(x, y, existingCat.x, existingCat.y);
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }

        attempts++;
      }

      // Create cat
      const cat = new Cat(this, x, y, this.gridManager);
      cat.setDepth(5); // Below mouse, above grid
      this.cats.push(cat);
    }
  }

  private renderGrid(): void {
    const trail = this.mouse.getTrail();
    const currentTrailLength = trail.length;

    // Only re-render trail if it has changed
    const trailChanged = currentTrailLength !== this.lastRenderedTrailLength;

    if (!trailChanged && currentTrailLength > 0) {
      // Trail hasn't changed, skip re-rendering it
      return;
    }

    this.gridGraphics.clear();

    const grid = this.gridManager.getGrid();
    const cellSize = GameConfig.cellSize;

    // Create a render texture for island masking
    let hasCaptured = false;

    for (let y = 0; y < this.gridManager.getRows(); y++) {
      for (let x = 0; x < this.gridManager.getCols(); x++) {
        const state = grid[y][x];

        switch (state) {
          case CellState.CAPTURED:
            // Draw island overlay with wooden deck color
            this.gridGraphics.fillStyle(0xD4A574, 0.9);
            this.gridGraphics.fillRect(
              x * cellSize,
              y * cellSize,
              cellSize,
              cellSize
            );
            // Add subtle grid lines for deck planks
            this.gridGraphics.lineStyle(1, 0xB8935C, 0.3);
            this.gridGraphics.strokeRect(
              x * cellSize,
              y * cellSize,
              cellSize,
              cellSize
            );
            hasCaptured = true;
            break;
          case CellState.VOID:
          default:
            continue; // Skip rendering void (sea background shows through)
        }
      }
    }

    // Draw trail as a smooth, thin line
    this.renderTrail();
    this.lastRenderedTrailLength = currentTrailLength;

    // Show/hide island overlay based on captured territory
    this.islandOverlay.setAlpha(hasCaptured ? 0.2 : 0);
  }

  private renderTrail(): void {
    const trail = this.mouse.getTrail();
    if (trail.length < 1) return;

    const cellSize = GameConfig.cellSize;
    const trailWidth = 3; // Thin trail width

    // Special case: if only 1 trail point, draw a dot and line to mouse position
    if (trail.length === 1 && this.mouse.isInVoid()) {
      const point = trail[0];
      const centerX = point.x * cellSize + cellSize / 2;
      const centerY = point.y * cellSize + cellSize / 2;

      const mousePos = this.mouse.getVisualPosition();
      const mouseX = mousePos.x * cellSize + cellSize / 2;
      const mouseY = mousePos.y * cellSize + cellSize / 2;

      // Draw glow for starting dot
      this.gridGraphics.fillStyle(0xFFD700, 0.5);
      this.gridGraphics.fillCircle(centerX, centerY, (trailWidth + 4) / 2);

      // Draw main starting dot
      this.gridGraphics.fillStyle(GameConfig.colors.trail, 1.0);
      this.gridGraphics.fillCircle(centerX, centerY, trailWidth / 2);

      // Draw line from starting point to current mouse position
      // Draw glow line
      this.gridGraphics.lineStyle(trailWidth + 4, 0xFFD700, 0.3);
      this.gridGraphics.beginPath();
      this.gridGraphics.moveTo(centerX, centerY);
      this.gridGraphics.lineTo(mouseX, mouseY);
      this.gridGraphics.strokePath();

      // Draw main line
      this.gridGraphics.lineStyle(trailWidth, GameConfig.colors.trail, 1.0);
      this.gridGraphics.beginPath();
      this.gridGraphics.moveTo(centerX, centerY);
      this.gridGraphics.lineTo(mouseX, mouseY);
      this.gridGraphics.strokePath();

      return;
    }

    // Helper function to draw trail path
    const drawTrailPath = () => {
      this.gridGraphics.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const centerX = point.x * cellSize + cellSize / 2;
        const centerY = point.y * cellSize + cellSize / 2;

        if (i === 0) {
          this.gridGraphics.moveTo(centerX, centerY);
        } else {
          this.gridGraphics.lineTo(centerX, centerY);
        }
      }

      // Connect trail to mouse's current visual position for smooth continuity
      if (this.mouse.isInVoid()) {
        const mousePos = this.mouse.getVisualPosition();
        const mouseX = mousePos.x * cellSize + cellSize / 2;
        const mouseY = mousePos.y * cellSize + cellSize / 2;
        this.gridGraphics.lineTo(mouseX, mouseY);
      }

      this.gridGraphics.strokePath();
    };

    // Draw outer glow
    this.gridGraphics.lineStyle(trailWidth + 4, 0xFFD700, 0.3);
    drawTrailPath();

    // Draw main trail line
    this.gridGraphics.lineStyle(trailWidth, GameConfig.colors.trail, 1.0);
    drawTrailPath();
  }

  private updatePowerUpSystem(delta: number): void {
    // Update spawn timer
    this.powerUpSpawnTimer -= delta;
    if (this.powerUpSpawnTimer <= 0 && this.powerUps.length < GameConfig.powerUps.maxActive) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = GameConfig.powerUps.spawnInterval;
    }

    // Update active effect timer
    if (this.activePowerUpEffect && this.powerUpEffectTimer > 0) {
      this.powerUpEffectTimer -= delta;

      if (this.powerUpEffectTimer <= 0) {
        // Effect expired - restore cats to normal
        this.endPowerUpEffect();
      }
    }
  }

  private spawnPowerUp(): void {
    const cellSize = GameConfig.cellSize;
    const cols = this.gridManager.getCols();
    const rows = this.gridManager.getRows();

    // Find a random VOID position
    let x: number = 0;
    let y: number = 0;
    let attempts = 0;
    let foundValidPosition = false;

    while (!foundValidPosition && attempts < 100) {
      const gridX = Phaser.Math.Between(10, cols - 10);
      const gridY = Phaser.Math.Between(10, rows - 10);

      if (this.gridManager.getCellState(gridX, gridY) === CellState.VOID) {
        x = gridX * cellSize + cellSize / 2;
        y = gridY * cellSize + cellSize / 2;

        // Make sure it's not too close to mouse
        const mousePos = this.mouse.getGridPosition();
        const mouseX = mousePos.x * cellSize + cellSize / 2;
        const mouseY = mousePos.y * cellSize + cellSize / 2;
        const distance = Phaser.Math.Distance.Between(x, y, mouseX, mouseY);

        if (distance > cellSize * 5) {
          foundValidPosition = true;
          break;
        }
      }

      attempts++;
    }

    if (!foundValidPosition) return;

    // Random power-up type
    const type = Phaser.Math.Between(0, 1) === 0 ? PowerUpType.FREEZE : PowerUpType.SLOW;
    const powerUp = new PowerUp(this, x, y, type);
    this.powerUps.push(powerUp);
  }

  private checkPowerUpCollection(): void {
    // PowerUp is a Container (not Sprite), so use distance-based collision
    // PowerUp visual size is GameConfig.cellSize * 2 = 20 pixels
    const mouseRadius = this.mouse.displayWidth / 2;
    const powerUpRadius = GameConfig.cellSize; // 10 pixels (half of 20px visual size)
    const collectionRadius = mouseRadius + powerUpRadius + 5; // +5px buffer for forgiving collection

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];

      // Calculate distance between mouse and power-up centers
      const distance = Phaser.Math.Distance.Between(
        this.mouse.x,
        this.mouse.y,
        powerUp.x,
        powerUp.y
      );

      // Check if mouse is close enough to collect
      if (distance < collectionRadius) {
        // Collect power-up
        this.collectPowerUp(powerUp);
        this.powerUps.splice(i, 1);
        // Only collect one power-up per frame
        break;
      }
    }
  }

  private collectPowerUp(powerUp: PowerUp): void {
    // End any existing effect first
    if (this.activePowerUpEffect) {
      this.endPowerUpEffect();
    }

    // Apply new effect
    this.activePowerUpEffect = powerUp.type;
    this.powerUpEffectTimer = GameConfig.powerUps.effectDuration;

    // Apply effect to all cats
    if (powerUp.type === PowerUpType.FREEZE) {
      this.cats.forEach(cat => cat.setCatState(CatState.FROZEN));
    } else if (powerUp.type === PowerUpType.SLOW) {
      this.cats.forEach(cat => cat.setCatState(CatState.SLOWED));
    }

    // Destroy power-up with animation
    powerUp.destroy();
  }

  private endPowerUpEffect(): void {
    // Restore all cats to normal state
    this.cats.forEach(cat => cat.setCatState(CatState.NORMAL));

    this.activePowerUpEffect = null;
    this.powerUpEffectTimer = 0;
  }

  // ===============================
  // Animated Background System
  // ===============================

  private createAnimatedBackground(): void {
    // Create graphics for animated waves (depth 0.5, above void but below captured territory)
    this.waveGraphics = this.add.graphics();
    this.waveGraphics.setDepth(0.5);

    // Create graphics for light caustics
    this.causticsGraphics = this.add.graphics();
    this.causticsGraphics.setDepth(0.6);
    this.causticsGraphics.setAlpha(0.2);

    // Create graphics for palm trees (depth 2.5, above deck at 2, below cats at 5)
    this.palmTreeGraphics = this.add.graphics();
    this.palmTreeGraphics.setDepth(2.5);

    // Create procedural particle textures
    this.createParticleTextures();

    // Create bubble particle emitter (only if texture exists)
    if (this.textures.exists('bubble')) {
      this.bubbleParticleManager = this.add.particles(0, 0, 'bubble', {
        x: { min: 0, max: GameConfig.width },
        y: GameConfig.height + 10,
        lifespan: { min: 3000, max: 6000 },
        speedY: { min: -30, max: -60 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.4, end: 0 },
        frequency: 100,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD
      });
      this.bubbleParticleManager.setDepth(0.7);
    }

    // Create sparkle particle emitter (treasure glints) - only if texture exists
    if (this.textures.exists('sparkle')) {
      this.sparkleParticleManager = this.add.particles(0, 0, 'sparkle', {
        x: { min: 0, max: GameConfig.width },
        y: { min: 0, max: GameConfig.height },
        lifespan: { min: 1500, max: 3000 },
        speedX: { min: -5, max: 5 },
        speedY: { min: -5, max: 5 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        frequency: 300,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xFFD700 // Golden treasure color
      });
      this.sparkleParticleManager.setDepth(0.8);
    }

    this.waveTime = 0;
  }

  private createParticleTextures(): void {
    // Create bubble texture
    const bubbleGraphics = this.add.graphics();
    bubbleGraphics.fillStyle(0x87CEEB, 1);
    bubbleGraphics.fillCircle(8, 8, 8);
    bubbleGraphics.lineStyle(2, 0xFFFFFF, 0.5);
    bubbleGraphics.strokeCircle(8, 8, 8);
    bubbleGraphics.generateTexture('bubble', 16, 16);
    bubbleGraphics.destroy();

    // Create sparkle texture (4-pointed star)
    const sparkleGraphics = this.add.graphics();
    sparkleGraphics.fillStyle(0xFFFFFF, 1);
    sparkleGraphics.fillCircle(8, 8, 6);

    // Add star points
    sparkleGraphics.fillStyle(0xFFFFFF, 0.8);
    const points = [
      { x: 8, y: 2 },   // Top
      { x: 8, y: 14 },  // Bottom
      { x: 2, y: 8 },   // Left
      { x: 14, y: 8 },  // Right
    ];
    points.forEach(point => {
      sparkleGraphics.fillCircle(point.x, point.y, 3);
    });

    sparkleGraphics.generateTexture('sparkle', 16, 16);
    sparkleGraphics.destroy();
  }

  private updateAnimatedBackground(_time: number, delta: number): void {
    this.waveTime += delta * 0.001; // Convert to seconds

    // Render animated waves
    this.renderAnimatedWaves();

    // Render light caustics
    this.renderLightCaustics();

    // Update palm trees if captured territory changed
    this.updatePalmTrees();
  }

  private renderAnimatedWaves(): void {
    this.waveGraphics.clear();

    const width = GameConfig.width;
    const height = GameConfig.height;
    const waveCount = 3; // Number of wave layers

    // Draw multiple wave layers at different depths
    for (let layer = 0; layer < waveCount; layer++) {
      const layerDepth = layer / waveCount;
      const waveHeight = 20 + layer * 10;
      const waveFrequency = 0.01 + layer * 0.005;
      const waveSpeed = 1 + layer * 0.5;
      const alpha = 0.15 - layer * 0.03;

      // Color gradient from deep blue to lighter blue-green
      const colors = [
        0x0A2540, // Deepest ocean
        0x1E3A5F, // Medium depth
        0x2E5A7F  // Lighter depth
      ];
      const color = colors[layer];

      this.waveGraphics.fillStyle(color, alpha);

      // Draw wave using sine function
      this.waveGraphics.beginPath();
      this.waveGraphics.moveTo(0, height);

      for (let x = 0; x <= width; x += 5) {
        const offset = this.waveTime * waveSpeed;
        const y1 = Math.sin((x + offset * 100) * waveFrequency) * waveHeight;
        const y2 = Math.sin((x + offset * 80) * waveFrequency * 1.3 + 1) * waveHeight * 0.7;
        const y3 = Math.sin((x + offset * 60) * waveFrequency * 0.8 + 2) * waveHeight * 0.5;

        const finalY = height * 0.3 + y1 + y2 + y3 + layerDepth * 50;

        if (x === 0) {
          this.waveGraphics.moveTo(x, finalY);
        } else {
          this.waveGraphics.lineTo(x, finalY);
        }
      }

      this.waveGraphics.lineTo(width, height);
      this.waveGraphics.lineTo(0, height);
      this.waveGraphics.closePath();
      this.waveGraphics.fillPath();
    }
  }

  private renderLightCaustics(): void {
    this.causticsGraphics.clear();

    const width = GameConfig.width;
    const height = GameConfig.height;
    const gridSize = 80; // Increased from 40 to reduce performance cost (4x fewer cells)
    const intensity = 0.3;

    // Draw animated light caustics using overlapping circles
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        // Add per-cell phase offset for smoother, more organic movement
        const phaseOffset = (x * 0.1 + y * 0.1);

        // Use multiple sine waves to create organic caustic pattern
        const offset1 = Math.sin((x * 0.02 + this.waveTime * 0.5 + phaseOffset)) * 20;
        const offset2 = Math.cos((y * 0.02 + this.waveTime * 0.3 + phaseOffset * 0.7)) * 20;
        const offset3 = Math.sin((x * 0.01 + y * 0.01 + this.waveTime * 0.4 + phaseOffset * 0.5)) * 15;

        const finalX = x + offset1 + offset3;
        const finalY = y + offset2 - offset3;

        // Calculate alpha based on position to create variation
        const alphaVariation = Math.sin(x * 0.1 + y * 0.1 + this.waveTime + phaseOffset) * 0.3 + 0.7;
        const alpha = intensity * alphaVariation;

        // Draw caustic light spot
        this.causticsGraphics.fillStyle(0x87CEEB, alpha); // Light blue
        this.causticsGraphics.fillCircle(finalX, finalY, gridSize * 0.6);

        // Add highlight
        this.causticsGraphics.fillStyle(0xFFFFFF, alpha * 0.5);
        this.causticsGraphics.fillCircle(finalX, finalY, gridSize * 0.3);
      }
    }
  }

  // ===============================
  // Palm Tree System
  // ===============================

  private updatePalmTrees(): void {
    // Count current captured cells
    const grid = this.gridManager.getGrid();
    let capturedCount = 0;
    for (let y = 0; y < this.gridManager.getRows(); y++) {
      for (let x = 0; x < this.gridManager.getCols(); x++) {
        if (grid[y][x] === CellState.CAPTURED) {
          capturedCount++;
        }
      }
    }

    // Update tree positions incrementally if captured territory changed
    if (capturedCount !== this.lastCapturedCells) {
      this.updatePalmTreePositions();
      this.lastCapturedCells = capturedCount;
    }

    // Render swaying palm trees
    this.renderPalmTrees();
  }

  private updatePalmTreePositions(): void {
    const grid = this.gridManager.getGrid();
    const cellSize = GameConfig.cellSize;
    const spacing = 7; // Place tree every 7x7 grid area

    // Step 1: Remove trees that are no longer on captured territory
    this.palmTreePositions = this.palmTreePositions.filter(tree => {
      const gridX = Math.floor(tree.x / cellSize);
      const gridY = Math.floor(tree.y / cellSize);

      return gridX >= 0 && gridX < this.gridManager.getCols() &&
             gridY >= 0 && gridY < this.gridManager.getRows() &&
             grid[gridY][gridX] === CellState.CAPTURED;
    });

    // Step 2: Build a spatial grid to track which areas already have trees
    // This prevents placing multiple trees in the same area
    const treeGrid = new Set<string>();
    for (const tree of this.palmTreePositions) {
      const areaX = Math.floor(tree.x / cellSize / spacing);
      const areaY = Math.floor(tree.y / cellSize / spacing);
      treeGrid.add(`${areaX},${areaY}`);
    }

    // Step 3: Scan captured territory and add NEW trees only where there aren't any
    for (let y = 0; y < this.gridManager.getRows(); y += spacing) {
      for (let x = 0; x < this.gridManager.getCols(); x += spacing) {
        const areaKey = `${Math.floor(x / spacing)},${Math.floor(y / spacing)}`;

        // Skip if this area already has a tree
        if (treeGrid.has(areaKey)) {
          continue;
        }

        // Check if this cell is captured
        if (grid[y][x] === CellState.CAPTURED) {
          // Add random offset within the spacing area
          const offsetX = Phaser.Math.Between(-spacing / 2, spacing / 2);
          const offsetY = Phaser.Math.Between(-spacing / 2, spacing / 2);

          const finalX = (x + offsetX) * cellSize + cellSize / 2;
          const finalY = (y + offsetY) * cellSize + cellSize / 2;

          // Verify final position is still in captured territory
          const gridX = Math.floor(finalX / cellSize);
          const gridY = Math.floor(finalY / cellSize);

          if (gridX >= 0 && gridX < this.gridManager.getCols() &&
              gridY >= 0 && gridY < this.gridManager.getRows() &&
              grid[gridY][gridX] === CellState.CAPTURED) {

            // Random tree size (small, medium, large)
            const size = Phaser.Math.Between(0, 2); // 0=small, 1=medium, 2=large

            // Unique phase offset based on position for organic sway
            const phaseOffset = (finalX * 0.01 + finalY * 0.01);

            this.palmTreePositions.push({
              x: finalX,
              y: finalY,
              size,
              phaseOffset
            });

            // Mark this area as occupied
            treeGrid.add(areaKey);
          }
        }
      }
    }
  }

  private renderPalmTrees(): void {
    this.palmTreeGraphics.clear();

    // Draw each palm tree with swaying animation
    // Trees are already filtered in updatePalmTreePositions() to only include captured territory
    for (const tree of this.palmTreePositions) {
      this.drawPalmTree(tree.x, tree.y, tree.size, tree.phaseOffset);
    }
  }

  private drawPalmTree(x: number, y: number, size: number, phaseOffset: number): void {
    // Size variations (reduced frond count from 6/7/8 to 4/5/6 for performance)
    const sizes = [
      { height: 20, width: 3, frondLength: 8, frondCount: 4 },   // Small
      { height: 30, width: 4, frondLength: 12, frondCount: 5 },  // Medium
      { height: 40, width: 5, frondLength: 15, frondCount: 6 }   // Large
    ];
    const config = sizes[size];

    // Calculate sway angle using sine wave
    const swaySpeed = 0.8 + size * 0.2; // Larger trees sway slower
    const swayAmount = 0.15 - size * 0.03; // Larger trees sway less
    const swayAngle = Math.sin(this.waveTime * swaySpeed + phaseOffset) * swayAmount;

    // Draw trunk (brown, slightly tapered)
    const trunkColor = 0x8B4513; // Saddle brown
    this.palmTreeGraphics.fillStyle(trunkColor, 1);

    // Draw trunk as a series of rectangles for slight curve effect
    const segments = 5;
    for (let i = 0; i < segments; i++) {
      const segmentY = y - (i / segments) * config.height;
      const segmentHeight = config.height / segments;
      const segmentWidth = config.width * (1 - (i / segments) * 0.3); // Taper toward top

      // Apply sway to upper segments
      const segmentSway = (i / segments) * swayAngle * config.height * 0.5;

      this.palmTreeGraphics.fillRect(
        x - segmentWidth / 2 + segmentSway,
        segmentY,
        segmentWidth,
        segmentHeight
      );
    }

    // Draw palm fronds at top (green, radiating outward)
    const frondColors = [0x228B22, 0x32CD32, 0x006400]; // Forest green, lime green, dark green
    const topX = x + swayAngle * config.height * 0.5;
    const topY = y - config.height;

    // Draw fronds radiating from top
    for (let i = 0; i < config.frondCount; i++) {
      const angle = (i / config.frondCount) * Math.PI * 2;
      const frondColor = frondColors[i % frondColors.length];

      // Add swaying motion to fronds
      const frondSway = Math.sin(this.waveTime * swaySpeed + phaseOffset + i * 0.5) * 0.1;
      const finalAngle = angle + swayAngle + frondSway;

      // Draw frond as filled triangle
      this.palmTreeGraphics.fillStyle(frondColor, 0.8);
      this.palmTreeGraphics.beginPath();

      // Frond base (at top of trunk)
      this.palmTreeGraphics.moveTo(topX, topY);

      // Frond tip
      const tipX = topX + Math.cos(finalAngle) * config.frondLength;
      const tipY = topY + Math.sin(finalAngle) * config.frondLength;

      // Frond side points (for width)
      const perpAngle = finalAngle + Math.PI / 2;
      const frondWidth = config.width * 0.8;

      const side1X = topX + Math.cos(perpAngle) * frondWidth / 2;
      const side1Y = topY + Math.sin(perpAngle) * frondWidth / 2;
      const side2X = topX - Math.cos(perpAngle) * frondWidth / 2;
      const side2Y = topY - Math.sin(perpAngle) * frondWidth / 2;

      // Draw curved frond
      this.palmTreeGraphics.lineTo(side1X, side1Y);
      this.palmTreeGraphics.lineTo(tipX, tipY);
      this.palmTreeGraphics.lineTo(side2X, side2Y);
      this.palmTreeGraphics.closePath();
      this.palmTreeGraphics.fillPath();
    }

    // Optional: Add coconuts (small brown circles at base of fronds)
    if (size >= 1) { // Only medium and large trees
      const coconutCount = 2 + size;
      for (let i = 0; i < coconutCount; i++) {
        // Fixed angle positions that sway with tree, not orbit continuously
        const baseAngle = (i / coconutCount) * Math.PI * 2;
        const coconutAngle = baseAngle + swayAngle * 0.3; // Sway gently with tree
        const coconutDistance = config.width * 1.5;
        const coconutX = topX + Math.cos(coconutAngle) * coconutDistance;
        const coconutY = topY + Math.sin(coconutAngle) * coconutDistance;
        const coconutRadius = 2 + size * 0.5;

        this.palmTreeGraphics.fillStyle(0x654321, 1); // Dark brown
        this.palmTreeGraphics.fillCircle(coconutX, coconutY, coconutRadius);
      }
    }
  }

  private increasePlayerSpeed(): void {
    // Increase player speed by configured percentage (default 10%)
    const speedIncrease = 1 + GameConfig.speedIncreasePerCat; // 1.1 for 10% increase
    this.mouse.increaseSpeed(speedIncrease);
  }

  // Cleanup method to prevent memory leaks
  shutdown(): void {
    // Destroy particle emitters
    this.bubbleParticleManager?.destroy();
    this.sparkleParticleManager?.destroy();

    // Destroy graphics objects
    this.waveGraphics?.destroy();
    this.causticsGraphics?.destroy();
    this.palmTreeGraphics?.destroy();
  }
}
