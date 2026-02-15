# Pounce Game - Full Stack Developer Memory

## Project Overview
- Game built with Phaser 3, TypeScript, and Vite
- Grid-based territory capture game with pirate theme
- Player controls a mouse that captures territory by creating loops
- Cats chase the player and can destroy trails

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
- Grid manager: `/Users/rohit/workspace/Pounce/src/utils/GridManager.ts`
- Config: `/Users/rohit/workspace/Pounce/src/config/GameConfig.ts`

## Rendering Layers
- Depth 0: Sea background (tiled sprite)
- Depth 1: Island overlay (tiled sprite with alpha)
- Depth 2: Grid graphics (captured territory, trail)
- Depth 5: Cats
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
