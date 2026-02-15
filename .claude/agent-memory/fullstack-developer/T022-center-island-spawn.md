# T022: Center Island Spawn Implementation

## Date: 2026-02-15

## Summary
Implemented center island spawn system where the player starts on a 7x7 captured territory island in the middle of the map instead of at the border.

## User Requirements
- Player spawns at center of map instead of border
- Starting island should be bigger than player sprite
- Island should provide a safe zone to begin the game

## Implementation Details

### 1. GridManager Updates
**File**: `/Users/rohit/workspace/Pounce/src/utils/GridManager.ts`

Added `initializeCenterIsland()` method:
- Creates a 7x7 captured territory island (radius = 3 cells)
- Center position: (40, 30) for 80x60 grid
- Island size: 70x70 pixels, larger than player sprite
- Called automatically during grid initialization

**Logic**:
```typescript
private initializeCenterIsland(): void {
  const centerX = Math.floor(this.cols / 2); // ~40 for 80 cols
  const centerY = Math.floor(this.rows / 2); // ~30 for 60 rows
  const islandRadius = 3; // Creates 7x7 island

  for (let dx = -islandRadius; dx <= islandRadius; dx++) {
    for (let dy = -islandRadius; dy <= islandRadius; dy++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
        this.grid[y][x] = CellState.CAPTURED;
      }
    }
  }
}
```

### 2. Mouse Spawn Position Update
**File**: `/Users/rohit/workspace/Pounce/src/entities/Mouse.ts`

Changed spawn coordinates from (1, 1) to center:
```typescript
// Old: Corner spawn
this.gridX = 1;
this.gridY = 1;

// New: Center spawn
this.gridX = Math.floor(GameConfig.gridCols / 2); // 40
this.gridY = Math.floor(GameConfig.gridRows / 2); // 30
```

## Visual Result

**Before**:
- Player spawned at top-left corner (1, 1)
- Only border was captured territory
- Player immediately entered void

**After**:
- Player spawns at center (40, 30)
- 7x7 wooden deck island visible at center
- Player can move around safely on island before venturing into ocean
- Island decorated with palm trees (existing system)

## Gameplay Impact

1. **Initial Territory**: Slightly increased from ~4.5% (border only) to ~5.5% (border + island)
2. **Safe Spawn**: Player has room to orient themselves before entering the void
3. **Strategic Start**: Center position provides equal access to all map areas
4. **Visual Appeal**: Island creates immediate focal point in middle of ocean

## Testing Checklist

- [x] Player spawns at center of map
- [x] 7x7 island renders correctly with wooden deck texture
- [x] Player can move in all directions on island
- [x] Player can leave island and enter void
- [x] Trail system works correctly when leaving island
- [x] Loop completion works when returning to island
- [x] Palm trees render on starting island
- [x] Cats spawn in void areas (not on center island)

## Related Files

- `/Users/rohit/workspace/Pounce/src/utils/GridManager.ts` - Island initialization
- `/Users/rohit/workspace/Pounce/src/entities/Mouse.ts` - Spawn position
- `/Users/rohit/workspace/Pounce/src/config/GameConfig.ts` - Grid dimensions

## Notes

- Island size (radius=3) chosen to be clearly visible but not too large
- Player sprite is ~2-3 cells when scaled, so 7x7 island provides comfortable room
- Center calculation uses `Math.floor()` to handle odd grid dimensions
- Existing palm tree system automatically decorates the starting island
