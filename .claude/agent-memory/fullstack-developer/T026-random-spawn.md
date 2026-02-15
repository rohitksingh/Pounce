# T026 - Random Spawn in Captured Territory

**Date**: 2026-02-15
**Status**: Implemented

## Overview
Player now spawns at random locations in captured territory instead of fixed center position:
- **Game Start**: Random spawn in captured territory
- **After Death**: Random respawn in captured territory

## Implementation

### 1. GridManager - Random Cell Selection
**File**: `/Users/rohit/workspace/Pounce/src/utils/GridManager.ts`

**New Method**: `getRandomCapturedCell()`
- Scans all CAPTURED cells (excluding 2-cell border margin for safety)
- Returns random captured cell coordinates `{x, y}`
- Fallback to center if no captured cells available
- Logs spawn selection for debugging

**Algorithm**:
```typescript
1. Collect all CAPTURED cells (y: 2 to rows-2, x: 2 to cols-2)
2. If no cells available → return center as fallback
3. Select random index from captured cells array
4. Return cell coordinates
```

### 2. Mouse - Initial Random Spawn
**File**: `/Users/rohit/workspace/Pounce/src/entities/Mouse.ts`

**Constructor Changes**:
- Calls `gridManager.getRandomCapturedCell()` for spawn position
- Sets `gridX`, `gridY`, `visualX`, `visualY` to spawn coordinates
- Updates sprite position to match spawn location
- Fallback to center if no captured cells available

**Before**: Always spawned at `(40, 30)` center
**After**: Spawns at random captured cell each game

### 3. Mouse - Respawn Method
**File**: `/Users/rohit/workspace/Pounce/src/entities/Mouse.ts`

**New Method**: `respawn()`
- Gets random captured cell from GridManager
- Updates grid position (`gridX`, `gridY`)
- Updates visual position (instant, no interpolation)
- Updates sprite position
- Clears trail and drawing state
- Resets movement direction to NONE (stopped)

**Called When**: Player loses a life but still has lives remaining

### 4. GameScene - Death Handling
**File**: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`

**Updated**: `handleMouseHit()`
```typescript
private handleMouseHit(): void {
  this.lives--;
  this.mouse.resetTrail();
  this.mouse.resetSpeed();

  if (this.lives <= 0) {
    // Game over
    this.gameOver = true;
    this.showGameOver();
  } else {
    // Respawn at random captured location
    this.mouse.respawn();
  }
}
```

## Behavior Changes

### Game Start
**Before**: Player always spawned at center (40, 30)
**After**: Player spawns at different random captured location each time

**Benefits**:
- More variety in gameplay
- Each game feels different
- Still safe (always on captured territory)

### After Death
**Before**: No respawn logic (player just died in place)
**After**: Player teleports to random captured location

**Benefits**:
- Gives player fresh strategic position
- No fixed spawn camping by cats
- Random position adds unpredictability

## Edge Cases Handled

### 1. No Captured Territory
**Scenario**: Very early in game (shouldn't happen due to initial border + center island)
**Solution**: Fallback to center position `(cols/2, rows/2)`
**Implementation**: Check if `getRandomCapturedCell()` returns null

### 2. Spawn Safety
**Implementation**: Excludes 2-cell border margin (x: 2 to cols-2, y: 2 to rows-2)
**Reason**: Ensures spawn is well within captured territory, not on edge

### 3. Spawn on Palm Tree
**Scenario**: Random captured cell might have palm tree overlay
**Impact**: Acceptable - player is still on captured territory
**Visual**: Player appears on top of palm tree (depth layering handles this)

### 4. Spawn Near Cats
**Scenario**: Random spawn might be near a cat
**Current**: No protection - player can spawn near cats
**Future Enhancement**: Could add invulnerability period or distance check

## Testing Checklist

- [x] TypeScript compilation successful
- [ ] Random spawn at game start (different positions each time)
- [ ] Spawn is always on CAPTURED cell (not VOID)
- [ ] Respawn after death in captured territory
- [ ] No spawns in VOID (instant death)
- [ ] Fallback works when minimal captured territory
- [ ] Player direction resets to stopped after respawn
- [ ] Trail clears properly after respawn

## Technical Details

**Safety Margin**: 2 cells from border
- Prevents spawn on edge cells
- Ensures player has safe movement space

**Visual Position**: Instant teleport
- No interpolation on spawn/respawn
- `visualX` and `visualY` set directly to grid position
- Prevents visual "sliding" effect on spawn

**Direction Reset**: Sets to `Direction.NONE`
- Player stops moving on respawn
- Must press direction key to start moving again
- Prevents unwanted movement after respawn

## Files Modified

1. `/Users/rohit/workspace/Pounce/src/utils/GridManager.ts` - Added `getRandomCapturedCell()`
2. `/Users/rohit/workspace/Pounce/src/entities/Mouse.ts` - Updated constructor, added `respawn()`
3. `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts` - Updated `handleMouseHit()`

## Console Logging

**GridManager**:
- `[GridManager] Random spawn selected: (x, y) from N captured cells`
- `[GridManager] No captured cells available for spawn, using center` (edge case)

**Mouse**:
- `[Mouse] Respawning at (x, y)`
- `[Mouse] No captured cells available for respawn` (error case)

**GameScene**:
- `[GameScene] Player respawned. Lives remaining: N`

## Related Tasks

- **T022**: Center island spawn (7x7 starting area) - now replaced with random spawn
- **T025**: Cat spawning avoids center island - still relevant, prevents cats spawning on player

## Future Enhancements

1. **Spawn Invulnerability**: Brief invulnerability period after spawn/respawn
2. **Distance Check**: Ensure spawn is minimum distance from cats
3. **Spawn Animation**: Visual effect when player teleports
4. **Spawn Sound**: Audio feedback for respawn
