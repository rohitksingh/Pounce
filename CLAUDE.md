# Claude Code Instructions for Pounce Project

## 1. Available Specialized Agents

This project has access to three specialized agents for different types of tasks:

- **fullstack-developer**: For end-to-end feature implementation across frontend, backend, and database layers. Use for building complete features, implementing user stories, and handling full-stack development tasks.

- **ui-bug-tester**: For testing user interface functionality and identifying bugs. Use after implementing new UI features, making UI changes, or when users report UI issues.

- **tech-architect**: For technical architecture planning, tech stack selection, and system design decisions. Use for project planning, evaluating technologies, and making strategic technical decisions.

**When to use each agent:**
- New feature implementation → fullstack-developer
- UI testing and bug verification → ui-bug-tester
- Architecture decisions and planning → tech-architect

## 2. Agent Transparency

**ALWAYS clearly communicate which agent is being used for a task.**

When launching an agent, explicitly state:
- Which agent you're using
- Why you're using that specific agent
- What task the agent will perform

**Example:**
```
I'll use the ui-bug-tester agent to verify the level theme implementation
and check for any visual bugs across all three levels.
```

**DO NOT:**
- Silently launch agents without explanation
- Assume the user knows which agent is running
- Switch agents without announcing the change

## 3. Task Handover Strategy

**ALWAYS use agents with proper ticket workflow. NEVER work directly on implementation.**

### Workflow for ALL feature requests:

1. **User requests feature/change** → Create ticket using TaskCreate
2. **Assign ticket to fullstack-developer** → Implementation phase
3. **After implementation** → fullstack-developer hands over to ui-bug-tester
4. **Bug found** → Assign ticket back to fullstack-developer
5. **Additional bugs found** → Create separate tickets, assign to fullstack-developer
6. **All bugs fixed** → Request Project Owner review

### Rules:

✅ **ALWAYS:**
- Create tickets for every user request
- Show which ticket is currently being worked on
- Assign tickets to appropriate agents (never work directly)
- Use TaskUpdate to track progress (pending → in_progress → completed)
- Announce ticket number and status changes
- Only ask Project Owner for review when bugs are fixed

❌ **NEVER:**
- Work on implementation directly without creating a ticket
- Skip the ui-bug-tester verification step
- Ask Project Owner for review while bugs exist
- Combine multiple unrelated bugs in one ticket

### Example Flow:

```
User: "Add a new power-up type"

Claude: "I'll create a ticket for this feature request."
→ Creates Task #15: "Add new power-up type"

Claude: "I'm assigning Task #15 to the fullstack-developer agent
        to implement the new power-up system."
→ fullstack-developer implements feature

Claude: "Implementation complete. Handing over Task #15 to
        ui-bug-tester agent for verification."
→ ui-bug-tester tests and finds visual bug

Claude: "ui-bug-tester found a bug with power-up icon rendering.
        Reassigning Task #15 to fullstack-developer."
→ fullstack-developer fixes bug

Claude: "Bug fixed. Handing over Task #15 to ui-bug-tester
        for re-verification."
→ ui-bug-tester verifies fix, finds another issue

Claude: "ui-bug-tester found additional bug: collision detection.
        Creating new Task #16 and assigning to fullstack-developer."
→ Process repeats until all bugs fixed

Claude: "All bugs fixed and verified. Ready for your review,
        Project Owner."
```

### Ticket Visibility:

Always display:
- **Current ticket**: Task #X - [Description]
- **Current agent**: fullstack-developer / ui-bug-tester
- **Status**: pending / in_progress / completed
- **Next step**: What happens after current task

## 4. Git Branch Workflow

**Branch Strategy:**

```
feature/task-X → release → main
    ↓             ↓         ↓
  develop    owner review  end users
```

### Rules:

✅ **ALWAYS:**
- Create a new feature branch for each task: `feature/task-X-description`
- Work on feature branch during implementation
- Merge feature branch to `release` when ready for Project Owner review
- Wait for "I like it" approval from Project Owner
- After approval, merge `release` to `main`
- Update version number when merging to `main`
- Add release notes to GitHub Pages when releasing to `main`

❌ **NEVER:**
- Work directly on `release` or `main` branches
- Merge to `main` without Project Owner approval
- Skip version updates when releasing
- Forget release notes

### Branch Purposes:

- **feature/*** - Active development by agents
- **release** - Project Owner review and testing
- **main** - Production-ready code for end users

### Workflow Example:

```
1. Task #15 created → Create feature/task-15-new-powerup
2. fullstack-developer works on feature/task-15-new-powerup
3. Implementation done → Merge to release branch
4. ui-bug-tester tests on release branch
5. Bugs found → Fix on feature/task-15-new-powerup, merge to release
6. All verified → "Ready for your review on release branch"
7. Project Owner: "I like it" → Merge release to main
8. Update version (v1.2.0 → v1.3.0)
9. Add release notes to GitHub Pages
10. Announce: "Released v1.3.0 to production"
```

### Version Updates:

When merging to `main`:
1. Update version in `package.json`
2. Update version display in app (already implemented)
3. Create git tag: `git tag v1.X.0`
4. Push tag: `git push origin v1.X.0`

### Release Notes:

Always include in GitHub Pages release notes:
- Version number
- Features added (link to tickets)
- Bugs fixed (link to tickets)
- Visual changes (screenshots if UI changes)
- Breaking changes (if any)

## Using the /onboard Skill

When the Project Owner runs `/onboard`, always provide a brief summary after displaying the content:

**Summary Format:**
```
📚 Onboarding Summary

I've refreshed my understanding of:
1. [Key point 1]
2. [Key point 2]
3. [Key point 3]
4. [Key point 4]

Ready to follow the complete workflow!
```

## Project Context

This is Pounce - a territory capture game built with Phaser 3 and TypeScript. The game features:
- 3 levels with progressive difficulty
- Distinct visual themes per level (Caribbean Beach, Arctic Ice, Desert Oasis)
- Mouse player vs Cat pirates
- Territory capture mechanics with flood-fill algorithm

Key directories:
- `/src/scenes/` - Game scenes (MenuScene, GameScene, LevelCompleteScene, VictoryScene)
- `/src/entities/` - Game entities (Mouse, Cat, PowerUp)
- `/src/config/` - Configuration files (GameConfig, LevelConfig, ThemeConfig)
- `/src/utils/` - Utility classes (GridManager, FloodFill)
- `/tests/` - Test suites (unit and integration tests)
