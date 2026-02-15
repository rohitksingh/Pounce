# UI Bug Testing Memory - Pounce Game

## Project Structure
- Main game file: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`
- HTML entry: `/Users/rohit/workspace/Pounce/index.html`
- Config: `/Users/rohit/workspace/Pounce/src/config/GameConfig.ts`
- Tech stack: Phaser 3 game engine, TypeScript, Vite

## Common Issues & Patterns

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

## Testing Checklist for UI Changes
- [ ] Verify visual rendering matches collision detection
- [ ] Check performance with maximum expected trail length
- [ ] Test UI updates with missing DOM elements
- [ ] Verify pirate theme color consistency
- [ ] Test responsive behavior (canvas is 800x600 fixed)
- [ ] Check accessibility (keyboard navigation, screen readers)
