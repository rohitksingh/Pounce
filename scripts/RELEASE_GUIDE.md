# Release Guide

Quick reference for creating releases in the Pounce project.

## Prerequisites

1. **On main branch**: `git checkout main && git pull`
2. **Clean working directory**: No uncommitted changes
3. **GitHub CLI installed**: `gh auth status` should show authenticated

## Creating a Release

### Quick Start

```bash
./scripts/create-release.sh
```

Follow the interactive prompts:
1. Select version bump type (1-4)
2. Enter release notes (multi-line, Ctrl+D to finish)
3. Script handles the rest automatically

### Version Selection Guide

**1) Patch** - Bug fixes and minor improvements
- Example: 1.0.0 → 1.0.1
- Use for: Bug fixes, typo corrections, small tweaks
- No new features

**2) Minor** - New features (backward compatible)
- Example: 1.0.0 → 1.1.0
- Use for: New features, enhancements, new capabilities
- Existing functionality still works

**3) Major** - Breaking changes
- Example: 1.0.0 → 2.0.0
- Use for: API changes, major refactors, incompatible updates
- May break existing usage

**4) Custom** - Manually specify version
- Example: Enter "2.0.0-beta.1"
- Use for: Pre-releases, special versions

## Release Notes Format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
### Added
- New feature X
- New capability Y

### Fixed
- Bug Z that caused issue W
- Incorrect behavior in feature Q

### Changed
- Updated component A to use new API
```

**Categories**:
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

## What the Script Does

1. ✅ Validates you're on main branch
2. ✅ Checks for uncommitted changes
3. ✅ Bumps version in package.json
4. ✅ Updates CHANGELOG.md with new entry
5. ✅ Commits changes with release notes
6. ✅ Creates annotated git tag (e.g., v1.0.0)
7. ✅ Pushes commit and tag to remote
8. ✅ Creates GitHub Release with notes

## After Release

The script outputs a GitHub Release URL. You can:

1. **View the release**: Click the URL or visit GitHub Releases page
2. **Edit release notes**: GitHub UI allows editing after creation
3. **Attach assets**: Add build artifacts if needed
4. **Mark as pre-release**: Edit release settings if not production-ready

## Example Session

```bash
$ ./scripts/create-release.sh
Current version: 1.0.0

Select version bump type:
1) patch (bug fixes, small changes)     - 1.0.0 -> 1.0.1
2) minor (new features, compatible)     - 1.0.0 -> 1.1.0
3) major (breaking changes)             - 1.0.0 -> 2.0.0
4) custom (specify version manually)

Enter choice [1-4]: 2
New version: 1.1.0

Enter release notes (press Ctrl+D when done):
### Added
- New power-up system with boost effect
- Sound effects for captures and collisions

### Fixed
- Bug where cats could escape grid boundaries
^D

✓ Updated CHANGELOG.md
✓ Committed version bump
✓ Created git tag v1.1.0
✓ Pushed to remote
✓ Created GitHub release

========================================
Release v1.1.0 created successfully!
========================================

Release URL: https://github.com/rohitksingh/Pounce/releases/tag/v1.1.0
```

## Troubleshooting

### "Must be on main branch"
```bash
git checkout main
git pull origin main
./scripts/create-release.sh
```

### "Working directory has uncommitted changes"
```bash
# Commit your changes first
git add .
git commit -m "Your changes"

# OR stash them
git stash

# Then run release script
./scripts/create-release.sh
```

### "gh command not found"
```bash
# Install GitHub CLI
# macOS:
brew install gh

# Linux:
# See https://github.com/cli/cli#installation

# Authenticate
gh auth login
```

### "npm version failed"
Make sure package.json exists and has valid JSON syntax.

## Manual Release (Not Recommended)

If you need to create a release manually:

```bash
# 1. Update version
npm version minor --no-git-tag-version

# 2. Update CHANGELOG.md manually
# Add new entry with date and notes

# 3. Commit changes
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v1.1.0"

# 4. Create tag
git tag -a v1.1.0 -m "Release v1.1.0"

# 5. Push
git push origin main
git push origin v1.1.0

# 6. Create GitHub release
gh release create v1.1.0 --title "Release v1.1.0" --notes "Release notes here"
```

But seriously, just use `./scripts/create-release.sh` - it's easier and less error-prone!

## Best Practices

1. **Test before release**: Ensure all tests pass
2. **Review changes**: Check `git log` for what's included
3. **Clear notes**: Write helpful release notes for users
4. **Consistent timing**: Release at predictable intervals
5. **Announce releases**: Share with team/users after release

## Version History

See [CHANGELOG.md](../CHANGELOG.md) for complete version history.

## Questions?

- See: `.claude/skills/onboard.md` for project workflow
- CHANGELOG format: https://keepachangelog.com/en/1.0.0/
- Semantic Versioning: https://semver.org/spec/v2.0.0.html
