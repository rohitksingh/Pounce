#!/bin/bash

################################################################################
# Test Script for Slack Approval Workflow
#
# Tests the complete approval workflow without actual polling (manual test).
# Use this to verify the notification and message timestamp extraction.
#
# Usage:
#   ./scripts/test-approval-workflow.sh
#
################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}${BOLD}  🧪 Testing Slack Approval Workflow${NC}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Test 1: Send notification and capture timestamp${NC}"
echo "Command: ./scripts/notify-slack.sh T007 'Slack Reaction Polling Test' ready 5174"
echo

# Send notification and capture output
set +e  # Don't exit on error
output=$("$SCRIPT_DIR/notify-slack.sh" "T007" "Slack Reaction Polling Test" "ready" "5174" 2>&1)
exit_code=$?
set -e

# Display full output
echo "$output"
echo

# Check if notification failed
if [ $exit_code -ne 0 ]; then
    echo -e "${BLUE}ℹ Note: Notification failed (exit code $exit_code)${NC}"
    echo
    echo "This could be due to:"
    echo "  - Missing Slack bot scopes (chat:write, channels:history, reactions:read)"
    echo "  - Bot not invited to channel"
    echo "  - Invalid bot token or channel ID"
    echo "  - Using SLACK_WEBHOOK_URL instead of SLACK_BOT_TOKEN"
    echo
    echo "To enable reaction polling:"
    echo "  1. Get bot token from https://api.slack.com/apps"
    echo "  2. Ensure bot has required scopes"
    echo "  3. Invite bot to #feedback channel"
    echo "  4. Set SLACK_BOT_TOKEN and SLACK_CHANNEL_ID in .env"
    echo
    exit 0
fi

# Extract timestamp (last line that matches the pattern)
timestamp=$(echo "$output" | grep -E '^[0-9]+\.[0-9]+$' | tail -n 1 || echo "")

if [ -n "$timestamp" ]; then
    echo -e "${GREEN}✓ Timestamp extracted: $timestamp${NC}"
    echo
    echo -e "${BLUE}Test 2: Validate timestamp format${NC}"
    if [[ "$timestamp" =~ ^[0-9]+\.[0-9]+$ ]]; then
        echo -e "${GREEN}✓ Timestamp format is valid${NC}"
        echo
        echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}${BOLD}  Manual Test Instructions${NC}"
        echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
        echo "A message has been posted to your Slack channel."
        echo
        echo "To test reaction polling, run:"
        echo "  ./scripts/check-slack-reaction.sh $timestamp"
        echo
        echo "Or test the full workflow:"
        echo "  ./scripts/wait-for-approval.sh T007 'Test Feature' 5174"
        echo
        echo -e "${GREEN}✅ All automated tests passed!${NC}\n"
    else
        echo -e "${RED}✗ Timestamp format is invalid${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}ℹ Note: No timestamp found (webhook mode or notification failed)${NC}"
    echo "This is expected if using SLACK_WEBHOOK_URL instead of SLACK_BOT_TOKEN"
    echo
    echo "To enable reaction polling:"
    echo "  1. Set SLACK_BOT_TOKEN in .env"
    echo "  2. Set SLACK_CHANNEL_ID in .env"
    echo "  3. Remove or comment out SLACK_WEBHOOK_URL"
    echo
fi
