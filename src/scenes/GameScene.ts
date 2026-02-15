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
  private seaBackground!: Phaser.GameObjects.TileSprite;
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

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Create tiled sea background
    this.seaBackground = this.add.tileSprite(
      0,
      0,
      GameConfig.width,
      GameConfig.height,
      'sea'
    );
    this.seaBackground.setOrigin(0, 0);
    this.seaBackground.setDepth(0); // Background layer

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

    // Get reference to DOM UI elements
    this.uiElement = document.getElementById('ui-container');
    this.powerUpUIElement = document.getElementById('powerup-container');

    // Start power-up spawn timer
    this.powerUpSpawnTimer = GameConfig.powerUps.spawnInterval;

    // Render initial grid
    this.renderGrid();
  }

  private handleLoopCompleted(trail: { x: number; y: number }[]): void {
    const catsToDestroy = FloodFill.fillTerritory(this.gridManager, trail, this.cats);
    this.mouse.resetTrail();

    // Destroy trapped cats
    if (catsToDestroy.length > 0) {
      catsToDestroy.forEach(cat => {
        cat.destroy();
      });
      // Remove from cats array
      this.cats = this.cats.filter(cat => !catsToDestroy.includes(cat));
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

    // Animate sea background
    this.seaBackground.tilePositionX += 0.2;
    this.seaBackground.tilePositionY += 0.1;

    this.mouse.update(time, delta);
    this.updatePowerUpSystem(delta);
    this.checkCollisions();
    this.checkPowerUpCollection();
    this.renderGrid();
    this.updateUI();
  }

  private updateUI(): void {
    const percentage = this.gridManager.getPercentageCaptured();
    if (this.uiElement) {
      this.uiElement.textContent = `Territory: ${percentage.toFixed(1)}% | Lives: ${this.lives} | Pirates: ${this.cats.length}`;
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
    const mousePos = this.mouse.getGridPosition();
    const cellSize = GameConfig.cellSize;
    const mouseX = mousePos.x * cellSize + cellSize / 2;
    const mouseY = mousePos.y * cellSize + cellSize / 2;
    const collectionRadius = cellSize * 1.0; // Reduced from 2.0 to match visual size

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      const distance = Phaser.Math.Distance.Between(mouseX, mouseY, powerUp.x, powerUp.y);

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
}
