#!/bin/bash

################################################################################
# Slack Reaction Polling Script
#
# Polls Slack API to check for reactions on a specific message.
# Implements smart hybrid timing to minimize API calls while staying responsive.
#
# Usage:
#   ./scripts/check-slack-reaction.sh MESSAGE_TIMESTAMP
#
# Example:
#   ./scripts/check-slack-reaction.sh 1708012345.123456
#
# Returns:
#   - "approved"     : Message has 👍 or ✅ reaction (exit code 0)
#   - "rejected"     : Message has 👎 or ❌ reaction (exit code 1)
#   - "timeout"      : 30 minute timeout reached (exit code 2)
#
# Exit Codes:
#   0 - Approved (👍 or ✅ reaction found)
#   1 - Rejected (👎 or ❌ reaction found)
#   2 - Error or timeout (no decision made)
#
# Environment Variables:
#   SLACK_BOT_TOKEN  - Required. OAuth token with channels:history scope
#   SLACK_CHANNEL_ID - Required. Channel ID where message was posted
#
################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Timing configuration (in seconds)
MAX_TIME=1800        # 30 minutes total
FAST_INTERVAL=30     # 0-5 min: check every 30 seconds
SLOW_INTERVAL=300    # 5-30 min: check every 5 minutes
TRANSITION_TIME=300  # Switch to slow interval after 5 minutes

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    echo -e "${BLUE}ℹ${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1" >&2
}

log_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

# Function to load environment variables
load_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found at $ENV_FILE"
        return 1
    fi

    # Load .env file
    set -a
    source "$ENV_FILE"
    set +a

    if [ -z "${SLACK_BOT_TOKEN:-}" ]; then
        log_error "SLACK_BOT_TOKEN not set in .env file"
        return 1
    fi

    if [ -z "${SLACK_CHANNEL_ID:-}" ]; then
        log_error "SLACK_CHANNEL_ID not set in .env file"
        return 1
    fi

    return 0
}

# Function to check for reactions on a message
check_reactions() {
    local message_ts="$1"

    # Call Slack API to get message history
    local response
    response=$(curl -s -X GET \
        "https://slack.com/api/conversations.history?channel=$SLACK_CHANNEL_ID&latest=$message_ts&inclusive=true&limit=1" \
        -H "Authorization: Bearer $SLACK_BOT_TOKEN")

    # Check if API call was successful
    if ! echo "$response" | grep -q '"ok":true'; then
        local error_msg
        error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        log_error "Slack API error: ${error_msg:-Unknown error}"
        return 2
    fi

    # Extract reactions array from the message
    local reactions
    reactions=$(echo "$response" | grep -o '"reactions":\[[^]]*\]' || echo "")

    if [ -z "$reactions" ]; then
        # No reactions yet
        return 1
    fi

    # Check for approval reactions: +1, thumbsup, white_check_mark
    if echo "$reactions" | grep -qE '"name":"(\+1|thumbsup|white_check_mark)"'; then
        echo "approved"
        return 0
    fi

    # Check for rejection reactions: -1, thumbsdown, x
    if echo "$reactions" | grep -qE '"name":"(-1|thumbsdown|x)"'; then
        echo "rejected"
        return 1
    fi

    # Has reactions but none we care about
    return 1
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 MESSAGE_TIMESTAMP

Arguments:
  MESSAGE_TIMESTAMP  Slack message timestamp (e.g., 1708012345.123456)

Returns:
  approved      - Message has approval reaction (👍, ✅) [exit 0]
  rejected      - Message has rejection reaction (👎, ❌) [exit 1]
  timeout       - Polling timeout reached [exit 2]

Environment:
  SLACK_BOT_TOKEN and SLACK_CHANNEL_ID must be set in .env file

Examples:
  ./scripts/check-slack-reaction.sh 1708012345.123456

Timing:
  - 0-5 minutes:  Checks every 30 seconds (responsive)
  - 5-30 minutes: Checks every 5 minutes (efficient)
  - After 30 min: Times out

Approved Reactions: 👍 (+1), 👍 (thumbsup), ✅ (white_check_mark)
Rejected Reactions: 👎 (-1), 👎 (thumbsdown), ❌ (x)
EOF
}

# Function to format time for display
format_time() {
    local seconds=$1
    local minutes=$((seconds / 60))
    local secs=$((seconds % 60))
    printf "%dm %02ds" "$minutes" "$secs"
}

# Main polling logic
poll_for_reaction() {
    local message_ts="$1"
    local elapsed=0
    local interval=$FAST_INTERVAL
    local check_count=0

    log_info "Starting reaction polling (timeout: 30 minutes)"
    log_info "Message timestamp: $message_ts"
    log_info "Polling interval: 30s (0-5min), then 5min (5-30min)"
    echo

    while [ $elapsed -lt $MAX_TIME ]; do
        check_count=$((check_count + 1))
        log_info "Check #$check_count (elapsed: $(format_time $elapsed))"

        # Check for reactions
        local result
        if result=$(check_reactions "$message_ts"); then
            log_success "Reaction detected: $result"
            echo "$result"
            return 0
        fi

        # Switch to slow interval after transition time
        if [ $elapsed -ge $TRANSITION_TIME ] && [ $interval -eq $FAST_INTERVAL ]; then
            interval=$SLOW_INTERVAL
            log_info "Switching to slower polling (every 5 minutes)"
        fi

        # Calculate remaining time
        local remaining=$((MAX_TIME - elapsed))
        if [ $remaining -le $interval ]; then
            log_warning "Less than $(format_time $interval) remaining, timing out"
            break
        fi

        # Sleep for interval
        log_info "Waiting $(format_time $interval) before next check..."
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    # Timeout reached
    log_warning "Polling timeout reached after $(format_time $elapsed)"
    echo "timeout"
    return 2
}

# Main script logic
main() {
    # Check arguments
    if [ $# -lt 1 ]; then
        log_error "Missing required argument: MESSAGE_TIMESTAMP"
        echo
        usage
        exit 1
    fi

    local message_ts="$1"

    # Validate timestamp format (should be like 1708012345.123456)
    if [[ ! "$message_ts" =~ ^[0-9]+\.[0-9]+$ ]]; then
        log_error "Invalid timestamp format. Expected: 1234567890.123456"
        exit 1
    fi

    # Load environment variables
    if ! load_env; then
        log_error "Failed to load environment configuration"
        exit 1
    fi

    # Start polling
    poll_for_reaction "$message_ts"
    exit $?
}

# Handle help flag
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
fi

# Run main function
main "$@"
