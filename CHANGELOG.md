# Changelog

All notable changes to Pounce will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-02-16

### MAJOR THEMATIC REDESIGN 🤖

**Complete transformation from pirate theme to robot invasion story!**

### Added
- **Robot Enemies** - Three distinct procedural robot designs
  - Level 1: Basic gray robot with red eyes and antenna
  - Level 2: Advanced hexagon robot with blue glowing core and hover jets
  - Level 3: Elite tank robot with blinking warning lights and armor plating
- **Wasteland Background System** - Two-layer background rendering
  - Tropical: Gray metallic wasteland with green circuit lines
  - Arctic: Black metallic wasteland with rust spots
  - Desert: Red scorched wasteland with black scorch marks
- **Transformation Particle Effects** - Visual feedback when capturing territory
  - Orange sparks → green nature → golden glow animation
  - Max 30 bursts per capture for performance
  - Shows wasteland transforming into nature
- **New Story** - Cat hero reclaims Earth from alien robots
  - Alien robots conquered Earth and turned landscapes into wastelands
  - Player is a brave cat restoring nature to the planet
  - Visual hook: Uncaptured = wasteland, Captured = natural paradise

### Changed
- **Level Names** - Updated to reflect wasteland theme
  - Level 1: "Caribbean Beach" → "Tropical Wasteland"
  - Level 2: "Arctic Ice" → "Arctic Wasteland"
  - Level 3: "Desert Oasis" → "Scorched Desert"
- **UI Text** - All references updated
  - "Pirates" → "Robots" throughout
  - Pirate emoji ☠️ → Robot emoji 🤖
  - Page title: "Cat vs Robot Invasion"
- **Story Scenes** - New narrative text
  - MenuScene: Robot invasion intro story
  - LevelCompleteScene: Level-specific victory messages
  - VictoryScene: Final victory celebration

### Technical
- Created `Robot.ts` entity with same mechanics as Cat
- Updated `FloodFill.ts` to support both Cat and Robot types
- Added wasteland configuration to `ThemeConfig.ts`
- GameScene supports union type `(Cat | Robot)[]` for enemies
- Power-up system updated to handle both enemy types
- Wasteland layer at depth 0.4 (renders only VOID cells)
- Transformation particles use procedural textures

### Breaking Changes
- **Visual Theme**: Complete overhaul from pirate to robot aesthetics
- **Enemy Display**: Code uses `cats` array but displays "Robots"
- **Story Content**: All story text completely changed

### Notes
- All game mechanics preserved - only visuals and story changed
- Performance-optimized wasteland rendering and particle effects
- Both Cat and Robot entities coexist in codebase
- See `ROBOT_INVASION_V2.md` for detailed documentation

## [1.2.1] - 2026-02-16

### Fixed
- Level title now updates correctly when progressing through levels
  - Level 1: 🏝️ LEVEL 1: CARIBBEAN BEACH
  - Level 2: ❄️ LEVEL 2: ARCTIC ICE
  - Level 3: 🏜️ LEVEL 3: DESERT OASIS
- Updated Level 1 name in config from "Tropical Paradise" to "Caribbean Beach"
- Added dynamic level title update in GameScene with theme-based emojis

## [1.2.0] - 2026-02-16

### Added - Level 1 UI Redesign 🎨
**Complete professional UI transformation for Caribbean Beach theme:**

1. **Themed Decorative Frames**
   - Bamboo (🎋), anchors (⚓), and wave (🌊) decorations
   - Turquoise glowing borders
   - Tropical color palette (turquoise, gold, ocean blue)

2. **Icon-Based Stats Display**
   - Hearts (❤️) for lives instead of text
   - Island icon (🏝️) with visual progress bar
   - Dynamic color-coded feedback

3. **Custom Game Fonts**
   - "Pirata One" for pirate-themed titles
   - "Orbitron" for modern UI stats
   - Professional typography

4. **Glass-Morphism Modern Style**
   - Frosted glass effect with backdrop blur
   - Semi-transparent UI panels
   - Premium modern aesthetic

5. **Animated Progress Bar**
   - Smooth gradient fill animation
   - Color changes: red → orange → yellow → green → gold
   - Glow effects and pulse near victory

6. **Particle Effects on Events**
   - Screen shake + red flash when hit
   - Heart fade animation when life lost
   - Last heart pulses red when in danger

7. **Real-Time Minimap**
   - 80x60px territory overview (bottom-left)
   - Shows captured (gold), void (blue), pirates
   - Updates dynamically during gameplay

8. **Dynamic Color-Coded Feedback**
   - Progress bar color based on percentage
   - Hearts color based on remaining lives
   - Power-up display with countdown timer

9. **Professional Polish**
   - 13 smooth CSS animations (sway, float, pulse, heartbeat)
   - Proper visual hierarchy
   - Drop shadows and depth effects
   - Responsive design (mobile-friendly)

10. **Complete Caribbean Beach Theme**
    - Immersive tropical atmosphere
    - Consistent styling throughout
    - Professional AAA-quality presentation

### Technical
- 527 lines of enhanced HTML/CSS
- 189 lines of GameScene integration
- Google Fonts integration
- Optimized rendering with change detection
- Maintains 60fps performance

### Notes
- UI redesign applied to Level 1 only
- Levels 2 & 3 will receive same treatment in future updates
- All gameplay mechanics unchanged
- Zero regressions in game functionality

## [1.1.2] - 2026-02-16

### Changed
- Fixed development server to always use port 5173
  - Added `strictPort: true` to Vite configuration
  - Prevents automatic port increment (no more 5174, 5175, etc.)
  - Provides consistent URL for review: http://localhost:5173/Pounce/
  - Clear error message when port is already in use

### Documentation
- Updated DEVELOPMENT_WORKFLOW.md with fixed port information

## [1.1.1] - 2026-02-16

### Changed
- Cleaned up codebase by removing 20 unnecessary files
  - 12 test report artifacts (moved to test documentation)
  - 7 macOS .DS_Store system files
  - 1 resolved agent memory report
- Enhanced .gitignore to prevent future test artifacts and system files
- 30% reduction in root directory clutter
- Zero functional changes to game code

### Technical
- Updated agent memory systems for better workflow tracking
- Improved bash command safety patterns

## [1.1.0] - 2026-02-15

### Added
- Random spawn system in captured territory (T026)
  - Player spawns at random location at game start
  - Player respawns at random location after death
  - Improves gameplay variety and unpredictability
- Version display in bottom-right corner (T024)
- Comprehensive release versioning system (T023)
  - Automated release script
  - CHANGELOG.md for tracking changes
  - Git tags and GitHub Releases integration

### Changed
- Player no longer spawns at fixed center position
- Cats no longer spawn on center island (T025)
- Respawn now clears trail and resets direction/speed

## [1.0.0] - 2026-02-15

### Added
- Territory capture game with QIX/Volfied mechanics
- Player spawns on 7x7 center island (T022)
- Pirate-themed graphics with animated sprites
- Smooth visual interpolation for mouse movement (T018)
- Power-up system with freeze and slow effects (T004)
- Speed boost when capturing pirates (T013)
- Swaying palm trees on captured territory (T008)
- Animated ocean background with waves, caustics, bubbles, and sparkles (T005)
- Continuous auto-movement for mouse player (T017)
- GitHub Pages deployment with automated workflows (T010)
- Slack notification system for development workflow (T006)
- Comprehensive automated test suite

### Fixed
- Territory capture bugs at all percentages (T020, T021)
- Game stopping at 50% territory
- Border-side loops not filling correctly
- Flood fill algorithm using QIX/Volfied standard with old territory adjacency detection
- Trail rendering gaps with visual interpolation (T018)
- Cat bouncing behavior off captured territory (T016)
- MenuScene deployment issues (T011)
- Palm tree rearrangement on territory changes (T009)
- Power-up collision detection (T009)

### Technical
- Built with Phaser 3.80.1 and TypeScript 5.3+
- Vite 5.x for development and builds
- Vitest 4.x for automated testing
- GitHub Actions for CI/CD

[Unreleased]: https://github.com/rohitksingh/Pounce/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/rohitksingh/Pounce/compare/v1.2.1...v2.0.0
[1.2.1]: https://github.com/rohitksingh/Pounce/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/rohitksingh/Pounce/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/rohitksingh/Pounce/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/rohitksingh/Pounce/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/rohitksingh/Pounce/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/rohitksingh/Pounce/releases/tag/v1.0.0
