# UI Bug Testing Memory - Pounce Game

## Project Structure
- Main game file: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`
- Entities: `/Users/rohit/workspace/Pounce/src/entities/` (Mouse.ts, Cat.ts, PowerUp.ts)
- HTML entry: `/Users/rohit/workspace/Pounce/index.html`
- Config: `/Users/rohit/workspace/Pounce/src/config/GameConfig.ts`
- Tech stack: Phaser 3 game engine, TypeScript, Vite

## Common Issues & Patterns

### Phaser Container vs Sprite getBounds() Gotcha
- **CRITICAL**: `Phaser.GameObjects.Container` does NOT have reliable `getBounds()` for collision
- **Pattern**: PowerUp extends Container (PowerUp.ts line 9), NOT Sprite
- **Issue**: Container.getBounds() with Graphics children may fail or return incorrect bounds
- **Fix Options**: Calculate bounds manually, use distance-based collision, or refactor to Sprite
- **Location**: PowerUp.ts line 9, GameScene.ts checkPowerUpCollection()
- **Watch for**: Any collision detection using `getBounds()` on Container objects

### Collision Detection Mismatches
- **Pattern**: Visual trail width (3px) doesn't match collision detection radius (cellSize * 0.4 ≈ 4px)
- **Location**: GameScene.ts lines 175-186 (collision) vs 261-304 (rendering)
- **Impact**: Cats may hit "invisible" trail or pass through visible trail
- **Watch for**: Any time visual elements change, verify collision detection matches

### Performance Patterns
- **Pattern**: Trail re-rendered completely every frame in update loop
- **Location**: GameScene.ts line 255 called from line 143
- **Impact**: Performance degrades with trail length (double iteration for glow + main line)
- **Best practice**: Consider caching or limiting render iterations for long trails

### Animated Background Performance
- **Critical Pattern**: Procedural backgrounds with trig calculations in update loops cause severe FPS drops
- **Location**: GameScene.ts lines 625-718 (wave + caustics rendering)
- **Measured Impact**: 3,240 trig operations + 600 fillCircle calls per frame at 60fps
- **Fix**: Always use RenderTexture caching for animated backgrounds, or use shader-based effects
- **Watch for**: Any `graphics.clear()` + redraw in update() loop

### Depth Layering Gotcha
- **Pattern**: Phaser renders by depth value, NOT alpha transparency order
- **Issue**: Semi-transparent sprites at higher depth completely obscure lower depth sprites
- **Example**: Sea tileSprite (depth 0, alpha 0.7) blocks waves (depth -1)
- **Fix**: Ensure visual layers match depth hierarchy, or remove redundant layers

### Memory Leak Pattern - Particle Emitters
- **Pattern**: Particle emitters not destroyed on scene restart cause memory accumulation
- **Location**: Any scene with `this.add.particles()`
- **Fix**: Always add `shutdown()` method to destroy emitters
- **Detection**: Monitor memory usage after 10+ game restarts

### UI Update Pattern
- **Pattern**: DOM UI updated via direct element reference in Phaser scene
- **Location**: GameScene.ts lines 66, 147-152
- **Implementation**: Get `#ui-container` in `create()`, update in `updateUI()`
- **Note**: Null check present but no error logging

## Pirate Theme Standards
- Background: #1A252F (dark blue)
- Gold/treasure: #FFD700, 0xF1C40F
- Sea: 0x1E3A5F
- Deck/wood: 0xD4A574
- Trail: Golden with glow effect (3px line + 4px glow at 30% opacity)
- Wave layers: 0x0A2540 (deep), 0x1E3A5F (medium), 0x2E5A7F (light)

## Testing Checklist for Animated Backgrounds
- [ ] Verify depth layering allows background visibility through gameplay
- [ ] Check performance: 60fps with all game elements active
- [ ] Test particle emitter cleanup on scene restart (memory leak check)
- [ ] Verify procedural textures created before referenced by emitters
- [ ] Test animation continuity without jumps or stutters
- [ ] Check caustics don't create visual artifacts on overlap
- [ ] Verify background visible in VOID areas, not obstructing captured territory
- [ ] Test with freeze/slow power-ups active

## Known Phaser API Changes
- **Particle System**: API changed in Phaser 3.60+
  - Old: `this.add.particles(x, y, texture, config)`
  - New: `this.add.particles(x, y, texture).createEmitter(config)`
- Always check Phaser version before testing particle effects

## Performance Budget Guidelines
- Max trig operations per frame: ~500 (sine, cos, tan combined)
- Max fill operations per frame: ~200
- Target: 60fps on mid-range devices
- If exceeding budget: Use RenderTexture caching or WebGL shaders
