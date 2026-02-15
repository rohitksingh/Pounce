# T020: Flood Fill 50% Territory Bug Fix

**Date**: 2026-02-15
**Status**: FIXED
**Severity**: CRITICAL - Game Breaking

## Bug Report

User reported: "The game is stopping whenever the area captured is more than 50.0%. The moment it goes above 50% the game is stopping."

## Root Cause Analysis

### The Problematic Code (Line 30 in FloodFill.ts)

```typescript
// BUGGY LOGIC - DO NOT USE
if (!hasCats || region.length < (cols * rows) / 2) {
  // Fill region
}
```

### Why This Failed at 50%

The condition `region.length < (cols * rows) / 2` means "fill region if it's smaller than 50% of the grid."

**Scenario at 50%+ captured territory:**

1. Player captures 55% of territory
2. Remaining VOID area = 45% of grid
3. Player completes a loop enclosing a small 5% area
4. Flood fill finds TWO regions:
   - **Enclosed region** (5% - the area inside the loop) ✓ Should be filled
   - **Outer ocean** (45% - the remaining VOID area) ✗ Should NOT be filled

5. **THE BUG**: Since 45% < 50%, the condition evaluates TRUE for the outer ocean
6. Algorithm tries to FILL THE ENTIRE OCEAN
7. Game freezes or behaves unexpectedly

### The Fundamental Flaw

The size-based logic (`region.length < (cols * rows) / 2`) assumes:
- The enclosed region is always smaller than the outer region
- This works ONLY when captured territory < 50%
- This FAILS when captured territory >= 50%

**The real question is NOT "which region is smaller?"**
**The real question is "which region is ENCLOSED inside the loop?"**

## Solution

Replace size-based logic with **border detection**:

```typescript
// CORRECT LOGIC
if (isEnclosed || !hasCats) {
  // Fill region
}
```

### The `isRegionEnclosed()` Method

```typescript
private static isRegionEnclosed(region: { x: number; y: number }[], cols: number, rows: number): boolean {
  // A region is enclosed if it does NOT touch any of the map borders
  // Border cells: x=0, y=0, x=cols-1, y=rows-1
  return !region.some(cell =>
    cell.x === 0 || cell.y === 0 || cell.x === cols - 1 || cell.y === rows - 1
  );
}
```

### Why This Works

**Enclosed Region (inside loop):**
- Does NOT touch map borders
- `isEnclosed` returns `true`
- Region gets filled ✓

**Outer Ocean (outside loop):**
- ALWAYS touches map borders (extends to edges)
- `isEnclosed` returns `false`
- Region does NOT get filled ✓

**This logic works at ANY capture percentage** - 10%, 50%, 90%, or 99%.

## Test Cases

### Case 1: Early Game (20% captured)
- Enclosed region: 5% (doesn't touch borders) → Fill ✓
- Outer region: 75% (touches borders) → Don't fill ✓

### Case 2: Mid Game (50% captured)
- Enclosed region: 10% (doesn't touch borders) → Fill ✓
- Outer region: 40% (touches borders) → Don't fill ✓

### Case 3: Late Game (80% captured)
- Enclosed region: 5% (doesn't touch borders) → Fill ✓
- Outer region: 15% (touches borders) → Don't fill ✓

### Case 4: Edge Case (95% captured, near win)
- Enclosed region: 1% (doesn't touch borders) → Fill ✓
- Outer region: 4% (touches borders) → Don't fill ✓

## Files Changed

- `/Users/rohit/workspace/Pounce/src/utils/FloodFill.ts`
  - Modified `fillTerritory()` method (lines 6-47)
  - Added `isRegionEnclosed()` method (lines 112-118)
  - Removed buggy size-based condition
  - Added border detection logic

## Key Insights

1. **Border detection is the ONLY reliable way** to distinguish enclosed vs outer regions
2. **Size-based logic is fundamentally flawed** - it breaks at 50% capture
3. **Geometry matters**: The enclosed region is surrounded by captured territory, outer region touches map edges
4. **This fix also resolves T019** - the "wrong region" bug was the same root cause

## Related Issues

- **T019**: Algorithm captured wrong region (fixed by border detection)
- **T020**: Game stopped at 50% (fixed by removing size check)

Both issues stemmed from the same flawed size-based logic.

## Prevention

**Rule**: When implementing flood fill algorithms in grid-based games:
- NEVER use size-based logic to determine which region to fill
- ALWAYS use geometric properties (border detection, containment, etc.)
- Consider edge cases at extreme percentages (0%, 50%, 100%)
- Test at multiple capture percentages, not just early game scenarios
