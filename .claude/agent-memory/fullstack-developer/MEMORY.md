# Pounce Game - Full Stack Developer Memory

## Project Overview
- Game built with Phaser 3, TypeScript, and Vite
- Grid-based territory capture game with pirate theme
- Player controls a mouse that captures territory by creating loops
- 7 pirate opponents chase the player and can destroy trails
- Power-up system adds freeze and slow effects

## Key Architecture Patterns

### Visual Interpolation System
- Mouse sprite uses smooth interpolation between grid positions
- Grid positions (`gridX`, `gridY`) are discrete cell coordinates
- Visual positions (`visualX`, `visualY`) use linear interpolation for smooth movement
- Trail rendering must connect to visual position, not just grid positions

### Trail Rendering Fix (2026-02-15)
**Problem**: Trail had visible gaps/discontinuities when mouse moved
**Root Cause**: Trail only connected discrete grid positions, but mouse sprite used interpolated visual position
**Solution**: Modified `renderTrail()` in GameScene.ts to:
1. Draw lines connecting all grid-based trail points
2. Add final line segment from last trail point to mouse's current visual position
3. Only add this segment when mouse is in void (drawing trail)

**Files Changed**:
- `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts` - Added visual position connection in `renderTrail()`
- `/Users/rohit/workspace/Pounce/src/entities/Mouse.ts` - Added `getVisualPosition()` method

### Important File Locations
- Game scene: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`
- Mouse entity: `/Users/rohit/workspace/Pounce/src/entities/Mouse.ts`
- Cat entity: `/Users/rohit/workspace/Pounce/src/entities/Cat.ts`
- PowerUp entity: `/Users/rohit/workspace/Pounce/src/entities/PowerUp.ts`
- Grid manager: `/Users/rohit/workspace/Pounce/src/utils/GridManager.ts`
- Config: `/Users/rohit/workspace/Pounce/src/config/GameConfig.ts`

## Rendering Layers
- Depth 0.5: Animated waves (multi-layer sine waves)
- Depth 0.6: Light caustics (underwater shimmer)
- Depth 0.7: Rising bubble particles
- Depth 0.8: Treasure sparkle particles
- Depth 1: Island overlay (tiled sprite with alpha)
- Depth 2: Grid graphics (captured territory, trail)
- Depth 2.5: Palm trees (swaying animation on captured territory) - FIXED depth from 1.5
- Depth 3: Power-ups
- Depth 5: Cats
- Depth 6: Cat state overlays (freeze/slow visual effects)
- Depth 10: Mouse sprite
- Depth 100: UI elements

## Animated Background System (2026-02-15)
**Location**: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`

**Four-Layer Ocean System**:
1. **Animated Ocean Waves** - Multi-layer sine wave rendering using Graphics API
2. **Light Caustics** - Underwater sunlight shimmer effect
3. **Rising Bubbles** - Particle system floating upward
4. **Treasure Sparkles** - Golden particle effects for pirate theme

**Implementation Details**:
- All effects are procedural (no image files)
- Depth layers: 0.5 (waves), 0.6 (caustics), 0.7 (bubbles), 0.8 (sparkles)
- Particles use procedurally generated textures via Graphics API
- Continuous animation driven by time-based sine/cosine functions
- Performance optimized with 80px caustic grid spacing (reduced from 40px)

**Key Methods**:
- `createAnimatedBackground()` - Initializes all background layers
- `createParticleTextures()` - Generates bubble and sparkle textures
- `updateAnimatedBackground()` - Updates animations each frame
- `renderAnimatedWaves()` - Draws 3 layers of sine waves
- `renderLightCaustics()` - Draws animated light patterns with per-cell phase offsets
- `shutdown()` - Cleanup method to prevent memory leaks

**Procedural Techniques**:
- Particle texture generation: Use Graphics API then `generateTexture()`
- Animated waves: Multiple sine waves with different frequencies/speeds
- Light caustics: Grid-based circles with sine/cosine offsets for organic movement

## Palm Tree System (2026-02-15)
**Location**: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`
**Details**: See `palm-tree-fixes.md` for complete bug fix history

**Feature**: Swaying palm trees on captured territory to create tropical island aesthetic

**Visual Design**:
- Three tree sizes: small (20px), medium (30px), large (40px)
- Brown trunks (0x8B4513) with tapering effect
- Green palm fronds (0x228B22, 0x32CD32, 0x006400) radiating from top
- Coconuts on medium/large trees (0x654321)
- Swaying animation using sine waves
- Each tree has unique phase offset for organic movement

**Technical Implementation**:
- Graphics object at depth 2.5 (above captured territory, below gameplay)
- Trees only render on CAPTURED cells
- Placement: 1 tree per 7x7 grid area with random offset
- **Incremental updates**: Trees persist at original positions, new ones added only
- Tracks `lastCapturedCells` to detect territory changes
- Sway speed varies by size (larger trees sway slower)
- Sway amount varies by size (larger trees sway less)

**Key Methods**:
- `updatePalmTrees()` - Check for territory changes and trigger update
- `updatePalmTreePositions()` - Incrementally add/remove trees (FIXED: was `generatePalmTreePositions()`)
- `renderPalmTrees()` - Redraw all trees each frame with swaying animation
- `drawPalmTree()` - Draw individual tree with swaying animation

**IMPORTANT FIX (2026-02-15)**: See `bug-fixes.md` for incremental tree update implementation

**Performance**:
- Only regenerates positions when territory changes
- ~240 trees max at 75% capture (5x5 spacing on 80x60 grid)
- Procedural rendering keeps memory footprint low

**Color Palette**:
- Trunk: 0x8B4513 (saddle brown)
- Coconuts: 0x654321 (dark brown)
- Fronds: 0x228B22 (forest green), 0x32CD32 (lime green), 0x006400 (dark green)

### Animated Background Bug Fixes (2026-02-15)

**Bug #1: Waves Invisible Due to Depth Layering (FIXED)**
- **Problem**: Animated waves (depth -1) were hidden behind sea tileSprite (depth 0)
- **Solution**: Removed seaBackground tileSprite entirely, moved waves to depth 0.5 (above void, below captured territory)
- **Files Changed**: Removed seaBackground property and all references

**Bug #2: Particle Emitter API Mismatch - Phaser 3.80 (FIXED)**
- **Problem**: Used old Phaser particle API that doesn't work with Phaser 3.80.1
- **Old (Wrong)**: `this.bubbleParticles = this.add.particles(0, 0, 'bubble', {config});`
- **New (Correct)**:
  ```typescript
  const emitter = this.add.particles(0, 0, 'bubble');
  this.bubbleParticles = emitter.createEmitter({config});
  ```
- **Solution**: Updated both bubble and sparkle particle emitters to use two-step creation pattern
- **Added**: Texture existence checks to prevent runtime errors if textures not loaded

**Bug #3: Memory Leak - Particles Not Destroyed (FIXED)**
- **Problem**: Particle emitters accumulated on each game restart
- **Solution**: Added `shutdown()` method that destroys particle managers and graphics objects
- **Implementation**:
  ```typescript
  shutdown(): void {
    if (this.bubbleParticles) {
      this.bubbleParticles.manager?.destroy();
    }
    if (this.sparkleParticles) {
      this.sparkleParticles.manager?.destroy();
    }
    this.waveGraphics?.destroy();
    this.causticsGraphics?.destroy();
  }
  ```

**Bug #4: Excessive Performance Cost (FIXED)**
- **Problem**: 3,240 trig operations + 600 fills per frame at 40px grid spacing
- **Solution**: Increased caustic grid spacing from 40px to 80px (reduces to ~810 trig ops + 150 fills)
- **Result**: 75% reduction in caustic rendering cost

**Bug #5: Caustics Lack Smoothness (FIXED)**
- **Problem**: All grid cells moved in lockstep, creating unnatural patterns
- **Solution**: Added per-cell phase offset based on position: `phaseOffset = (x * 0.1 + y * 0.1)`
- **Implementation**: Apply phase offset to all sine/cosine calculations for organic, non-uniform movement

**Key Insights**:
- Phaser 3.80+ requires two-step particle emitter creation (manager, then emitter)
- Always provide `shutdown()` method for scenes with particles/graphics to prevent memory leaks
- Performance optimization: prefer larger grid spacing over complex calculations
- Depth layering: positive depths (above void) are visible, negative depths (below void) may be hidden
- Optional properties: Use `?` for particle emitters that may fail to create

## Trail Rendering Details
- Trail width: 3px main line
- Glow: +4px at 30% opacity (golden color 0xFFD700)
- Trail connects grid cell centers
- Must connect to mouse visual position for continuity

### Collision Detection Fix (2026-02-15)
**Problem**: Cats could pass through the visible interpolated trail segment without collision
**Root Cause**: Collision detection only checked discrete grid points in trail array, but visual trail extends from last grid point to mouse's interpolated visual position
**Solution**: Added collision check for the interpolated segment using point-to-line-segment distance calculation
1. Added `pointToSegmentDistance()` helper method for geometric calculation
2. Check collision with segment from last trail point to mouse visual position
3. Use same collision radius (catRadius + trailRadius = 1.5px)

**Files Changed**:
- `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts` - Added interpolated segment collision check in `checkCollisions()`
- `/Users/rohit/workspace/Pounce/src/entities/Mouse.ts` - Added null safety to `getVisualPosition()`

**Key Insight**: Visual rendering and collision detection must always match - if something is visible, it must have collision detection

## Power-Up System Implementation (2026-02-15)

### Overview
- Two power-up types: Freeze and Slow
- Power-ups spawn in VOID areas, 2-3 at a time
- 5-second effect duration for both types
- Collection activates effect on all cats immediately

### Power-Up Types
**Freeze Power-Up:**
- Ice blue snowflake visual (0x3498DB)
- Stops all cat movement completely
- Shows ice crystals overlay on affected cats
- Speed multiplier: 0

**Slow Power-Up:**
- Gray anchor/chain visual (0x7F8C8D)
- Reduces cat speed to 50%
- Shows chain links overlay on affected cats
- Speed multiplier: 0.5

### Architecture Details
- `PowerUp` class extends `Phaser.GameObjects.Container`
- Uses Graphics API to draw themed icons (snowflake, anchor)
- Particle effects using Phaser particles system
- Pulsing glow animation using tweens

### Cat State System
- Enum: `CatState` (NORMAL, FROZEN, SLOWED)
- Private field: `catState` (renamed from `state` to avoid Phaser.Sprite conflict)
- Methods: `setCatState()`, `getCatState()` (renamed to avoid conflicts)
- State overlay graphics drawn in `updateStateOverlay()`
- Frozen cats skip movement in `preUpdate()`

### GameScene Integration
- Spawn timer: 10 seconds between spawn attempts
- Max active: 3 power-ups on field
- Spawn conditions: VOID area, not near mouse (5+ cells)
- Collection: Distance check from mouse position
- Effect timer: Countdown in `updatePowerUpSystem()`
- UI: Power-up indicator with countdown timer

### Configuration
```typescript
GameConfig.initialCats = 7;  // Increased from 2
GameConfig.powerUps = {
  maxActive: 3,
  spawnInterval: 10000,
  effectDuration: 5000,
  freezeSpeedMultiplier: 0,
  slowSpeedMultiplier: 0.5
};
```

### Common Pitfalls
- **Naming conflicts**: Phaser.Sprite has `state` property - use `catState` instead
- **Property conflicts**: Phaser.Sprite has `setState()` - use `setCatState()` instead
- **Variable initialization**: TypeScript requires definite assignment - initialize x/y in loops
- **Scene references**: Use `this.scene` not `scene` parameter after constructor
- **Graphics cleanup**: Always call `graphics.destroy()` after `generateTexture()`
- **Depth ordering**: Negative depths go behind, positive go in front, order matters

### Power-Up System Bug Fixes (2026-02-15)

**Bug #1: Particle Texture Safety**
- Added texture existence check before creating particles
- Made `particles` property optional in PowerUp class
- Prevents runtime error if texture not loaded

**Bug #2-4: Cat State Management**
- Added `savedVelocityX` and `savedVelocityY` fields to preserve direction
- When freezing: save velocity, then disable physics body (`body.enable = false`)
- When slowing: re-enable physics if frozen, apply saved direction with multiplier
- When restoring normal: re-enable physics, restore saved direction at full speed
- Generate random direction only if no saved velocity exists

**Bug #5: Power-Up Collection Radius**
- Reduced from `cellSize * 2.0` to `cellSize * 1.0` to match visual size
- Added `break` after first collection to prevent multiple pickups per frame

**Bug #6: Power-Up Collision Only Works at Center (FIXED 2026-02-15)**
- **Problem**: Collection only worked when mouse center touched power-up center
- **First Attempt**: Used `RectangleToRectangle()` with `powerUp.getBounds()`
- **CRITICAL BUG**: PowerUp extends `Container`, NOT `Sprite` - getBounds() doesn't work!
- **Final Solution**: Use distance-based collision with forgiving radius
  ```typescript
  const mouseRadius = this.mouse.displayWidth / 2;
  const powerUpRadius = GameConfig.cellSize; // 10px (half of 20px visual)
  const collectionRadius = mouseRadius + powerUpRadius + 5; // +5px buffer
  const distance = Phaser.Math.Distance.Between(
    this.mouse.x, this.mouse.y, powerUp.x, powerUp.y
  );
  if (distance < collectionRadius) { /* collect */ }
  ```
- **Files Changed**: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts` - `checkPowerUpCollection()`

**Key Insights**:
- Physics body must be disabled when frozen (velocity=0 not enough)
- Always save velocity before modifying it for state changes
- Transitioning between states requires re-enabling physics body
- Division by zero occurs when restoring from frozen state with zero velocity
- **Container vs Sprite**: `Container.getBounds()` doesn't work for Graphics children - use distance checks
- **Mouse is a Sprite**: Access `this.mouse.x`, `this.mouse.y`, `this.mouse.displayWidth` directly

## Phaser 3.80+ Particle System API
**CRITICAL**: Phaser 3.80+ changed the particle emitter API

**OLD API (Pre-3.80) - DO NOT USE**:
```typescript
this.particles = this.add.particles(x, y, 'texture', {config});
```

**NEW API (3.80+) - ALWAYS USE**:
```typescript
const manager = this.add.particles(x, y, 'texture');
this.emitter = manager.createEmitter({config});
```

**Best Practices**:
1. Check texture exists before creating particles: `if (this.textures.exists('texture'))`
2. Make emitter properties optional: `private emitter?: Phaser.GameObjects.Particles.ParticleEmitter`
3. Always destroy particle managers in shutdown: `emitter.manager?.destroy()`
4. Use optional chaining when accessing emitters: `this.emitter?.stop()`
