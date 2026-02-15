#!/bin/bash

################################################################################
# Slack Approval Workflow Script
#
# Sends a Slack notification and waits for approval/rejection via reactions.
# Integrates notify-slack.sh and check-slack-reaction.sh into a single workflow.
#
# Usage:
#   ./scripts/wait-for-approval.sh TICKET_NUMBER TITLE [PORT]
#
# Example:
#   ./scripts/wait-for-approval.sh T007 "Slack Reaction Polling" 5174
#
# Returns:
#   - Exit 0: Approved (👍)
#   - Exit 1: Rejected (👎) or timeout
#
# Environment Variables:
#   SLACK_BOT_TOKEN  - Required. OAuth token for posting and checking reactions
#   SLACK_CHANNEL_ID - Required. Channel ID for notifications
#
################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_header() {
    echo -e "\n${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 TICKET_NUMBER TITLE [PORT]

Arguments:
  TICKET_NUMBER  Task/ticket ID (e.g., T007)
  TITLE          Feature title
  PORT           Dev server port (default: 5173)

Examples:
  $0 T007 "Slack Reaction Polling" 5174
  $0 T008 "New Feature"

Workflow:
  1. Sends Slack notification to #feedback channel
  2. Waits for team reaction (👍 or 👎)
  3. Returns approval status

Exit Codes:
  0 - Approved (👍)
  1 - Rejected (👎) or timeout

Environment:
  SLACK_BOT_TOKEN and SLACK_CHANNEL_ID must be set in .env file

Timing:
  - 0-5 minutes:  Checks every 30 seconds
  - 5-30 minutes: Checks every 5 minutes
  - After 30 min: Times out
EOF
}

# Main workflow
main() {
    # Check arguments
    if [ $# -lt 2 ]; then
        log_error "Missing required arguments"
        echo
        usage
        exit 1
    fi

    local ticket_number="$1"
    local title="$2"
    local port="${3:-5173}"

    log_header "🎮 Pounce Feature Approval Workflow"

    log_info "Ticket: $ticket_number"
    log_info "Title: $title"
    log_info "Port: $port"
    echo

    # Step 1: Send notification
    log_header "📤 Step 1: Sending Slack Notification"

    local message_ts
    message_ts=$("$SCRIPT_DIR/notify-slack.sh" "$ticket_number" "$title" "ready" "$port" 2>&1 | tail -n 1)

    # Check if notification was sent successfully
    if [ -z "$message_ts" ] || [[ ! "$message_ts" =~ ^[0-9]+\.[0-9]+$ ]]; then
        log_error "Failed to send Slack notification or extract message timestamp"
        log_error "Output: $message_ts"
        exit 1
    fi

    log_success "Notification sent successfully!"
    log_info "Message timestamp: $message_ts"
    echo

    # Step 2: Wait for reaction
    log_header "⏳ Step 2: Waiting for Team Approval"

    log_info "React with 👍 to approve or 👎 to request changes"
    log_info "Polling will timeout after 30 minutes"
    echo

    local result
    if result=$("$SCRIPT_DIR/check-slack-reaction.sh" "$message_ts"); then
        echo

        case "$result" in
            "approved")
                log_header "✅ APPROVED"
                log_success "Feature has been approved by the team!"
                log_info "You can proceed with deployment or next steps"
                exit 0
                ;;
            "rejected")
                log_header "❌ CHANGES REQUESTED"
                log_warning "Feature needs changes before approval"
                log_info "Please review feedback and make necessary updates"
                exit 1
                ;;
            *)
                log_error "Unexpected result: $result"
                exit 1
                ;;
        esac
    else
        echo

        # Check what result we got on failure
        case "$result" in
            "timeout")
                log_header "⏱️  TIMEOUT"
                log_warning "No reaction received within 30 minutes"
                log_info "You can manually check Slack for feedback"
                exit 1
                ;;
            *)
                log_error "Polling failed with result: $result"
                exit 1
                ;;
        esac
    fi
}

# Handle help flag
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
fi

# Run main function
main "$@"
