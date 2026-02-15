# Pounce Development Scripts

This directory contains helper scripts for the Pounce game development workflow.

## Overview

The Pounce development workflow includes three complementary scripts for Slack integration:

1. **notify-slack.sh** - Send notifications to Slack (webhook or bot API)
2. **check-slack-reaction.sh** - Poll for reactions on a message (bot API only)
3. **wait-for-approval.sh** - Integrated workflow: notify + wait for approval

### Bot API vs Webhook

**Webhook URL (Simple):**
- ✅ Easy to set up
- ✅ Good for one-way notifications
- ❌ Cannot read reactions
- Use: `SLACK_WEBHOOK_URL` in .env

**Bot Token (Advanced):**
- ✅ Can post messages and read reactions
- ✅ Enables interactive approval workflows
- ✅ Supports reaction polling
- ❌ Requires more setup (OAuth app, scopes)
- Use: `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID` in .env

The scripts automatically detect which method to use based on your .env configuration.

**🚀 New to Slack integration? Start here:** [QUICK_START.md](./QUICK_START.md)
**📖 Complete guide with examples:** [SLACK_APPROVAL_GUIDE.md](./SLACK_APPROVAL_GUIDE.md)

## Available Scripts

### notify-slack.sh

Sends formatted notifications to Slack when features are ready for review. Supports both webhook (simple) and bot API (with reactions) methods.

#### Quick Start

**Option 1: Webhook (Simple, No Reactions)**

1. **Get a Slack Webhook URL**
   ```bash
   # Visit: https://api.slack.com/messaging/webhooks
   # Create a webhook and copy the URL
   ```

2. **Configure Environment**
   ```bash
   # From project root
   cp .env.example .env

   # Edit .env and add:
   # SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

**Option 2: Bot Token (Advanced, Supports Reactions)**

1. **Create a Slack App**
   ```bash
   # Visit: https://api.slack.com/apps
   # Create new app, install to workspace
   # Copy Bot User OAuth Token (starts with xoxb-)
   ```

2. **Configure Environment**
   ```bash
   # Edit .env and add:
   # SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   # SLACK_CHANNEL_ID=feedback
   ```

3. **Send Your First Notification**
   ```bash
   ./scripts/notify-slack.sh T006 "Slack Notifications" ready
   # Returns message timestamp if using bot API
   ```

#### Usage

```bash
./scripts/notify-slack.sh [TICKET_NUMBER] [TITLE] [STATUS] [PORT]
```

**Arguments:**
- `TICKET_NUMBER` - Task/ticket ID (e.g., T006)
- `TITLE` - Feature or task title
- `STATUS` - Current status (see Status Options below)
- `PORT` - (Optional) Dev server port, defaults to 5173

**Status Options:**

| Input | Output | Emoji |
|-------|--------|-------|
| `ready`, `"Ready for Review"` | Ready for Review | ✅ |
| `progress`, `"In Progress"` | In Progress | 🚧 |
| `complete`, `done`, `"Completed"` | Completed | 🎉 |
| `blocked`, `"Blocked"` | Blocked | 🚫 |

#### Examples

```bash
# Feature ready for review on default port (5173)
./scripts/notify-slack.sh T006 "Slack Notifications" ready

# Work in progress
./scripts/notify-slack.sh T007 "Power-up System" progress

# Completed feature
./scripts/notify-slack.sh T008 "New Graphics" complete

# Custom port (3000)
./scripts/notify-slack.sh T009 "API Integration" ready 3000

# Multi-word title (use quotes)
./scripts/notify-slack.sh T010 "Enhanced UI with animations" ready
```

#### Message Format

**Webhook Mode:**
```
🎮 *Pounce Dev Update*

*[T006]* Slack notification system
Status: ✅ *Ready for Review*
URL: http://localhost:5173/

Click to test and provide feedback!
```

**Bot API Mode (with reactions):**
```
🎮 *Pounce Dev Update*

*[T006]* Slack notification system
Status: ✅ *Ready for Review*
URL: http://localhost:5173/

React with 👍 to approve or 👎 if changes needed!
```

#### Return Value

When using bot API, the script outputs the message timestamp to stdout:
```bash
message_ts=$(./scripts/notify-slack.sh T007 "Feature" ready 2>&1 | tail -n 1)
echo $message_ts  # 1708012345.123456
```

This timestamp can be used with `check-slack-reaction.sh` to poll for reactions.

#### Features

- **Graceful Degradation**: If `.env` is missing or `SLACK_WEBHOOK_URL` is not set, the script exits gracefully with helpful messages
- **Error Handling**: Validates arguments and provides clear error messages
- **Colored Output**: Terminal output uses colors for better readability
- **Flexible Status Input**: Accepts short forms (`ready`) or full text (`"Ready for Review"`)
- **Help Documentation**: Run with `--help` or `-h` flag for usage information

#### Troubleshooting

**"SLACK_WEBHOOK_URL not set"**
- Make sure you copied `.env.example` to `.env`
- Add your webhook URL to the `.env` file
- Ensure the URL format is: `https://hooks.slack.com/services/...`

**"Failed to send Slack notification"**
- Check your internet connection
- Verify the webhook URL is correct
- Ensure the webhook hasn't been revoked in Slack settings

**Script not executable**
```bash
chmod +x scripts/notify-slack.sh
```

#### Security Notes

- Never commit `.env` to version control (it's in `.gitignore`)
- Share `.env.example` instead, without actual secrets
- Rotate webhook URLs if they're accidentally exposed

---

### test-notification.sh

Preview what Slack messages will look like without actually sending them.

#### Usage

```bash
./scripts/test-notification.sh
```

This displays example messages for all status types (Ready, In Progress, Completed, Blocked).

---

### check-slack-reaction.sh

Polls Slack API to check for reactions on a specific message. Implements smart hybrid timing to minimize API calls while staying responsive.

#### Quick Start

1. **Configure Bot Token**
   ```bash
   # Edit .env and add:
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_CHANNEL_ID=feedback
   ```

2. **Use with Message Timestamp**
   ```bash
   ./scripts/check-slack-reaction.sh 1708012345.123456
   ```

#### Usage

```bash
./scripts/check-slack-reaction.sh MESSAGE_TIMESTAMP
```

**Arguments:**
- `MESSAGE_TIMESTAMP` - Slack message timestamp (format: 1234567890.123456)

**Returns:**
- `approved` - Message has approval reaction (👍, ✅)
- `rejected` - Message has rejection reaction (👎, ❌)
- `no_reaction` - No relevant reactions found (30 min timeout)
- `timeout` - Polling timeout reached

#### Polling Strategy

Smart hybrid timing to balance responsiveness and API efficiency:

- **0-5 minutes:** Check every 30 seconds (responsive)
- **5-30 minutes:** Check every 5 minutes (efficient)
- **After 30 min:** Timeout

This approach minimizes API calls while ensuring fast response to early reactions.

#### Approved Reactions

- 👍 (`:+1:`, `:thumbsup:`)
- ✅ (`:white_check_mark:`)

#### Rejected Reactions

- 👎 (`:-1:`, `:thumbsdown:`)
- ❌ (`:x:`)

#### Examples

```bash
# Check a specific message
./scripts/check-slack-reaction.sh 1708012345.123456

# Capture the result
result=$(./scripts/check-slack-reaction.sh 1708012345.123456)
if [ "$result" = "approved" ]; then
  echo "Feature approved!"
fi
```

#### Features

- **Smart Timing:** Adaptive polling intervals for efficiency
- **Pure Bash:** No external dependencies (Claude tokens not consumed)
- **Error Handling:** Validates API responses and handles network errors
- **Progress Updates:** Shows elapsed time and check count
- **Timeout Protection:** Automatically stops after 30 minutes

---

### wait-for-approval.sh

Integrates notification sending and reaction polling into a single approval workflow. Perfect for interactive development where you need team sign-off.

#### Quick Start

```bash
# Send notification and wait for approval
./scripts/wait-for-approval.sh T007 "Feature Title" 5174
```

#### Usage

```bash
./scripts/wait-for-approval.sh TICKET_NUMBER TITLE [PORT]
```

**Arguments:**
- `TICKET_NUMBER` - Task/ticket ID (e.g., T007)
- `TITLE` - Feature title
- `PORT` - Dev server port (default: 5173)

**Exit Codes:**
- `0` - Approved (👍)
- `1` - Rejected (👎) or timeout

#### Workflow

1. **Send Notification:** Posts feature to #feedback channel
2. **Wait for Reaction:** Polls for team approval/rejection
3. **Return Status:** Exits with appropriate code

#### Examples

```bash
# Basic usage
./scripts/wait-for-approval.sh T007 "Slack Polling System"

# With custom port
./scripts/wait-for-approval.sh T008 "New Feature" 3000

# Use in automation
if ./scripts/wait-for-approval.sh T009 "API Update" 5174; then
  echo "Approved! Proceeding with deployment..."
  npm run deploy
else
  echo "Changes requested or timeout"
  exit 1
fi
```

#### Features

- **All-in-One:** Single command for notification + approval
- **Visual Feedback:** Colored output with progress headers
- **Robust Error Handling:** Validates each step
- **Scriptable:** Exit codes for automation
- **Token Efficient:** Pure bash polling (no Claude tokens)

#### Sample Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎮 Pounce Feature Approval Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Ticket: T007
ℹ Title: Slack Reaction Polling
ℹ Port: 5174

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📤 Step 1: Sending Slack Notification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Slack notification sent successfully!
ℹ Message timestamp: 1708012345.123456

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⏳ Step 2: Waiting for Team Approval
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ React with 👍 to approve or 👎 to request changes
ℹ Polling will timeout after 30 minutes

ℹ Check #1 (elapsed: 0m 00s)
ℹ Waiting 0m 30s before next check...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ APPROVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Feature has been approved by the team!
ℹ You can proceed with deployment or next steps
```

---

## Integration with CI/CD

You can integrate the notification script into your deployment pipeline:

```bash
# In your CI/CD script
if [ "$CI_BRANCH" = "release" ]; then
  ./scripts/notify-slack.sh "$TICKET_ID" "$FEATURE_NAME" ready
fi
```

## Environment Variables

Create a `.env` file in the project root with:

```bash
# Option 1: Webhook (Simple, no reactions)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Option 2: Bot Token (Advanced, supports reactions)
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL_ID=feedback

# Optional (for future enhancements)
SLACK_CHANNEL=#general
SLACK_USERNAME=Pounce Bot
```

### Required Slack Bot Scopes

If using bot token, your Slack app needs these OAuth scopes:

- `chat:write` - Post messages
- `channels:history` - Read message history
- `reactions:read` - Read reactions on messages

### Finding Your Channel ID

```bash
# Method 1: Right-click channel in Slack → View channel details → Copy ID
# Method 2: Use Slack API
curl -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  "https://slack.com/api/conversations.list" | grep -A 2 '"name":"feedback"'
```

## Contributing

When adding new scripts:
1. Add executable permissions: `chmod +x scripts/your-script.sh`
2. Include a header comment with usage instructions
3. Update this README
4. Test error cases and edge conditions

---

**Built for the Pounce Game Development Team**
