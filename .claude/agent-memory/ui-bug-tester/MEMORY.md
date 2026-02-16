# UI Bug Testing Memory - Pounce Game

## Project Structure
- Main game file: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`
- Entities: `/Users/rohit/workspace/Pounce/src/entities/` (Mouse.ts, Cat.ts, PowerUp.ts)
- Flood fill logic: `/Users/rohit/workspace/Pounce/src/utils/FloodFill.ts` ✅ VERIFIED (T021)
- Grid manager: `/Users/rohit/workspace/Pounce/src/utils/GridManager.ts`
- HTML entry: `/Users/rohit/workspace/Pounce/index.html`
- Config: `/Users/rohit/workspace/Pounce/src/config/GameConfig.ts`
- Tests:
  - `/Users/rohit/workspace/Pounce/tests/unit/FloodFill.test.ts` (11 tests) ✅
  - `/Users/rohit/workspace/Pounce/tests/unit/GridManager.test.ts` (11 tests) ✅
  - `/Users/rohit/workspace/Pounce/tests/integration/CollisionDetection.test.ts` (4 tests) ✅
- Tech stack: Phaser 3 game engine, TypeScript, Vite, Vitest
- Test status: 26/26 passing

## Common Issues & Patterns

### Bug #14: Null Config Guard Pattern (DISCOVERED 2026-02-15)
- **Severity**: Medium
- **Pattern**: Methods that access nullable config should check for null first
- **Location**: GameScene.ts applyLevelConfig() (lines 133-140)
- **Issue**: UI has fallback for null levelConfig (line 254-256), but applyLevelConfig() doesn't check before accessing properties
- **Error**: If invalid level passed, line 137 `this.levelConfig.catCount` throws runtime error
- **Fix**: Add `if (!this.levelConfig) { console.warn(...); return; }` at start of method
- **Watch for**: Any method that uses `this.levelConfig.propertyName` without null check

### Keyboard Accessibility Limitations in Phaser (VERIFIED 2026-02-15)
- **Pattern**: Phaser text objects don't support CSS :focus pseudo-class
- **Current Implementation**: Enter/Space global shortcuts work from anywhere in scene
- **Missing**: Tab navigation between buttons, visible focus indicators
- **WCAG Compliance**: Partial - shortcuts work (SC 2.1.1 partial pass) but fails SC 2.4.7 (Focus Visible)
- **Locations**: MenuScene, LevelCompleteScene, VictoryScene all have keyboard shortcuts but no focus management
- **Future Enhancement**: Need custom focus management system with visual glow/outline indicators

### Error Handling Best Practice (VERIFIED 2026-02-15) ✅
- **Pattern**: All scene transitions now wrapped in try-catch blocks
- **Implementation**: Console.error logs with [SceneName] prefix + fallback scene on failure
- **Example**: GameScene → LevelCompleteScene fails → fallback to MenuScene (GameScene.ts lines 204-214)
- **Coverage**: BootScene ✅, MenuScene ✅, GameScene ✅, LevelCompleteScene ✅, VictoryScene ✅
- **Quality**: Comprehensive error handling prevents crash loops

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

## UI-Specific Bug Patterns (Added 2026-02-15)

### 1. DOM Element Access Without Error Handling
**Location**: All scenes that access DOM
**Pattern**: `document.getElementById()` with null check but no error logging
**Issue**: Silent failures when elements missing
**Fix**: Add `console.error()` when critical elements are null
**Found in**: GameScene.ts, MenuScene.ts, LevelCompleteScene.ts, VictoryScene.ts

### 2. Hardcoded Canvas Dimensions
**Location**: LevelCompleteScene.ts (line 15), VictoryScene.ts (line 13)
**Pattern**: `this.add.rectangle(400, 300, 800, 600, ...)` - hardcoded center and size
**Issue**: Not responsive, breaks on different screen sizes
**Fix**: Use `this.cameras.main.width/height` or `GameConfig.width/height`

### 3. Inconsistent Scene Export Styles
**Location**: main.ts, scene files
**Pattern**: Mix of named exports (`export class`) and default exports (`export default class`)
**Issue**: Can cause bundler issues, inconsistent imports
**Found**: LevelCompleteScene and VictoryScene use default exports, others use named
**Fix**: Standardize to named exports throughout

### 4. Missing Keyboard Accessibility
**Location**: All interactive buttons in scenes
**Pattern**: Only `pointerover`/`pointerdown` events, no keyboard handlers
**Issue**: Fails WCAG 2.1 SC 2.1.1 (Keyboard) and SC 2.4.7 (Focus Visible)
**Fix**: Add keyboard event listeners and focus indicators

### 5. No Loading State UI
**Location**: BootScene.ts
**Pattern**: Asset loading happens silently with only console logs
**Issue**: Black screen during load - users think game is frozen
**Fix**: Add loading bar/spinner in BootScene

### 6. Inconsistent Color Usage
**Location**: MenuScene.ts (lines 27, 35, 42, 66)
**Pattern**: Hardcoded colors not in GameConfig (#3498db, #ecf0f1, #2ecc71, #e74c3c)
**Issue**: Visual inconsistency with pirate theme
**Fix**: Reference GameConfig.colors for all UI elements

## UI Element IDs in HTML
- `#app-wrapper` - Main container (flex column, centered)
- `#level-indicator` - Shows "Level X: Name" (display: none by default)
- `#ui-container` - Shows territory %, lives, pirates, speed (display: none by default)
- `#powerup-container` - Shows active power-up with timer (display: none by default)
- `#game-container` - Phaser canvas parent
- `#version-display` - Shows version in bottom-right (fixed position)

## Scene Structure
**Files**:
- `/Users/rohit/workspace/Pounce/src/scenes/BootScene.ts` (asset loading)
- `/Users/rohit/workspace/Pounce/src/scenes/MenuScene.ts` (main menu)
- `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts` (gameplay)
- `/Users/rohit/workspace/Pounce/src/scenes/LevelCompleteScene.ts` (level transition)
- `/Users/rohit/workspace/Pounce/src/scenes/VictoryScene.ts` (game complete)

**Scene Flow**:
1. BootScene (preload assets) → MenuScene
2. MenuScene → GameScene (level 1-3)
3. GameScene → LevelCompleteScene (levels 1-2) → GameScene (next level)
4. GameScene → VictoryScene (after level 3) → MenuScene
5. GameScene (death, lives=0) → MenuScene (with retry option)

## Accessibility Test Results

**Passed**:
- Color contrast ratios (all text meets WCAG AA)
  - Gold (#FFD700) on dark blue (#1A252F): 7.2:1 (Pass)
  - White (#FFFFFF) on black (#000000): 21:1 (Pass)
  - Green (#2ecc71) on black: 8.4:1 (Pass)

**Failed**:
- Keyboard navigation (no Tab key support on buttons)
- Focus indicators (no visible focus states)
- Screen reader support (canvas game limitation - acceptable)

**WCAG Violations**:
- SC 2.1.1 (Keyboard - Level A): Buttons not keyboard accessible
- SC 2.4.7 (Focus Visible - Level AA): No focus indicators on interactive elements

## UI Testing Checklist (Last Updated: 2026-02-15)
- [x] Test all button interactions (click, hover, keyboard) - PASSED
- [x] Verify DOM elements exist before accessing (check console for errors) - PASSED (all scenes have error logging)
- [x] Check color contrast ratios (WCAG AA: 4.5:1 text, 3:1 UI) - PASSED
- [x] Test keyboard navigation (Tab, Enter, Space, Escape) - PARTIAL (Enter/Space work, no Tab nav, no focus indicators)
- [x] Verify responsive behavior at different viewport sizes - PASSED (camera-based calculations + responsive CSS)
- [x] Check scene transitions don't crash - PASSED (try-catch on all transitions)
- [x] Verify loading states show during async operations - PASSED (BootScene has progress bar)
- [ ] Test with browser DevTools console for errors - PENDING LIVE TEST
- [x] Verify version display positioning on different screen sizes - PASSED (responsive @media query)
- [ ] Check power-up UI appears/disappears correctly - PENDING LIVE TEST
- [ ] Test level indicator updates on level transitions - PENDING LIVE TEST

## Recent Bug Verification (2026-02-15)
**Verification Report**: `/Users/rohit/workspace/Pounce/UI_BUG_VERIFICATION_REPORT.md`
- **11/13 bugs fully fixed**: Export consistency, error handling, hardcoded dimensions, DOM logging, loading screen, color standardization, overlay transparency, version positioning, duplicate styles, emojis, title sizing
- **2/13 partially fixed**: Null levelConfig (UI fallback works, method needs guard), keyboard accessibility (shortcuts work, focus indicators missing)
- **1 new bug found**: Bug #14 - Missing null guard in applyLevelConfig() (medium severity)

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

## QIX/Volfied Flood Fill Algorithm (DEFINITIVE FIX - T021) ✅
- **Core Mechanic**: Capture ENCLOSED area when loop completes, NOT outer area
- **Algorithm Type**: Topological detection using adjacency to OLD captured territory
- **Implementation**: `isAdjacentToOldTerritory()` method (lines 110-144)
- **Key Innovation**: Distinguish OLD territory (border + previous captures) from NEW trail
  - Creates Set from trail for O(1) lookup performance
  - Checks if VOID regions are adjacent to CAPTURED cells NOT in trail
  - Outer ocean = LARGEST region adjacent to old territory
  - Enclosed regions = NOT adjacent to old territory (surrounded by new trail)
- **Why This Works**:
  - Outer ocean ALWAYS connects to where player started (old territory)
  - Enclosed regions NEVER connect to old territory (surrounded by new trail)
  - Works at ALL territory percentages (0% to 95%)
  - No size heuristics needed - pure topological detection
- **Critical Bug Fixed**: 50% territory bug where small outer ocean was incorrectly filled
- **Test Coverage**: 11/11 tests passing, all critical scenarios verified
- **Performance**: O(n) time, O(n) space, no heuristics
- **Location**: `/Users/rohit/workspace/Pounce/src/utils/FloodFill.ts`
- **Detailed Documentation**: See `flood-fill-testing.md` in agent memory

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
