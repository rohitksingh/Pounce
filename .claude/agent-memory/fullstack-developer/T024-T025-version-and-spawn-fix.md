# T024 & T025: Version Display and Cat Spawn Fix

**Date**: 2026-02-15
**Tasks**: T024 (Version Display), T025 (Cat Spawn Fix)

## Overview

Two user-requested improvements:
1. Display version number in bottom right corner
2. Prevent cats from spawning on center island

## T024: Version Display

### User Request
"I want version number on the bottom right of the page"

### Implementation

**File**: `/Users/rohit/workspace/Pounce/index.html`

Added static HTML element with CSS styling:

```html
<div id="version-display">v1.0.0</div>
```

CSS styling:
```css
#version-display {
  position: fixed;
  bottom: 10px;
  right: 10px;
  color: #FFD700;           /* Gold - matches game theme */
  font-family: 'Courier New', monospace;
  font-size: 12px;
  opacity: 0.7;             /* Subtle appearance */
  pointer-events: none;     /* Doesn't block clicks */
  z-index: 1000;            /* Above all game elements */
}
```

### Design Decisions

1. **Static HTML approach**: Simple, no build complexity
2. **Manual updates**: Version must be updated in HTML when creating releases
3. **Visual style**: Gold color matches pirate theme, low opacity for subtlety
4. **Positioning**: Fixed bottom-right, doesn't interfere with gameplay

### Future Enhancement Option

For automatic version sync, could:
1. Import package.json in GameScene
2. Update HTML element dynamically: `versionElement.textContent = 'v' + packageJson.version`
3. Requires build configuration to handle JSON imports

---

## T025: Cat Spawn Fix

### User Request
"Don't spawn opponent on the center island"

### Problem

Cats were spawning randomly across the grid, including on the 7x7 center island where the player starts. This:
- Caused immediate danger on game start
- Reduced initial safe zone
- Could spawn cats in captured territory

### Implementation

**File**: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`

Modified `spawnCats()` method to exclude center island:

```typescript
// Center island parameters (7x7 area from T022)
const centerX = Math.floor(cols / 2); // Grid cell coordinate (40)
const centerY = Math.floor(rows / 2); // Grid cell coordinate (30)
const islandRadius = 3; // Radius in grid cells

// Inside spawn loop:
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
```

### Key Changes

1. **Center island detection**: Check if spawn position is within 3 cells of center (40, 30)
2. **Grid coordinate conversion**: Convert pixel positions to grid cells for accurate checking
3. **Increased attempts**: Changed max attempts from 50 to 100 for better spawning reliability
4. **Fallback positioning**: If no valid position found after 100 attempts, spawn near edges

### Grid Coordinates

- **Grid size**: 80 columns × 60 rows
- **Center position**: (40, 30) in grid coordinates
- **Island radius**: 3 cells (creates 7×7 area)
- **Island bounds**: gridX ∈ [37, 43], gridY ∈ [27, 33]

### Testing Checklist

✓ All 7 cats spawn successfully
✓ No cats spawn on center island (7×7 area)
✓ Cats maintain minimum distance from each other (50px)
✓ Player has safe starting zone
✓ Fallback spawning works if needed

### Performance

- Minimal impact: O(N) position checks per cat
- Fast grid coordinate calculation: `Math.floor(x / cellSize)`
- Runs once during GameScene initialization

---

## Files Modified

1. `/Users/rohit/workspace/Pounce/index.html`
   - Added `#version-display` CSS styling
   - Added version display HTML element

2. `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`
   - Modified `spawnCats()` method
   - Added center island exclusion logic

## Related Documentation

- `T022-center-island-spawn.md` - Original center island implementation
- `T023` - Release versioning system
- `menu-scene-fix.md` - UI management patterns

## Future Considerations

### Version Display
- Consider auto-sync with package.json for releases
- Could add hover tooltip with release date/notes
- Could add build number or commit SHA

### Cat Spawning
- Could add multiple exclusion zones if needed
- Consider difficulty scaling (fewer safe zones at higher levels)
- Could add visual indicators for spawn zones during development
