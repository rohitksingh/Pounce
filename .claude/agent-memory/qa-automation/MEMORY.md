# QA Automation Memory

## Project: Pounce (Phaser Game)

### Testing Framework
- **Tool:** Vitest
- **Command:** `npm test`
- **Config:** Uses jsdom for DOM simulation

### Testing Patterns

#### Phaser Scene Testing Limitations
- Phaser scenes cannot be fully tested in headless environment due to canvas requirements
- Canvas context methods fail with: "Cannot set properties of null (setting 'fillStyle')"
- **Solution:** Test scene structure and logic separately, avoid instantiating full Phaser.Game in tests
- Test configuration/data flow instead of full scene rendering
- Manual testing required for UI interactions and visual elements

#### Successful Test Patterns
1. **Configuration Testing:** Pure data tests work perfectly (LevelConfig.test.ts)
2. **Logic Testing:** Test state transitions and data flow without rendering
3. **Integration Testing:** Test how configs apply to GameConfig without rendering scenes

#### Failed Patterns to Avoid
- Creating Phaser.Game instances in tests (canvas errors)
- Calling scene.create() with full Phaser context
- Testing UI element rendering via spies (unreliable in test env)

### Project-Specific Testing Notes

#### Level System
- 3 levels: Tropical Paradise (5 cats, 70 speed, 85%), Deeper Waters (7 cats, 85 speed, 90%), Pirate's Lair (10 cats, 100 speed, 95%)
- Level progression: Level 1 → LevelCompleteScene → Level 2 → LevelCompleteScene → Level 3 → VictoryScene
- Retry functionality: Game over returns to MenuScene with lastLevel data

#### Known Test Failures
- GridManager "center as void" test fails (expected: center is now CAPTURED after T022 island spawn)
- FloodFill large region test fails (expected: center island affects flood fill logic)
- These are NOT bugs - tests need updating for T022 feature changes

### Test File Organization
```
tests/
├── unit/
│   ├── LevelConfig.test.ts
│   ├── LevelCompleteScene.test.ts
│   ├── VictoryScene.test.ts
│   ├── MenuScene.test.ts
│   ├── GridManager.test.ts
│   └── FloodFill.test.ts
└── integration/
    ├── LevelProgression.test.ts
    ├── LevelProgressionBugFixes.test.ts (25 tests - bug verification)
    └── CollisionDetection.test.ts
```

### Manual Testing Requirements
- Scene transitions and UI interactions
- Button hover effects
- Progressive difficulty feel
- Cat spawn positions and movement
- Performance with 10 cats (Level 3)

### Testing Best Practices for Phaser
1. Test game logic separately from rendering
2. Use configuration tests for data validation
3. Test state machines and transitions
4. Manual testing for visual/UX elements
5. Keep tests simple - avoid complex Phaser mocks

### Critical Bug Fixes Tested (2026-02-15)
**Bug 1: Level 2 Not Starting**
- Root cause: GameScene.create() didn't reset state between levels
- Fix: Added comprehensive reset (lives, cats[], powerUps[], grid, flags, timers) at lines 54-65
- Verified: 13 tests covering state reset, config application, array clearing

**Bug 2: Wrong Level Name in UI**
- Root cause: Hardcoded "Level 1: Tropical Paradise" in index.html line 82
- Fix: Empty div populated dynamically by GameScene.updateUI() lines 219-222
- Verified: 4 tests covering all level names (Tropical Paradise, Deeper Waters, Pirate's Lair)

**Test Results:** 25/25 automated tests PASSED
**Manual Testing:** Required for scene transitions, UI updates, gameplay feel
**Checklist:** MANUAL_TEST_CHECKLIST.md created with 10 critical scenarios
