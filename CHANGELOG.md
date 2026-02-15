# Changelog

All notable changes to Pounce will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive release versioning system with automated script
- CHANGELOG.md for tracking all changes
- Git tags and GitHub Releases integration

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

[Unreleased]: https://github.com/rohitksingh/Pounce/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/rohitksingh/Pounce/releases/tag/v1.0.0
