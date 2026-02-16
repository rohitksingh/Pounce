import Phaser from 'phaser';
import { GameConfig, CellState } from '../config/GameConfig';
import { GridManager } from '../utils/GridManager';
import { Mouse } from '../entities/Mouse';
import { Cat, CatState } from '../entities/Cat';
import { PowerUp, PowerUpType } from '../entities/PowerUp';
import { FloodFill } from '../utils/FloodFill';
import { getLevelConfig, LEVELS, LevelDefinition } from '../config/LevelConfig';
import { getThemeConfig, ThemeVisuals } from '../config/ThemeConfig';

export class GameScene extends Phaser.Scene {
  private gridManager!: GridManager;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private islandOverlay!: Phaser.GameObjects.TileSprite;
  private mouse!: Mouse;
  private cats: Cat[] = [];
  private powerUps: PowerUp[] = [];
  private lives: number = GameConfig.initialLives;
  private gameOver: boolean = false;
  private lastRenderedTrailLength: number = 0;

  // Level system
  private currentLevel: number = 1;
  private levelConfig: LevelDefinition | null = null;
  private currentTheme!: ThemeVisuals;

  // Power-up system state
  private powerUpSpawnTimer: number = 0;
  private activePowerUpEffect: PowerUpType | null = null;
  private powerUpEffectTimer: number = 0;
  private powerUpUIElement: HTMLElement | null = null;

  // New UI elements
  private progressBar: HTMLElement | null = null;
  private percentageText: HTMLElement | null = null;
  private livesDisplay: HTMLElement | null = null;
  private piratesDisplay: HTMLElement | null = null;
  private scoreDisplay: HTMLElement | null = null;
  private minimapCanvas: HTMLCanvasElement | null = null;
  private minimapContext: CanvasRenderingContext2D | null = null;

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

  create(data?: { level?: number }) {
    // Initialize level system
    this.currentLevel = data?.level || 1;
    this.levelConfig = getLevelConfig(this.currentLevel);
    this.currentTheme = getThemeConfig(this.levelConfig.theme);
    this.applyLevelConfig();

    // Reset game state for new level
    this.lives = GameConfig.initialLives;
    this.gameOver = false;
    this.cats = [];
    this.powerUps = [];
    this.activePowerUpEffect = null;
    this.powerUpEffectTimer = 0;
    this.powerUpSpawnTimer = GameConfig.powerUps.spawnInterval;
    this.lastRenderedTrailLength = 0;
    this.palmTreePositions = [];
    this.lastCapturedCells = 0;
    this.waveTime = 0;

    console.log('[GameScene] Game scene started');
    console.log(`[GameScene] Level ${this.currentLevel}: ${this.levelConfig.name}`);
    console.log(`[GameScene] Win condition: ${GameConfig.winPercentage}% territory`);
    console.log(`[GameScene] Pirates: ${GameConfig.initialCats} | Speed: ${GameConfig.catSpeed}`);
    console.log(`[GameScene] Grid size: ${GameConfig.gridCols}x${GameConfig.gridRows} = ${GameConfig.gridCols * GameConfig.gridRows} cells`);

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

    // Get reference to new UI elements and make them visible
    const uiTopBar = document.getElementById('ui-top-bar');
    if (uiTopBar) {
      uiTopBar.style.display = 'block';
    } else {
      console.error('[GameScene] Critical UI element missing: ui-top-bar');
    }

    const uiBottomBar = document.getElementById('ui-bottom-bar');
    if (uiBottomBar) {
      uiBottomBar.style.display = 'block';
    } else {
      console.error('[GameScene] Critical UI element missing: ui-bottom-bar');
    }

    // Get references to individual UI elements
    this.progressBar = document.querySelector('.progress-bar') as HTMLElement;
    this.percentageText = document.querySelector('#territory-display .percentage') as HTMLElement;
    this.livesDisplay = document.getElementById('lives-display');
    this.piratesDisplay = document.getElementById('pirates-display');
    this.scoreDisplay = document.getElementById('score-display');
    this.powerUpUIElement = document.getElementById('powerup-display');

    // Initialize minimap
    this.minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    if (this.minimapCanvas) {
      this.minimapCanvas.width = 80; // Grid cols
      this.minimapCanvas.height = 60; // Grid rows
      this.minimapContext = this.minimapCanvas.getContext('2d');
    }

    // Verify critical UI elements
    if (!this.progressBar) console.error('[GameScene] Missing progress-bar');
    if (!this.percentageText) console.error('[GameScene] Missing percentage text');
    if (!this.livesDisplay) console.error('[GameScene] Missing lives-display');
    if (!this.piratesDisplay) console.error('[GameScene] Missing pirates-display');
    if (!this.scoreDisplay) console.error('[GameScene] Missing score-display');

    // Initialize lives display
    this.updateLivesDisplay();

    // Start power-up spawn timer
    this.powerUpSpawnTimer = GameConfig.powerUps.spawnInterval;

    // Render initial grid
    this.renderGrid();
  }

  private applyLevelConfig(): void {
    if (!this.levelConfig) return;

    // Apply level-specific difficulty settings
    GameConfig.initialCats = this.levelConfig.catCount;
    GameConfig.catSpeed = this.levelConfig.catSpeed;
    GameConfig.winPercentage = this.levelConfig.winPercentage;
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
    console.log(`[GameScene] Territory captured: ${percentage.toFixed(2)}% (win threshold: ${GameConfig.winPercentage}%)`);

    if (percentage >= GameConfig.winPercentage) {
      console.log(`[GameScene] WIN CONDITION MET! ${percentage.toFixed(2)}% >= ${GameConfig.winPercentage}%`);
      this.gameOver = true;
      this.showWin();
    }
  }

  private showGameOver(): void {
    this.gameOver = true;

    // Hide game UI elements before transition
    this.hideGameUI();

    // Return to menu with option to retry same level
    try {
      this.scene.start('MenuScene', {
        lastLevel: this.currentLevel
      });
    } catch (error) {
      console.error('[GameScene] Failed to start MenuScene:', error);
    }
  }

  private showWin(): void {
    this.gameOver = true;
    const percentage = this.gridManager.getPercentageCaptured();

    // Hide game UI elements before transition
    this.hideGameUI();

    // Check if there's a next level
    if (this.currentLevel < LEVELS.length) {
      // Transition to level complete screen
      try {
        this.scene.start('LevelCompleteScene', {
          completedLevel: this.currentLevel,
          nextLevel: this.currentLevel + 1,
          percentage: percentage
        });
      } catch (error) {
        console.error('[GameScene] Failed to start LevelCompleteScene:', error);
        // Fallback to menu on error
        this.scene.start('MenuScene');
      }
    } else {
      // All levels complete! Show victory screen
      try {
        this.scene.start('VictoryScene', {
          percentage: percentage
        });
      } catch (error) {
        console.error('[GameScene] Failed to start VictoryScene:', error);
        // Fallback to menu on error
        this.scene.start('MenuScene');
      }
    }
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
    const winPercentage = this.levelConfig?.winPercentage || GameConfig.winPercentage;

    // Update progress bar
    if (this.progressBar) {
      const progressPercent = (percentage / winPercentage) * 100;
      this.progressBar.style.width = `${Math.min(progressPercent, 100)}%`;

      // Add near-target glow effect when close to winning
      if (percentage >= winPercentage * 0.9) {
        this.progressBar.classList.add('near-target');
      } else {
        this.progressBar.classList.remove('near-target');
      }
    }

    // Update percentage text
    if (this.percentageText) {
      this.percentageText.textContent = `${percentage.toFixed(1)}% / ${winPercentage}%`;
    }

    // Update pirates count
    if (this.piratesDisplay) {
      this.piratesDisplay.textContent = `☠️ Pirates: ${this.cats.length}`;
    }

    // Update score display
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = `🏆 Territory: ${percentage.toFixed(1)}%`;
    }

    // Update power-up UI
    if (this.powerUpUIElement) {
      if (this.activePowerUpEffect && this.powerUpEffectTimer > 0) {
        const secondsLeft = Math.ceil(this.powerUpEffectTimer / 1000);
        const effectName = this.activePowerUpEffect === PowerUpType.FREEZE ? '❄️ FREEZE' : '🐌 SLOW';
        this.powerUpUIElement.textContent = `${effectName}: ${secondsLeft}s`;
        this.powerUpUIElement.classList.add('active');
      } else {
        this.powerUpUIElement.classList.remove('active');
      }
    }

    // Update minimap
    this.updateMinimap();
  }

  private updateMinimap(): void {
    if (!this.minimapContext || !this.minimapCanvas) return;

    const ctx = this.minimapContext;
    const grid = this.gridManager.getGrid();
    const cols = GameConfig.gridCols;
    const rows = GameConfig.gridRows;

    // Clear minimap
    ctx.clearRect(0, 0, cols, rows);

    // Draw grid (1 pixel per cell)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        if (cell === CellState.CAPTURED) {
          ctx.fillStyle = '#ffd700'; // Gold for captured
        } else if (cell === CellState.TRAIL) {
          ctx.fillStyle = '#f1c40f'; // Yellow for trail
        } else {
          ctx.fillStyle = '#1E3A5F'; // Dark blue for void
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw cats as red pixels
    for (const cat of this.cats) {
      const catGridX = Math.floor(cat.x / GameConfig.cellSize);
      const catGridY = Math.floor(cat.y / GameConfig.cellSize);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(catGridX, catGridY, 1, 1);
    }

    // Draw mouse as orange pixel
    const mousePos = this.mouse.getGridPosition();
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(mousePos.x, mousePos.y, 1, 1);
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

    // Visual feedback: screen shake and damage flash
    this.triggerDamageEffects();

    // Update hearts display
    this.updateLivesDisplay();

    // Reset speed to base on death
    this.mouse.resetSpeed();
    console.log('[GameScene] Player hit! Speed reset to base.');

    if (this.lives <= 0) {
      this.gameOver = true;
      this.showGameOver();
    } else {
      // Respawn at random captured location
      this.mouse.respawn();
      console.log(`[GameScene] Player respawned. Lives remaining: ${this.lives}`);
    }
  }

  private updateLivesDisplay(): void {
    if (!this.livesDisplay) return;

    const hearts = this.livesDisplay.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
      if (index >= this.lives) {
        // Lost heart - fade out
        heart.classList.add('lost');
      } else if (this.lives === 1) {
        // Last heart - danger animation
        heart.classList.add('danger');
      } else {
        // Normal heart
        heart.classList.remove('lost', 'danger');
      }
    });
  }

  private triggerDamageEffects(): void {
    // Screen shake
    const appWrapper = document.getElementById('app-wrapper');
    if (appWrapper) {
      appWrapper.classList.add('shake');
      setTimeout(() => appWrapper.classList.remove('shake'), 500);
    }

    // Red flash on game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.classList.add('damage-flash');
      setTimeout(() => gameContainer.classList.remove('damage-flash'), 300);
    }
  }

  private spawnCats(): void {
    const cellSize = GameConfig.cellSize;
    const cols = this.gridManager.getCols();
    const rows = this.gridManager.getRows();
    const minDistance = 50; // Minimum distance between cats

    // Center island parameters (7x7 area from T022)
    const centerX = Math.floor(cols / 2); // Grid cell coordinate
    const centerY = Math.floor(rows / 2); // Grid cell coordinate
    const islandRadius = 3; // Radius in grid cells

    for (let i = 0; i < GameConfig.initialCats; i++) {
      let x: number = cellSize * 10;
      let y: number = cellSize * 10;
      let validPosition = false;
      let attempts = 0;

      // Try to find a valid position that's not too close to other cats
      while (!validPosition && attempts < 100) {
        // Spawn in VOID area (not near edges)
        x = Phaser.Math.Between(cellSize * 5, (cols - 5) * cellSize);
        y = Phaser.Math.Between(cellSize * 5, (rows - 5) * cellSize);

        // Convert pixel coordinates to grid coordinates
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);

        // Check if position is on center island (avoid spawning there)
        const onCenterIsland =
          Math.abs(gridX - centerX) <= islandRadius &&
          Math.abs(gridY - centerY) <= islandRadius;

        if (onCenterIsland) {
          attempts++;
          continue; // Try another position
        }

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

      // Fallback if we couldn't find a valid position
      if (attempts >= 100) {
        console.warn(`[GameScene] Could not find valid spawn for cat ${i}, using fallback position`);
        // Spawn near edges away from center
        x = i * 80 + 50;
        y = 50;
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
            // Draw island overlay with theme-specific color
            this.gridGraphics.fillStyle(this.currentTheme.territory.baseColor, 0.9);
            this.gridGraphics.fillRect(
              x * cellSize,
              y * cellSize,
              cellSize,
              cellSize
            );
            // Add subtle grid lines
            this.gridGraphics.lineStyle(1, this.currentTheme.territory.lineColor, 0.3);
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

    // Add spawn animation (scale from 0 to 1)
    powerUp.setScale(0);
    this.tweens.add({
      targets: powerUp,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Add spawn particle burst
    if (this.textures.exists('trail-particle')) {
      const spawnColor = type === PowerUpType.FREEZE ? 0x3498DB : 0x95A5A6;
      const spawnParticles = this.add.particles(x, y, 'trail-particle', {
        speed: { min: 50, max: 100 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 600,
        quantity: 20,
        tint: spawnColor,
        blendMode: Phaser.BlendModes.ADD
      });

      // Auto-destroy after 1 second
      this.time.delayedCall(1000, () => {
        spawnParticles.destroy();
      });
    }

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

    // Collection visual effects
    this.playPowerUpCollectionEffects(powerUp);

    // Destroy power-up with animation
    this.tweens.add({
      targets: powerUp,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        powerUp.destroy();
      }
    });
  }

  private playPowerUpCollectionEffects(powerUp: PowerUp): void {
    const x = powerUp.x;
    const y = powerUp.y;
    const collectionColor = powerUp.type === PowerUpType.FREEZE ? 0x3498DB : 0x95A5A6;

    // Burst particle effect
    if (this.textures.exists('trail-particle')) {
      const burstParticles = this.add.particles(x, y, 'trail-particle', {
        speed: { min: 100, max: 200 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1.0, end: 0 },
        lifespan: 800,
        quantity: 30,
        tint: collectionColor,
        blendMode: Phaser.BlendModes.ADD
      });

      // Auto-destroy after 1 second
      this.time.delayedCall(1000, () => {
        burstParticles.destroy();
      });
    }

    // Screen flash effect
    const flashGraphics = this.add.graphics();
    flashGraphics.fillStyle(collectionColor, 0.3);
    flashGraphics.fillRect(0, 0, GameConfig.width, GameConfig.height);
    flashGraphics.setDepth(100); // Above everything

    // Fade out flash
    this.tweens.add({
      targets: flashGraphics,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        flashGraphics.destroy();
      }
    });
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

    // Create primary particle emitter (bubble/snowflake/sand - only if texture exists)
    if (this.textures.exists('bubble')) {
      const primaryParticle = this.currentTheme.particles.primary;
      const spawnFromBottom = primaryParticle.direction === 'up';

      this.bubbleParticleManager = this.add.particles(0, 0, 'bubble', {
        x: { min: 0, max: GameConfig.width },
        y: spawnFromBottom ? GameConfig.height + 10 : -10,
        lifespan: { min: 3000, max: 6000 },
        speedY: spawnFromBottom ? { min: -30, max: -60 } : { min: 30, max: 60 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.4, end: 0 },
        frequency: 100,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
        tint: primaryParticle.tint
      });
      this.bubbleParticleManager.setDepth(0.7);
    }

    // Create secondary particle emitter (sparkle/ice-crystal/dust - only if texture exists)
    if (this.textures.exists('sparkle')) {
      const secondaryParticle = this.currentTheme.particles.secondary;

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
        tint: secondaryParticle.tint
      });
      this.sparkleParticleManager.setDepth(0.8);
    }

    this.waveTime = 0;
  }

  private createParticleTextures(): void {
    // Create primary particle texture (bubble, snowflake, or sand)
    const primaryColor = this.currentTheme.particles.primary.color;
    const bubbleGraphics = this.add.graphics();
    bubbleGraphics.fillStyle(primaryColor, 1);
    bubbleGraphics.fillCircle(8, 8, 8);
    bubbleGraphics.lineStyle(2, 0xFFFFFF, 0.5);
    bubbleGraphics.strokeCircle(8, 8, 8);
    bubbleGraphics.generateTexture('bubble', 16, 16);
    bubbleGraphics.destroy();

    // Create secondary particle texture (sparkle, ice-crystal, or dust)
    const secondaryColor = this.currentTheme.particles.secondary.color;
    const sparkleGraphics = this.add.graphics();
    sparkleGraphics.fillStyle(secondaryColor, 1);
    sparkleGraphics.fillCircle(8, 8, 6);

    // Add star points
    sparkleGraphics.fillStyle(secondaryColor, 0.8);
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

    // Render ambient effect (caustics, aurora, or heatwave)
    this.renderAmbientEffect();

    // Update palm trees if captured territory changed
    this.updatePalmTrees();
  }

  private renderAnimatedWaves(): void {
    this.waveGraphics.clear();

    const width = GameConfig.width;
    const height = GameConfig.height;
    const waveCount = 3; // Number of wave layers

    // Get theme-specific colors and parameters
    const colors = this.currentTheme.backgroundLayers.colors;
    const alphas = this.currentTheme.backgroundLayers.alpha;
    const speedMult = this.currentTheme.backgroundLayers.speedMultiplier;
    const ampMult = this.currentTheme.backgroundLayers.amplitudeMultiplier;

    // Draw multiple wave layers at different depths
    for (let layer = 0; layer < waveCount; layer++) {
      const layerDepth = layer / waveCount;
      const waveHeight = (20 + layer * 10) * ampMult;
      const waveFrequency = 0.01 + layer * 0.005;
      const waveSpeed = (1 + layer * 0.5) * speedMult;
      const alpha = alphas[layer];

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

  private renderAmbientEffect(): void {
    this.causticsGraphics.clear();

    const width = GameConfig.width;
    const height = GameConfig.height;
    const gridSize = 80; // Increased from 40 to reduce performance cost (4x fewer cells)
    const intensity = this.currentTheme.ambientEffect.intensity;
    const color = this.currentTheme.ambientEffect.color;
    const secondaryColor = this.currentTheme.ambientEffect.secondaryColor;

    // Draw animated ambient effect using overlapping circles
    // Works for caustics, aurora, and heatwave effects
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        // Add per-cell phase offset for smoother, more organic movement
        const phaseOffset = (x * 0.1 + y * 0.1);

        // Use multiple sine waves to create organic pattern
        const offset1 = Math.sin((x * 0.02 + this.waveTime * 0.5 + phaseOffset)) * 20;
        const offset2 = Math.cos((y * 0.02 + this.waveTime * 0.3 + phaseOffset * 0.7)) * 20;
        const offset3 = Math.sin((x * 0.01 + y * 0.01 + this.waveTime * 0.4 + phaseOffset * 0.5)) * 15;

        const finalX = x + offset1 + offset3;
        const finalY = y + offset2 - offset3;

        // Calculate alpha based on position to create variation
        const alphaVariation = Math.sin(x * 0.1 + y * 0.1 + this.waveTime + phaseOffset) * 0.3 + 0.7;
        const alpha = intensity * alphaVariation;

        // Draw ambient light spot
        this.causticsGraphics.fillStyle(color, alpha);
        this.causticsGraphics.fillCircle(finalX, finalY, gridSize * 0.6);

        // Add highlight/secondary color
        this.causticsGraphics.fillStyle(secondaryColor, alpha * 0.5);
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

    // Draw each decoration with animation (palms, cacti, or icebergs)
    // Decorations are already filtered in updatePalmTreePositions() to only include captured territory
    for (const tree of this.palmTreePositions) {
      this.drawDecoration(tree.x, tree.y, tree.size, tree.phaseOffset);
    }
  }

  private drawDecoration(x: number, y: number, size: number, phaseOffset: number): void {
    // Dispatch to appropriate decoration type based on theme
    switch (this.currentTheme.decoration.type) {
      case 'palm':
        this.drawPalmTree(x, y, size, phaseOffset);
        break;
      case 'cactus':
        this.drawCactus(x, y, size, phaseOffset);
        break;
      case 'iceberg':
        this.drawIceberg(x, y, size, phaseOffset);
        break;
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
    const trunkColor = this.currentTheme.decoration.trunkColor;
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
    const frondColors = this.currentTheme.decoration.foliageColors;
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

  private drawCactus(x: number, y: number, size: number, phaseOffset: number): void {
    // Size variations for cacti
    const sizes = [
      { height: 25, width: 8, armCount: 2 },   // Small
      { height: 35, width: 10, armCount: 3 },  // Medium
      { height: 45, width: 12, armCount: 4 }   // Large
    ];
    const config = sizes[size];

    const cactusColor = this.currentTheme.decoration.trunkColor;
    const detailColors = this.currentTheme.decoration.foliageColors;

    // Draw main cactus body (vertical rectangle with rounded top)
    this.palmTreeGraphics.fillStyle(cactusColor, 1);
    this.palmTreeGraphics.fillRoundedRect(
      x - config.width / 2,
      y - config.height,
      config.width,
      config.height,
      config.width / 3
    );

    // Draw cactus arms (horizontal branches)
    for (let i = 0; i < config.armCount; i++) {
      const armHeight = config.height * (0.3 + i * 0.2);
      const armLength = config.width * (1.5 + Math.sin(phaseOffset + i) * 0.3);
      const armWidth = config.width * 0.6;
      const armY = y - armHeight;

      // Alternate left and right arms
      const direction = i % 2 === 0 ? 1 : -1;
      const armX = x + direction * (config.width / 2);

      // Draw arm (L-shaped)
      const armColor = detailColors[i % detailColors.length];
      this.palmTreeGraphics.fillStyle(armColor, 0.9);

      // Horizontal part
      this.palmTreeGraphics.fillRoundedRect(
        direction > 0 ? armX : armX - armLength,
        armY - armWidth / 2,
        armLength,
        armWidth,
        armWidth / 3
      );

      // Vertical part going up
      this.palmTreeGraphics.fillRoundedRect(
        direction > 0 ? armX + armLength - armWidth : armX,
        armY - armLength * 0.6,
        armWidth,
        armLength * 0.6,
        armWidth / 3
      );
    }

    // Add cactus spines (small lines)
    this.palmTreeGraphics.lineStyle(1, 0xFFFFFF, 0.4);
    const spineCount = 8 + size * 4;
    for (let i = 0; i < spineCount; i++) {
      const spineY = y - (i / spineCount) * config.height;
      const spineX = x + (Math.sin(i * 1.5 + phaseOffset) > 0 ? 1 : -1) * config.width / 2;
      const spineLength = 3 + Math.random() * 2;

      this.palmTreeGraphics.lineTo(spineX, spineY);
      this.palmTreeGraphics.lineTo(spineX + spineLength, spineY);
    }
    this.palmTreeGraphics.strokePath();
  }

  private drawIceberg(x: number, y: number, size: number, phaseOffset: number): void {
    // Size variations for icebergs
    const sizes = [
      { width: 40, height: 25, peakCount: 2 },   // Small
      { width: 55, height: 35, peakCount: 3 },   // Medium
      { width: 70, height: 45, peakCount: 4 }    // Large
    ];
    const config = sizes[size];

    // Calculate bob animation (icebergs float gently)
    const bobSpeed = 0.5 + size * 0.1;
    const bobAmount = 2 + size * 0.5;
    const bobOffset = Math.sin(this.waveTime * bobSpeed + phaseOffset) * bobAmount;

    const icebergColor = this.currentTheme.decoration.trunkColor;
    const shadeColors = this.currentTheme.decoration.foliageColors;

    const finalY = y + bobOffset;

    // Draw main iceberg body (irregular polygon with peaks)
    this.palmTreeGraphics.fillStyle(icebergColor, 0.9);
    this.palmTreeGraphics.beginPath();

    // Start at bottom left
    this.palmTreeGraphics.moveTo(x - config.width / 2, finalY);

    // Create jagged peaks at top
    for (let i = 0; i <= config.peakCount; i++) {
      const peakX = x - config.width / 2 + (i / config.peakCount) * config.width;
      const peakY = finalY - config.height - (i % 2 === 0 ? 5 : 0);
      this.palmTreeGraphics.lineTo(peakX, peakY);
    }

    // Complete the shape
    this.palmTreeGraphics.lineTo(x + config.width / 2, finalY);
    this.palmTreeGraphics.closePath();
    this.palmTreeGraphics.fillPath();

    // Add shading layers for depth
    for (let layer = 0; layer < shadeColors.length; layer++) {
      const layerHeight = config.height * (0.3 + layer * 0.2);
      const layerWidth = config.width * (0.8 - layer * 0.2);

      this.palmTreeGraphics.fillStyle(shadeColors[layer], 0.4 - layer * 0.1);
      this.palmTreeGraphics.fillRect(
        x - layerWidth / 2,
        finalY - layerHeight,
        layerWidth,
        layerHeight * 0.3
      );
    }

    // Add ice crystals/highlights (small white dots)
    this.palmTreeGraphics.fillStyle(0xFFFFFF, 0.7);
    const crystalCount = 4 + size * 2;
    for (let i = 0; i < crystalCount; i++) {
      const crystalX = x + (Math.random() - 0.5) * config.width * 0.6;
      const crystalY = finalY - Math.random() * config.height * 0.8;
      const crystalSize = 1 + Math.random() * 1.5;
      this.palmTreeGraphics.fillCircle(crystalX, crystalY, crystalSize);
    }
  }

  private increasePlayerSpeed(): void {
    // Increase player speed by configured percentage (default 10%)
    const speedIncrease = 1 + GameConfig.speedIncreasePerCat; // 1.1 for 10% increase
    this.mouse.increaseSpeed(speedIncrease);
  }

  private hideGameUI(): void {
    const uiTopBar = document.getElementById('ui-top-bar');
    if (uiTopBar) uiTopBar.style.display = 'none';

    const uiBottomBar = document.getElementById('ui-bottom-bar');
    if (uiBottomBar) uiBottomBar.style.display = 'none';

    const powerupContainer = document.getElementById('powerup-container');
    if (powerupContainer) powerupContainer.style.display = 'none';
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
