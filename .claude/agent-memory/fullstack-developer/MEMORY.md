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
- Depth 0: Sea background (tiled sprite)
- Depth 1: Island overlay (tiled sprite with alpha)
- Depth 2: Grid graphics (captured territory, trail)
- Depth 3: Power-ups
- Depth 5: Cats
- Depth 6: Cat state overlays (freeze/slow visual effects)
- Depth 10: Mouse sprite

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

**Key Insights**:
- Physics body must be disabled when frozen (velocity=0 not enough)
- Always save velocity before modifying it for state changes
- Transitioning between states requires re-enabling physics body
- Division by zero occurs when restoring from frozen state with zero velocity
