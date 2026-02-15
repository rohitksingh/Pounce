# Flood Fill Algorithm Fix - Task T015 (2026-02-15)

## FINAL FIX: Enclosed Area Detection with Border Detection

### Problem

The flood fill algorithm was capturing the WRONG region:

- **Draw small loop in center** → Algorithm captured 90% OUTER area (BACKWARDS!)
- **Expected behavior** → Should capture 10% ENCLOSED area

This is THE fundamental mechanic of QIX/Volfied games - you capture what you ENCLOSE, not what's outside.

### Previous Attempt (Still Wrong)

First attempted fix used "smallest region" logic:
```typescript
// STILL WRONG - captures smallest region regardless of location
if (regionsWithCats.length > 0) {
  regionToFill = regionsWithCats.reduce((smallest, current) =>
    current.length < smallest.length ? current : smallest
  );
}
```

This didn't work because:
- Small loop in center → outer corners are SMALLER than enclosed area
- Algorithm still captured wrong region

### CORRECT Solution: Border Detection

**Key Insight**: In Pounce, the grid has a CAPTURED border perimeter. We can identify enclosed vs outer regions by checking if they touch this border.

- **Outer regions** (between trail and border) have cells at x=1, y=1, x=cols-2, y=rows-2
- **Enclosed regions** (inside the trail) do NOT touch these positions

### Implementation

Added `touchesBorder()` method:
```typescript
/**
 * Check if a region is adjacent to the map borders.
 * Enclosed regions do NOT touch borders, outer regions DO touch borders.
 */
private static touchesBorder(
  region: { x: number; y: number }[],
  cols: number,
  rows: number
): boolean {
  return region.some(cell =>
    cell.x === 1 || cell.x === cols - 2 ||
    cell.y === 1 || cell.y === rows - 2
  );
}
```

Updated `fillTerritory()` logic:
```typescript
// Find regions that DON'T touch borders (these are enclosed)
const enclosedRegions = regions.filter(region =>
  !this.touchesBorder(region, cols, rows)
);

if (enclosedRegions.length > 0) {
  // Fill enclosed region (prefer one with cats, otherwise smallest)
  const enclosedWithCats = enclosedRegions.filter(region =>
    this.regionHasCats(region, cats)
  );

  if (enclosedWithCats.length > 0) {
    regionToFill = enclosedWithCats.reduce((smallest, current) =>
      current.length < smallest.length ? current : smallest
    );
  } else {
    regionToFill = enclosedRegions.reduce((smallest, current) =>
      current.length < smallest.length ? current : smallest
    );
  }
} else {
  // ALL regions touch borders - fall back to smallest
  regionToFill = regions.reduce((smallest, current) =>
    current.length < smallest.length ? current : smallest
  );
}
```

## Test Coverage

Created comprehensive unit tests with COMPLETE closed loops:

### Critical Tests

1. **Small loop (11x11)** - Expected: ~2.5%, Result: 2.52% ✓
2. **Large loop (71x51)** - Expected: ~75%, Result: 75.44% ✓
3. **Border detection** - Enclosed region captured, outer region left as void ✓

### IMPORTANT: Complete Loops Required

❌ **WRONG** (incomplete loop with gaps):
```typescript
const trail = [
  { x: 10, y: 10 }, { x: 20, y: 10 },
  { x: 20, y: 20 }, { x: 10, y: 20 }
];
```

✓ **CORRECT** (complete closed loop):
```typescript
const trail = [
  // Top edge: (10,10) to (20,10)
  ...Array.from({ length: 11 }, (_, i) => ({ x: 10 + i, y: 10 })),
  // Right edge: (20,11) to (20,20)
  ...Array.from({ length: 10 }, (_, i) => ({ x: 20, y: 11 + i })),
  // Bottom edge: (19,20) to (10,20)
  ...Array.from({ length: 10 }, (_, i) => ({ x: 19 - i, y: 20 })),
  // Left edge: (10,19) to (10,11)
  ...Array.from({ length: 9 }, (_, i) => ({ x: 10, y: 19 - i }))
];
```

## Test Results

✅ All 24 tests passing:
- 11 GridManager tests
- 9 FloodFill tests (including 3 critical QIX/Volfied tests)
- 4 CollisionDetection tests

## Files Changed

1. **`/Users/rohit/workspace/Pounce/src/utils/FloodFill.ts`**
   - Added `touchesBorder()` method for border detection
   - Updated `fillTerritory()` to prioritize enclosed regions
   - Added comprehensive QIX/Volfied logic comments

2. **`/Users/rohit/workspace/Pounce/tests/unit/FloodFill.test.ts`**
   - Fixed all test cases to use complete closed loops
   - Added critical enclosed area detection tests
   - Added cell-specific assertions to verify correct behavior

## Why Border Detection Works

The Pounce grid structure:
```
[CAPTURED BORDER]
[VOID VOID VOID VOID]
[VOID ... VOID]
[CAPTURED BORDER]
```

When a trail creates a loop:
- **Enclosed region**: Surrounded by trail, doesn't reach border
- **Outer region**: Between trail and border, touches border at x=1 or y=1

This spatial relationship is ALWAYS true, making border detection the correct solution.

## Performance

- O(n) border check per region
- Typically 1-2 regions per loop
- No performance impact on gameplay
