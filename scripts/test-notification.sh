#!/bin/bash

################################################################################
# Test Script for Slack Notifications
#
# This script demonstrates what messages will be sent to Slack without
# actually sending them (useful for testing the message format).
#
# Usage:
#   ./scripts/test-notification.sh
#
################################################################################

echo "🎮 Slack Notification Message Preview"
echo "======================================"
echo ""
echo "Example 1: Ready for Review"
echo "----------------------------"
cat << 'EOF'
🎮 *Pounce Dev Update*

*[T006]* Slack notification system
Status: ✅ *Ready for Review*
URL: http://localhost:5173/

Click to test and provide feedback!
EOF

echo ""
echo ""
echo "Example 2: In Progress"
echo "----------------------"
cat << 'EOF'
🎮 *Pounce Dev Update*

*[T007]* New power-up system
Status: 🚧 *In Progress*
URL: http://localhost:5173/

Click to test and provide feedback!
EOF

echo ""
echo ""
echo "Example 3: Completed"
echo "--------------------"
cat << 'EOF'
🎮 *Pounce Dev Update*

*[T008]* Enhanced graphics
Status: 🎉 *Completed*
URL: http://localhost:5173/

Click to test and provide feedback!
EOF

echo ""
echo ""
echo "Example 4: Blocked"
echo "------------------"
cat << 'EOF'
🎮 *Pounce Dev Update*

*[T009]* Multiplayer mode
Status: 🚫 *Blocked*
URL: http://localhost:5173/

Click to test and provide feedback!
EOF

echo ""
echo ""
echo "To send actual notifications:"
echo "  1. Set up .env with SLACK_WEBHOOK_URL"
echo "  2. Run: ./scripts/notify-slack.sh T006 \"Feature Name\" ready"
echo ""
