#!/bin/bash
# Create a new release with semantic versioning

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}Error: Must be on main branch to create release${NC}"
  echo "Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Error: Working directory has uncommitted changes${NC}"
  echo "Please commit or stash changes before creating a release"
  git status -s
  exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Ask for version bump type
echo ""
echo -e "${YELLOW}Select version bump type:${NC}"
echo "1) patch (bug fixes, small changes)     - ${CURRENT_VERSION} -> ${MAJOR}.${MINOR}.$((PATCH+1))"
echo "2) minor (new features, compatible)     - ${CURRENT_VERSION} -> ${MAJOR}.$((MINOR+1)).0"
echo "3) major (breaking changes)             - ${CURRENT_VERSION} -> $((MAJOR+1)).0.0"
echo "4) custom (specify version manually)"
echo ""
read -p "Enter choice [1-4]: " BUMP_TYPE

case $BUMP_TYPE in
  1)
    VERSION_TYPE="patch"
    ;;
  2)
    VERSION_TYPE="minor"
    ;;
  3)
    VERSION_TYPE="major"
    ;;
  4)
    read -p "Enter custom version (e.g., 1.2.3): " CUSTOM_VERSION
    VERSION_TYPE="custom"
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

# Bump version in package.json
if [ "$VERSION_TYPE" = "custom" ]; then
  npm version $CUSTOM_VERSION --no-git-tag-version
else
  npm version $VERSION_TYPE --no-git-tag-version
fi

NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}New version: ${NEW_VERSION}${NC}"

# Get release notes from user
echo ""
echo -e "${YELLOW}Enter release notes (press Ctrl+D when done):${NC}"
RELEASE_NOTES=$(cat)

if [ -z "$RELEASE_NOTES" ]; then
  echo -e "${RED}Error: Release notes cannot be empty${NC}"
  # Revert version change
  git checkout package.json package-lock.json
  exit 1
fi

# Update CHANGELOG.md
DATE=$(date +%Y-%m-%d)

if [ -f "CHANGELOG.md" ]; then
  # Create temp file with new entry
  {
    # Copy everything up to and including the header
    sed -n '1,/^# Changelog/p' CHANGELOG.md
    echo ""
    echo "## [${NEW_VERSION}] - ${DATE}"
    echo ""
    echo "$RELEASE_NOTES"
    echo ""
    # Copy everything after the header (skip first 2 lines which are "# Changelog" and blank line)
    tail -n +3 CHANGELOG.md
  } > CHANGELOG.md.tmp
  mv CHANGELOG.md.tmp CHANGELOG.md
else
  # Create new CHANGELOG.md
  cat > CHANGELOG.md <<EOF
# Changelog

All notable changes to Pounce will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [${NEW_VERSION}] - ${DATE}

${RELEASE_NOTES}
EOF
fi

echo -e "${GREEN}✓ Updated CHANGELOG.md${NC}"

# Commit version bump and changelog
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v${NEW_VERSION}

${RELEASE_NOTES}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo -e "${GREEN}✓ Committed version bump${NC}"

# Create git tag
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}

${RELEASE_NOTES}"
echo -e "${GREEN}✓ Created git tag v${NEW_VERSION}${NC}"

# Push to remote
echo ""
echo -e "${BLUE}Pushing to remote...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"
echo -e "${GREEN}✓ Pushed to remote${NC}"

# Create GitHub release
echo ""
echo -e "${BLUE}Creating GitHub release...${NC}"
gh release create "v${NEW_VERSION}" \
  --title "Release v${NEW_VERSION}" \
  --notes "$RELEASE_NOTES" \
  --latest

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Release v${NEW_VERSION} created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Release URL: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/v${NEW_VERSION}"
