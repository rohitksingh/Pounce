# Pounce Development Workflow

Complete workflow following CLAUDE.md instructions (Points 1-4)

## Complete Development Cycle

### Phase 1: Feature Request
```
You: "Add a new level with volcano theme"

Me: "Creating ticket for this feature..."
```

### Phase 2: Ticket Creation
```
📋 TICKET CREATED
Task #25: "Add Level 4 with volcano theme"
Status: pending
Branch: feature/task-25-volcano-theme
Assigned to: fullstack-developer

I'm now launching the fullstack-developer agent to implement
the volcano theme system.
```

### Phase 3: Implementation (Feature Branch)
```
🔧 AGENT WORKING
Current Branch: feature/task-25-volcano-theme
Task #25 - Agent: fullstack-developer
Status: in_progress

[fullstack-developer implements volcano theme...]
```

### Phase 4: Merge to Release (Your Review)
```
✅ IMPLEMENTATION COMPLETE
Task #25 - Status: completed by fullstack-developer

Merging feature/task-25-volcano-theme → release branch

Handing over to ui-bug-tester agent for verification...
```

### Phase 5: Testing
```
🧪 TESTING IN PROGRESS
Current Branch: release
Task #25 - Agent: ui-bug-tester
Status: testing

[ui-bug-tester verifies implementation...]
```

### Phase 6A: Bug Found (Loop Back)
```
🐛 BUG FOUND
Task #25: Volcano particles rendering incorrectly

Switching to feature/task-25-volcano-theme
Reassigning to fullstack-developer

[Fix → Merge to release → Test again]
```

### Phase 6B: Additional Bug (New Ticket)
```
🐛 ADDITIONAL BUG FOUND
Creating separate ticket...

📋 NEW TICKET CREATED
Task #26: "Volcano theme - lava animation glitch"
Branch: feature/task-26-lava-animation
Assigned to: fullstack-developer
```

### Phase 7: Ready for Review
```
✅ ALL BUGS FIXED AND VERIFIED
Task #25: ✓ Complete - Volcano theme implemented
Task #26: ✓ Complete - Lava animation fixed

Current Branch: release
All changes merged and tested

🎯 Ready for Project Owner review on release branch
Please test and let me know if you like it!
```

### Phase 8: Approval
```
You: "I like it"

Me: "Thank you! Merging to main and creating release..."
```

### Phase 9: Release to Production
```
🚀 RELEASING TO PRODUCTION

Current Version: v1.2.0
New Version: v1.3.0

Steps:
1. ✓ Merge release → main
2. ✓ Update package.json (v1.3.0)
3. ✓ Create git tag v1.3.0
4. ✓ Push to origin/main
5. ✓ Generate release notes

📝 RELEASE NOTES (GitHub Pages)
---
# v1.3.0 - Volcano Theme Update

## Features Added
- Task #25: New Level 4 with volcano theme
  - Orange/red lava colors
  - Volcanic rock decorations
  - Ash particle effects

## Bugs Fixed
- Task #26: Fixed lava animation glitch

## Visual Changes
[Screenshots of volcano theme]

---

✅ RELEASED v1.3.0 to production (main branch)
End users can now play Level 4!
```

---

## Quick Reference

### Branch Flow
```
feature/task-X → release → main
     ↓             ↓         ↓
  develop    your review  end users
```

### Agent Flow
```
fullstack-developer → ui-bug-tester → (bugs?) → fullstack-developer
                                                        ↓
                                                  (all fixed)
                                                        ↓
                                            Project Owner Review
```

### You'll Always See
- 📋 Current Task Number
- 🔧 Current Agent Working
- 🌿 Current Branch
- 📊 Current Status
- ⏭️ Next Step

### I'll Ask for Your Review When
- ✅ All bugs fixed
- ✅ All tests passed
- ✅ Changes on release branch
- ✅ Ready for production

### You Say "I Like It" When
- 👍 You've tested on release branch
- 👍 Everything works as expected
- 👍 Ready for end users

### Then I'll
- 🚀 Merge to main
- 📦 Update version
- 📝 Add release notes
- 🎉 Announce release

---

## Development Server

### Fixed Port Configuration
The development server is configured to always use port 5173:
- **URL**: http://localhost:5173/Pounce/
- **Configuration**: `strictPort: true` in vite.config.ts
- **Behavior**: Server will fail with clear error if port 5173 is already in use

This ensures a consistent URL for all reviews and testing.
