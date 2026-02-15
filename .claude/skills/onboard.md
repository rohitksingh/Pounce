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

**CRITICAL: ALWAYS follow this process. Do NOT make code changes directly - EVER.**

### When to Handle Directly (VERY LIMITED)

**ONLY handle these tasks directly** - NO code changes allowed:
- ✅ Reading/exploring code to answer questions
- ✅ Git operations (status, log, diff, checkout, merge, push)
- ✅ Running dev server or builds (npm run dev, npm test, etc.)
- ✅ Answering questions about the codebase
- ✅ Explaining how things work

### When to DELEGATE (ALL CODE CHANGES)

**MANDATORY: Use fullstack-developer agent for ANY code change:**
- ❗ **Single-line changes** (typos, values, comments, anything)
- ❗ **Single-file changes** (any edit to any .ts, .js, .css file)
- ❗ **Multi-file changes** (obviously)
- ❗ **New files** (creating new components, utilities, etc.)
- ❗ **Documentation in code** (updating docstrings, inline comments)
- ❗ **Config changes** (package.json, tsconfig.json, etc.)
- ❗ **ANY use of Edit or Write tools** on code files

**Examples that ALL require fullstack-developer:**
- "Change this color from red to blue" → fullstack-developer
- "Fix this typo in the comment" → fullstack-developer
- "Make the pirates bigger" → fullstack-developer
- "Add animated sprites" → fullstack-developer
- "Update the README" → fullstack-developer
- "Change a constant value" → fullstack-developer

**ABSOLUTE RULE:**
- **NEVER use Edit or Write tools for ANY code changes**
- **ALWAYS delegate to fullstack-developer for implementation**
- **If you're thinking about making a change, delegate it**

### Complete Autonomous Workflow

**CRITICAL: User should only be involved at START and FINAL REVIEW**

#### Step 1: User Requests Change & Create Ticket
User provides feedback or feature request

**Create Ticket:**
- Assign ticket number: `T###` (e.g., T001, T002)
- Create clear title (e.g., "Add freeze power-up system")
- Format: `[T###] Title`
- Track in all communications and commits

#### Step 2: Implementation
- **ALWAYS** delegate to **fullstack-developer**
- **NEVER** implement directly
- Provide clear context and requirements
- **Include ticket number in prompt**: `[T###] Feature description`

#### Step 3: Automated Testing
- **AUTOMATICALLY** launch **ui-bug-tester** after implementation
- **DO NOT** ask user to test yet
- Tester systematically checks all functionality

#### Step 4: Bug Fix Loop (Autonomous)
**If bugs found:**
- Send bugs back to **fullstack-developer** to fix
- **Automatically** re-test with **ui-bug-tester**
- **Loop until all tests pass**
- **DO NOT** involve user during this loop

**If no bugs:**
- Proceed to Step 5

#### Step 5: User Review (ONLY NOW)
- Present completed, tested work to user
- **Show ticket number and title**: `[T###] Feature Title`
- Game is ready at dev server URL
- Wait for user response:

**User says "Looks good":**
- **AUTOMATICALLY** merge to main
- Commit with ticket number: `feat: [T###] Feature title`
- Push to remote
- **Mark ticket as complete**
- Done!

**User says "I have feedback":**
- **GO BACK TO STEP 1**
- Keep same ticket number
- Start entire process again

---

### Planning Phase (Optional)

**For complex features:**
1. Use **tech-architect** for design decisions
2. Get user approval on approach
3. Then proceed with implementation workflow above

---

### Test Automation (Optional)

**After feature is merged:**
- Use **qa-automation** to write automated tests
- Ensures regression prevention
- Only when user requests or when appropriate

---

### Agent Communication
- Provide clear context when delegating
- Agents have project-scoped memory in `.claude/agent-memory/`
- Agents build institutional knowledge over time
- Each agent follows their specialized methodology
- **User is only involved at: REQUEST → FINAL REVIEW → APPROVAL**

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

### Recent Completed Tickets
- [T001] Sprite visibility improvements
- [T002] UI improvements and smooth trail rendering
- [T003] Animated cat sprites integration
- [T004] Power-up system (freeze & slow)
- [T005] Procedural animated background

### Ticket Numbering
- Format: T### (e.g., T001, T002, T003)
- Increment sequentially
- Next ticket: T006

---

## Key Conventions

- **Sprite Naming**: 'cat' sprite = player, 'pirate' sprite = enemies
- **Depth Layers**: 0=background, 1=island, 2=grid, 5=cats, 10=mouse, 100=UI, 200=modals
- **Colors**: Gold/yellow (#FFD700) for UI, wooden deck for captured territory
- **Movement**: Grid-based with visual interpolation for smooth rendering
- **Collision**: Circle-based collision detection with radius = cellSize * 0.4

---

**You are now fully onboarded!** 🎮

**REMEMBER:**
- NEVER make code changes directly
- ALWAYS delegate to fullstack-developer for ANY code modification
- Only handle: reading code, git operations, running commands, answering questions
- When in doubt → DELEGATE
- **ALWAYS create and track ticket numbers for all features**
- **Show ticket number [T###] in all progress updates**
