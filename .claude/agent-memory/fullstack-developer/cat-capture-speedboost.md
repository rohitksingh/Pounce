# Cat Capture Speed Boost Feature (T013)

## Feature Overview
When the player captures territory containing cats (pirate opponents), the cats are eliminated and the player's speed increases permanently for that life.

## Implementation Details

### Configuration (GameConfig.ts)
```typescript
speedIncreasePerCat: 0.1,    // 10% increase per cat (multiplicative)
maxSpeedMultiplier: 2.5,     // Cap speed at 2.5× base speed
```

### Mouse Speed Management (Mouse.ts)
**New Properties:**
- `baseMoveDelay: number` - Stores original move delay for speed calculations
- Speed is controlled by adjusting `moveDelay` (inverse relationship)

**New Methods:**
- `getSpeedMultiplier()` - Returns current speed as multiplier (1.0 = base, 2.0 = double speed)
- `increaseSpeed(multiplier)` - Increases speed by reducing move delay
- `resetSpeed()` - Resets to base speed (used on death)

**Speed Calculation:**
- Speed is inversely proportional to `moveDelay`
- Higher delay = slower speed
- Lower delay = faster speed
- Formula: `speedMultiplier = baseMoveDelay / currentMoveDelay`

### GameScene Integration (GameScene.ts)
**handleLoopCompleted():**
- Calls `increasePlayerSpeed()` for each captured cat
- Logs capture events and remaining cat count
- Shows "All pirates defeated!" when all cats eliminated

**handleMouseHit():**
- Resets speed to base on death
- Speed persists across captures but resets on death

**updateUI():**
- Shows speed multiplier in UI when > 1.0×
- Format: "Speed: 1.5×" (shown only when boosted)

**increasePlayerSpeed():**
- Private method that applies speed boost per cat
- Uses configured multiplier from GameConfig

## Speed Boost Mechanics
1. **Multiplicative Stacking**: Each cat gives 10% boost
   - 1 cat: 1.1× speed
   - 2 cats: 1.21× speed (1.1 × 1.1)
   - 3 cats: 1.33× speed
   - 7 cats (all): ~1.95× speed (capped at 2.5×)

2. **Speed Cap**: Maximum 2.5× base speed to prevent game breaking

3. **Reset on Death**: Speed resets to 1.0× when player loses a life

4. **Persistence**: Speed persists across territory captures until death

## Testing Checklist
- [x] Cats inside captured area are eliminated
- [x] Speed increases by 10% per cat
- [x] Speed increase is multiplicative (stacks correctly)
- [x] Speed displays in UI
- [x] Speed resets on death
- [x] Speed capped at max multiplier
- [x] Console logs show capture events
- [x] Game handles 0 cats remaining

## Console Output
```
[GameScene] Captured 2 pirate(s)!
[GameScene] 5 pirate(s) remaining. Speed boost: 121%
```

## UI Display
Before boost: `Territory: 45.2% | Lives: 3 | Pirates: 7`
After boost: `Territory: 45.2% | Lives: 3 | Pirates: 5 | Speed: 1.2×`

## Edge Cases Handled
1. Multiple cats captured at once - each gives 10% boost
2. No cats left - game continues normally
3. Speed cap - prevents exceeding 2.5× multiplier
4. Death - speed resets to 1.0×
5. Speed persists across subsequent captures
