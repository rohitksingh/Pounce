#!/bin/bash

################################################################################
# Slack Notification Script for Pounce Game Development
#
# Sends formatted notifications to Slack when features are ready for review.
#
# Usage:
#   ./scripts/notify-slack.sh [TICKET_NUMBER] [TITLE] [STATUS] [PORT]
#
# Example:
#   ./scripts/notify-slack.sh T006 "Slack Notifications" "Ready for Review" 5173
#
# Environment Variables:
#   SLACK_WEBHOOK_URL - Required. Set in .env file.
#
# Setup:
#   1. Copy .env.example to .env
#   2. Get webhook URL from https://api.slack.com/messaging/webhooks
#   3. Add SLACK_WEBHOOK_URL to .env
#   4. Run: chmod +x scripts/notify-slack.sh
#
################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to load environment variables
load_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning ".env file not found at $ENV_FILE"
        log_info "Slack notifications are optional. To enable:"
        log_info "  1. Copy .env.example to .env"
        log_info "  2. Add your SLACK_WEBHOOK_URL"
        return 1
    fi

    # Load .env file
    set -a
    source "$ENV_FILE"
    set +a

    if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
        log_warning "SLACK_WEBHOOK_URL not set in .env file"
        log_info "Slack notifications are disabled. Set SLACK_WEBHOOK_URL to enable."
        return 1
    fi

    return 0
}

# Function to send Slack notification
send_notification() {
    local ticket_number="$1"
    local title="$2"
    local status="$3"
    local port="${4:-5173}"

    # Determine status emoji
    local status_emoji="📋"
    case "$status" in
        "Ready for Review"|"ready")
            status_emoji="✅"
            status="Ready for Review"
            ;;
        "In Progress"|"progress")
            status_emoji="🚧"
            status="In Progress"
            ;;
        "Completed"|"complete"|"done")
            status_emoji="🎉"
            status="Completed"
            ;;
        "Blocked"|"blocked")
            status_emoji="🚫"
            status="Blocked"
            ;;
    esac

    # Build the message
    local message="🎮 *Pounce Dev Update*

*[$ticket_number]* $title
Status: $status_emoji *$status*
URL: http://localhost:$port/

Click to test and provide feedback!"

    # Send to Slack
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        "$SLACK_WEBHOOK_URL")

    if [ "$response" = "200" ]; then
        log_success "Slack notification sent successfully!"
        return 0
    else
        log_error "Failed to send Slack notification (HTTP $response)"
        return 1
    fi
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [TICKET_NUMBER] [TITLE] [STATUS] [PORT]

Arguments:
  TICKET_NUMBER  Ticket/task number (e.g., T006)
  TITLE          Feature title
  STATUS         Status (ready/progress/complete/blocked)
  PORT           Dev server port (default: 5173)

Examples:
  $0 T006 "Slack Notifications" ready
  $0 T007 "New Feature" "In Progress" 3000

Status Options:
  ready, "Ready for Review"    → ✅ Ready for Review
  progress, "In Progress"      → 🚧 In Progress
  complete, done, "Completed"  → 🎉 Completed
  blocked, "Blocked"           → 🚫 Blocked

Environment:
  SLACK_WEBHOOK_URL must be set in .env file
EOF
}

# Main script logic
main() {
    # Check arguments
    if [ $# -lt 3 ]; then
        log_error "Missing required arguments"
        echo
        usage
        exit 1
    fi

    local ticket_number="$1"
    local title="$2"
    local status="$3"
    local port="${4:-5173}"

    # Validate ticket number format
    if [[ ! "$ticket_number" =~ ^T[0-9]+$ ]]; then
        log_warning "Ticket number should be in format T### (e.g., T006)"
    fi

    log_info "Preparing Slack notification..."
    log_info "Ticket: $ticket_number"
    log_info "Title: $title"
    log_info "Status: $status"
    log_info "Port: $port"
    echo

    # Load environment variables
    if ! load_env; then
        log_info "Exiting gracefully (Slack notifications are optional)"
        exit 0
    fi

    # Send notification
    if send_notification "$ticket_number" "$title" "$status" "$port"; then
        exit 0
    else
        exit 1
    fi
}

# Handle help flag
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
fi

# Run main function
main "$@"
