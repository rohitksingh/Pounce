# Bug Fixes Log

## Palm Tree Rearrangement Fix (2026-02-15)

**Problem**: Palm trees regenerated and jumped to new random positions whenever territory was captured.

**Root Cause**: `updatePalmTrees()` called `generatePalmTreePositions()` which cleared all trees and regenerated from scratch whenever `capturedCount` changed.

**Solution**: Implemented incremental tree management in new `updatePalmTreePositions()` method:
1. **Filter Phase**: Keep existing trees that are still on captured territory
2. **Spatial Grid**: Track which 7x7 grid areas already have trees to prevent duplicates
3. **Addition Phase**: Only add NEW trees in areas that don't have them yet
4. **Removal Phase**: Trees automatically filtered out when territory is lost

**Files Changed**: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`
- Renamed `generatePalmTreePositions()` to `updatePalmTreePositions()`
- Added spatial grid tracking with Set<string> for area occupancy
- Removed regeneration logic from `renderPalmTrees()`
- Trees now persist in their original positions as territory expands

**Result**: Trees stay planted in their original locations, new trees only appear in newly captured areas.

---

## Power-Up Collision Detection Fix (2026-02-15)

**Problem**: Power-ups only activated when mouse sprite CENTER touched power-up center, not when sprites visually overlapped.

**Root Cause**: `checkPowerUpCollection()` used center-to-center distance check instead of sprite bounds overlap.

**Old Implementation**:
```typescript
const distance = Phaser.Math.Distance.Between(mouseX, mouseY, powerUp.x, powerUp.y);
if (distance < collectionRadius) { /* collect */ }
```

**New Implementation**:
```typescript
const mouseBounds = this.mouse.getBounds();
const powerUpBounds = powerUp.getBounds();
if (Phaser.Geom.Intersects.RectangleToRectangle(mouseBounds, powerUpBounds)) {
  /* collect */
}
```

**Files Changed**: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`
- Replaced distance-based collision with rectangle-to-rectangle intersection
- Uses Phaser's `getBounds()` for accurate sprite bounds
- Uses `Phaser.Geom.Intersects.RectangleToRectangle()` for overlap detection

**Result**: Power-ups activate when ANY part of mouse sprite touches ANY part of power-up sprite, making collection feel more responsive and forgiving.

---

## Key Insights

### Incremental Updates vs Full Regeneration
- For persistent visual elements (trees, decorations), always prefer incremental updates
- Use spatial data structures (Set, Map) to track what already exists
- Filter existing items, then add new ones - never clear and regenerate

### Collision Detection Best Practices
- Distance checks: Good for circular hitboxes or approximate detection
- Bounds overlap: Better for rectangular sprites with visual accuracy
- Use `getBounds()` for actual rendered sprite dimensions
- `Phaser.Geom.Intersects.RectangleToRectangle()` is built-in and efficient

### Mouse Sprite Bounds
- Mouse sprite: 542x474 original, scaled 0.05x = ~27x24 pixels
- Power-up size: 2 * cellSize = ~20px diameter
- Bounds-based collision accounts for full sprite dimensions
