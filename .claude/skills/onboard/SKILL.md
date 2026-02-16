---
name: onboard
description: Complete onboarding guide for Pounce project - shows development workflow, available agents, git strategy, and project context
---

# Pounce Project Onboarding

Welcome to the Pounce project! This skill provides complete context about the project structure, development workflow, and agent collaboration strategy.

## 🎮 Project Overview

**Pounce** is a territory capture game built with:
- **Framework**: Phaser 3 (TypeScript)
- **Build Tool**: Vite
- **Testing**: Vitest
- **Style**: Procedural graphics (no image assets)

**Gameplay:**
- Player controls a Mouse capturing ocean territory
- Cat pirates try to catch the player
- 3 levels with progressive difficulty
- Each level has a unique visual theme

**Key Features:**
- Flood-fill territory capture algorithm
- Dynamic level progression system
- Theme-based visual environments
- Power-up system
- Animated backgrounds and decorations

## 📁 Project Structure

```
/src
├── /scenes/          # Game scenes
│   ├── BootScene.ts          # Initial loading
│   ├── MenuScene.ts          # Main menu
│   ├── GameScene.ts          # Core gameplay (LARGEST FILE)
│   ├── LevelCompleteScene.ts # Between levels
│   └── VictoryScene.ts       # Game complete
├── /entities/        # Game objects
│   ├── Mouse.ts              # Player character
│   ├── Cat.ts                # Enemy AI
│   └── PowerUp.ts            # Collectible items
├── /config/          # Configuration
│   ├── GameConfig.ts         # Core game settings
│   ├── LevelConfig.ts        # Level definitions
│   └── ThemeConfig.ts        # Visual themes per level
└── /utils/           # Helper classes
    ├── GridManager.ts        # Territory grid
    └── FloodFill.ts          # Capture algorithm

/tests
├── /unit/            # Unit tests
└── /integration/     # Integration tests
```

## 🤖 Point 1: Available Specialized Agents

This project uses **3 specialized agents** for different tasks:

### 1. fullstack-developer
**Use for:** End-to-end feature implementation
- Building new features (new levels, power-ups, mechanics)
- Implementing user stories
- Full-stack development tasks
- Code architecture changes

**Example tasks:**
- "Add a new power-up type"
- "Implement level 4 with volcano theme"
- "Refactor the collision detection system"

### 2. ui-bug-tester
**Use for:** UI testing and bug verification
- Testing after new UI features
- Visual regression testing
- Finding UI/UX issues
- Verifying bug fixes

**Example tasks:**
- "Test the new theme implementation"
- "Verify all levels display correctly"
- "Check for visual glitches in territory capture"

### 3. tech-architect
**Use for:** Architecture and design decisions
- Project planning
- Tech stack evaluation
- System design
- Strategic technical decisions

**Example tasks:**
- "Plan the implementation for multiplayer mode"
- "Evaluate state management approaches"
- "Design the plugin system architecture"

## 📢 Point 2: Agent Transparency

**CRITICAL RULE: ALWAYS announce which agent is being used.**

### Before Launching Any Agent:

✅ **DO THIS:**
```
I'll use the fullstack-developer agent to implement the new
power-up system with shield mechanics.
```

❌ **DON'T DO THIS:**
```
[Silently launches agent without explanation]
```

### What to Announce:
1. **Which agent** - fullstack-developer / ui-bug-tester / tech-architect
2. **Why that agent** - Explanation of why it's the right choice
3. **What task** - Clear description of what it will do

### Example:
```
I'll use the ui-bug-tester agent to verify the volcano theme
implementation works correctly across all screen sizes and
doesn't have any visual glitches.
```

## 🎫 Point 3: Task Handover Strategy

**CRITICAL RULE: NEVER work directly. ALWAYS use ticket workflow.**

### Complete Workflow:

```
1. User Request
   ↓
2. Create Ticket (TaskCreate)
   ↓
3. Assign to fullstack-developer
   ↓
4. Implementation on feature branch
   ↓
5. Hand over to ui-bug-tester
   ↓
6. Testing
   ↓
   ├─→ Bug Found → Back to fullstack-developer
   │                      ↓
   │                [Fix & Re-test]
   │                      ↓
   └─→ Additional Bug → Create NEW ticket
                              ↓
7. All Bugs Fixed
   ↓
8. Request Project Owner Review
   ↓
9. Wait for Approval
```

### Rules:

✅ **ALWAYS:**
- Create tickets for EVERY user request (use TaskCreate)
- Show current ticket number and status
- Assign tickets to appropriate agents
- Use TaskUpdate to track progress (pending → in_progress → completed)
- Announce ticket number and agent working on it
- Create SEPARATE tickets for additional bugs found during testing
- Only ask Project Owner for review when ALL bugs are fixed

❌ **NEVER:**
- Work on implementation directly without creating a ticket
- Skip the ui-bug-tester verification step
- Ask Project Owner for review while bugs exist
- Combine multiple unrelated bugs in one ticket
- Work silently without showing ticket status

### Ticket Visibility Format:

```
📋 CURRENT TASK
Task #25: "Add volcano theme to Level 4"
🌿 Branch: feature/task-25-volcano-theme
🔧 Agent: fullstack-developer
📊 Status: in_progress
⏭️ Next: Hand over to ui-bug-tester after implementation
```

### Example Flow:

```
User: "Add a boost power-up"

Claude: "Creating ticket for this feature..."

📋 TICKET CREATED
Task #28: "Add boost power-up for speed increase"
Status: pending
Assigned to: fullstack-developer

I'm launching the fullstack-developer agent to implement
the boost power-up system.

[fullstack-developer implements...]

✅ IMPLEMENTATION COMPLETE
Task #28: Boost power-up implemented
Handing over to ui-bug-tester for verification...

🧪 TESTING IN PROGRESS
Task #28 - Agent: ui-bug-tester

[ui-bug-tester finds issue...]

🐛 BUG FOUND
Task #28: Power-up icon overlaps score display
Reassigning to fullstack-developer

[fullstack-developer fixes...]

🔧 BUG FIXED
Task #28: Fixed icon positioning
Handing back to ui-bug-tester...

[ui-bug-tester finds another issue...]

🐛 ADDITIONAL BUG FOUND
Creating separate ticket...

📋 NEW TICKET
Task #29: "Boost power-up - collision detection issue"
Assigned to: fullstack-developer

[After all bugs fixed...]

✅ ALL BUGS FIXED
Task #28: ✓ Complete
Task #29: ✓ Complete

Ready for Project Owner review.
```

## 🌿 Point 4: Git Branch Workflow

**Branch Strategy:**

```
feature/task-X → release → main
     ↓             ↓         ↓
  develop    owner review  end users
```

### Branch Purposes:

- **feature/task-X** - Active development by agents
- **release** - Project Owner review and testing
- **main** - Production-ready code for end users

### Rules:

✅ **ALWAYS:**
- Create a new feature branch for each task: `feature/task-X-description`
- Work on feature branch during implementation
- Merge feature branch to `release` when ready for review
- Wait for "I like it" approval from Project Owner
- After approval, merge `release` to `main`
- Update version number when merging to `main`
- Add release notes to GitHub Pages
- Create git tags for releases

❌ **NEVER:**
- Work directly on `release` or `main` branches
- Merge to `main` without Project Owner approval
- Skip version updates when releasing
- Forget release notes

### Complete Git Flow:

```
1. Task #25 created
   ↓
2. Create feature/task-25-new-powerup
   ↓
3. fullstack-developer works on feature branch
   ↓
4. Merge feature → release
   ↓
5. ui-bug-tester tests on release
   ↓
6. Bugs found → Fix on feature branch → Merge to release
   ↓
7. All verified → "Ready for your review on release branch"
   ↓
8. Project Owner tests release branch
   ↓
9. Project Owner: "I like it"
   ↓
10. Merge release → main
    ↓
11. Update version (v1.2.0 → v1.3.0)
    ↓
12. Create git tag v1.3.0
    ↓
13. Add release notes to GitHub Pages
    ↓
14. Announce release
```

### Version Updates (When Merging to Main):

```bash
# 1. Update package.json version
npm version minor  # or major/patch

# 2. Update version display in app (already implemented)

# 3. Create git tag
git tag v1.X.0

# 4. Push tag
git push origin v1.X.0
```

### Release Notes Template:

```markdown
# v1.3.0 - [Feature Name]

## Features Added
- Task #25: [Description]
- Task #26: [Description]

## Bugs Fixed
- Task #27: [Description]

## Visual Changes
[Screenshots if UI changes]

## Breaking Changes
[If any]
```

## 🎨 Current Project State

### Levels & Themes:

1. **Level 1: Caribbean Beach** (Tropical)
   - Blue ocean waves with caustics
   - Palm trees
   - Bubbles and gold sparkles
   - Sandy deck territory

2. **Level 2: Arctic Ice** (Arctic)
   - White/blue ice layers with aurora
   - Floating icebergs
   - Snowflakes falling
   - Icy territory

3. **Level 3: Desert Oasis** (Desert)
   - Orange/yellow sand dunes with heatwave
   - Desert cacti
   - Sand particles
   - Oasis water territory

### Recent Major Features:

- ✅ Level progression system (3 levels)
- ✅ Distinct visual themes per level
- ✅ Theme configuration system (ThemeConfig.ts)
- ✅ Animated decorations (palms, icebergs, cacti)
- ✅ Power-up system
- ✅ Comprehensive test suite

## 🔧 Key Development Conventions

### Commit Messages:
```
feat: add new feature
fix: bug fix
test: add tests
refactor: code refactoring
docs: documentation
chore: maintenance

Always include:
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Code Style:
- TypeScript strict mode
- Phaser 3 best practices
- Procedural graphics (no external images)
- 60fps performance target
- Clean, readable code over clever code

### Testing:
- Unit tests for utilities and configs
- Integration tests for game flows
- Visual testing for UI changes
- Performance testing for 60fps

## 📞 Quick Reference

### When User Says → You Do:

| User Request | Action |
|-------------|---------|
| "Add [feature]" | 1. Create ticket<br>2. Assign to fullstack-developer<br>3. Create feature branch |
| "I like it" | 1. Merge release → main<br>2. Update version<br>3. Add release notes |
| "Test [feature]" | 1. Assign to ui-bug-tester<br>2. Create test checklist |
| "Plan [feature]" | 1. Assign to tech-architect<br>2. Create design doc |

### Workflow Checklist:

- [ ] Ticket created and numbered
- [ ] Feature branch created
- [ ] Agent assigned and announced
- [ ] Implementation complete
- [ ] Merged to release
- [ ] ui-bug-tester verified
- [ ] All bugs fixed
- [ ] Ready for owner review
- [ ] Owner approved
- [ ] Merged to main
- [ ] Version updated
- [ ] Release notes added
- [ ] Released announced

---

## 🎯 Your Role

You are the **Project Owner**. I will:
- Create and manage tickets
- Coordinate agents
- Implement features via fullstack-developer
- Test via ui-bug-tester
- Seek your approval before releasing to main
- Keep you informed of all progress

You will:
- Request features
- Test on release branch
- Approve with "I like it"
- Make final decisions

---

**Welcome to the Pounce development team!** 🎉

This workflow ensures high-quality, well-tested code reaches your end users.

---

## 📝 After Displaying This Content

Always provide a brief summary of what you learned:

```
📚 Onboarding Summary

I've refreshed my understanding of:
1. The 3 specialized agents (fullstack-developer, ui-bug-tester, tech-architect)
2. Agent transparency requirement (always announce which agent is working)
3. Task handover workflow (create tickets → assign agents → test → owner review)
4. Git branch strategy (feature → release → main with owner approval)

Key takeaways:
- Never work directly - always use ticket workflow
- Always announce which agent is working
- Only ask for owner review when all bugs are fixed
- Wait for "I like it" before merging to main

Ready to follow the complete workflow!
```
