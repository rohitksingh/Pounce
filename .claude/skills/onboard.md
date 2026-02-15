---
name: onboard
description: Onboards Claude to the Pounce project context and agent workflow
---

# Pounce Project Onboarding

You are now working on **Pounce** - a territory-capture arcade game inspired by QIX/Volfied gameplay.

## Project Overview

**Pounce** is a browser-based game where players control a mouse character to capture territory while avoiding pirate cat enemies.

### Tech Stack
- **Framework**: Phaser 3.80+ (game engine)
- **Language**: TypeScript 5.3+
- **Build Tool**: Vite 5.x (dev server with HMR)
- **Testing**: Vitest 4.x with jsdom
- **Theme**: Pirate/nautical visual theme

### Project Structure
```
src/
├── main.ts              # Entry point, Phaser config
├── scenes/
│   ├── BootScene.ts     # Asset preloading
│   ├── MenuScene.ts     # Main menu
│   └── GameScene.ts     # Main gameplay scene
├── entities/
│   ├── Mouse.ts         # Player character (controlled by user)
│   └── Cat.ts           # Enemy pirates (AI-controlled)
├── utils/
│   ├── GridManager.ts   # 80x60 grid state management
│   └── FloodFill.ts     # Territory capture algorithm
└── config/
    └── GameConfig.ts    # Game constants

public/assets/           # Sprites, backgrounds, textures
```

### Core Gameplay
- **Player**: Mouse character (WASD/Arrow keys)
- **Objective**: Capture 75% of the playing field
- **Mechanics**:
  - Draw trails in the void (sea)
  - Close loops to capture territory (flood fill algorithm)
  - Avoid pirate cats touching your trail (lose a life)
  - 3 lives, game over when depleted
- **Grid System**: 80x60 cells (800x600px, 10px per cell)
- **Cell States**: VOID (sea), CAPTURED (wooden deck), TRAIL (yellow path)

### Development Commands
- `npm run dev` - Start dev server (usually http://localhost:5173 or 5174)
- `npm run build` - Production build
- `npm test` - Run test suite
- `npm run test:ui` - Test UI

---

## Agent Workflow

This project uses **specialized agents** for different types of work. Here's when and how to use them:

### Available Agents

#### 🔵 fullstack-developer
**Use for**: End-to-end feature implementation
- Building complete new features
- Implementing user stories
- Multi-file changes across the stack
- Adding new game mechanics or systems

**Examples:**
- "Add a new power-up system"
- "Implement multiple difficulty levels"
- "Add sound effects and music"
- "Create a high score system with persistence"

#### 🔴 ui-bug-tester
**Use for**: Testing UI/UX and identifying bugs
- After implementing new features
- After making UI/visual changes
- When user reports issues
- Systematic testing of game mechanics

**Examples:**
- "Test the new sprite sizes"
- "Check if collision detection works properly"
- "Verify the win/lose conditions"
- "Test responsive behavior"

#### 🧪 qa-automation
**Use for**: Writing automated tests
- Creating test suites for new features
- Regression testing
- Unit tests for utilities and game logic
- Integration tests for game scenes

**Examples:**
- "Write tests for the flood fill algorithm"
- "Add tests for collision detection"
- "Test grid state management"

#### 🏗️ tech-architect
**Use for**: Architecture and design decisions
- Planning major features before implementation
- Tech stack evaluation
- System design for complex features
- Performance optimization strategies

**Examples:**
- "How should we architect a multiplayer system?"
- "Design a plugin system for power-ups"
- "Plan the approach for mobile touch controls"

---

## Handoff Workflow

### Simple Changes (Direct Handling)
For straightforward edits, handle directly without delegating:
- Single-file tweaks
- Config changes
- Small bug fixes
- Documentation updates

### Feature Implementation Process

1. **Planning Phase** (if complex):
   - Use **tech-architect** for design decisions
   - Get user approval on approach

2. **Implementation Phase**:
   - Use **fullstack-developer** for building the feature
   - Agent implements across all necessary files
   - Follows existing patterns and conventions

3. **Testing Phase**:
   - Use **ui-bug-tester** to test the implementation
   - Identify and report any issues found

4. **Automation Phase** (if needed):
   - Use **qa-automation** to write automated tests
   - Ensures regression prevention

### Agent Communication
- When delegating, provide clear context and requirements
- Agents have project-scoped memory in `.claude/agent-memory/`
- Agents can build institutional knowledge over time
- Each agent follows their specialized methodology

---

## Current Project State

### Recent Features (from git history)
- ✅ Full sprite-based graphics with pirate theme
- ✅ Smooth visual interpolation for mouse movement (T018)
- ✅ Improved cat bouncing off captured territory (T016)
- ✅ Continuous auto-movement for mouse player (T017)
- ✅ Comprehensive automated test suite

### Active Branch
- Current: `release`
- Main: `main`

### Current Session Changes
- Pirate (Cat enemy) sprites scaled to 2x size
- Mouse (Player) sprites scaled to 2.5x size with green tint for visibility

---

## Key Conventions

- **Sprite Naming**: 'cat' sprite = player, 'pirate' sprite = enemies
- **Depth Layers**: 0=background, 1=island, 2=grid, 5=cats, 10=mouse, 100=UI, 200=modals
- **Colors**: Gold/yellow (#FFD700) for UI, wooden deck for captured territory
- **Movement**: Grid-based with visual interpolation for smooth rendering
- **Collision**: Circle-based collision detection with radius = cellSize * 0.4

---

**You are now fully onboarded!** 🎮

Use the specialized agents when appropriate, and handle simple tasks directly. Always check existing code patterns before making changes.
