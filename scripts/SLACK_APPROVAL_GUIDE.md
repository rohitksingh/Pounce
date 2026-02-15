# Slack Approval Workflow - Quick Reference

## Overview

The Pounce project includes a complete Slack-based approval workflow for feature reviews. Team members can react to notifications with 👍 (approve) or 👎 (request changes), and scripts will automatically detect and act on these reactions.

## Three Ways to Use

### 1. Simple Notification (One-Way)

Just send a notification to Slack without waiting for reactions:

```bash
./scripts/notify-slack.sh T007 "Feature Title" ready 5174
```

**Use when:** You just want to notify the team, no approval needed.

### 2. Manual Reaction Check

Send notification, then manually poll for reactions:

```bash
# Step 1: Send notification and capture timestamp
timestamp=$(./scripts/notify-slack.sh T007 "Feature" ready 5174 2>&1 | tail -n 1)

# Step 2: Poll for reactions
result=$(./scripts/check-slack-reaction.sh "$timestamp")

# Step 3: Act on result
if [ "$result" = "approved" ]; then
  echo "Approved! Deploying..."
  npm run deploy
fi
```

**Use when:** You need custom logic or want to separate the steps.

### 3. Integrated Workflow (Recommended)

Single command that sends notification and waits for approval:

```bash
if ./scripts/wait-for-approval.sh T007 "Feature Title" 5174; then
  echo "Approved! Proceeding..."
  npm run deploy
else
  echo "Changes requested or timeout"
fi
```

**Use when:** You want a simple, automated approval workflow.

## Quick Start

### 1. Configure Slack Bot Token

Edit `/Users/rohit/workspace/Pounce/.env`:

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL_ID=feedback
```

### 2. Test the Workflow

```bash
# Run automated test
./scripts/test-approval-workflow.sh

# Or test manually
./scripts/wait-for-approval.sh T007 "Test Feature" 5174
```

### 3. React in Slack

Once the message is posted:
- React with 👍 to approve
- React with 👎 to request changes
- Wait 30 minutes for automatic timeout

## Timing Details

The polling system uses smart hybrid timing:

| Time Range | Check Interval | Rationale |
|------------|----------------|-----------|
| 0-5 min | 30 seconds | Fast response for quick reviews |
| 5-30 min | 5 minutes | Efficient for longer reviews |
| 30+ min | Timeout | Prevents infinite waiting |

**Total API Calls:** Maximum ~70 calls over 30 minutes
- First 5 min: 10 calls (every 30s)
- Next 25 min: 5 calls (every 5m)

## Supported Reactions

### Approval Reactions ✅

- 👍 (`:+1:` or `:thumbsup:`)
- ✅ (`:white_check_mark:`)

### Rejection Reactions ❌

- 👎 (`:-1:` or `:thumbsdown:`)
- ❌ (`:x:`)

## Return Values

### check-slack-reaction.sh

| Return Value | Exit Code | Meaning |
|--------------|-----------|---------|
| `approved` | 0 | Approval reaction detected |
| `rejected` | 0 | Rejection reaction detected |
| `no_reaction` | 1 | 30 min timeout, no reactions |
| `timeout` | 1 | Polling timeout |

### wait-for-approval.sh

| Exit Code | Meaning |
|-----------|---------|
| 0 | Approved (👍) |
| 1 | Rejected (👎), timeout, or error |

## Integration Examples

### CI/CD Pipeline

```bash
#!/bin/bash
# deploy.sh

# Wait for approval before deploying
if ./scripts/wait-for-approval.sh "$TICKET_ID" "$FEATURE_NAME" "$PORT"; then
  echo "Approved! Starting deployment..."
  npm run build
  npm run deploy

  # Notify success
  ./scripts/notify-slack.sh "$TICKET_ID" "$FEATURE_NAME" "complete"
else
  echo "Deployment cancelled (not approved)"
  exit 1
fi
```

### Development Workflow

```bash
#!/bin/bash
# feature-review.sh

TICKET=$1
TITLE=$2
PORT=${3:-5173}

# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait for approval
if ./scripts/wait-for-approval.sh "$TICKET" "$TITLE" "$PORT"; then
  echo "Feature approved! Merging to main..."
  git checkout main
  git merge "$TICKET"
  git push
else
  echo "Changes requested. Please review feedback."
fi

# Stop dev server
kill $DEV_PID
```

### Manual Testing Script

```bash
#!/bin/bash
# test-feature.sh

# Send notification
echo "Sending notification to Slack..."
timestamp=$(./scripts/notify-slack.sh T007 "New Feature" ready 5174 2>&1 | tail -n 1)

echo "Message timestamp: $timestamp"
echo "Please test at http://localhost:5174"
echo "React in Slack when ready..."

# Wait for reaction with timeout
timeout 600 ./scripts/check-slack-reaction.sh "$timestamp" || {
  echo "Timeout after 10 minutes"
  exit 1
}
```

## Troubleshooting

### "SLACK_BOT_TOKEN not set"

Make sure `.env` contains:
```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=feedback
```

### "Slack API error: invalid_auth"

- Verify bot token is correct (starts with `xoxb-`)
- Check token hasn't expired or been revoked
- Ensure app is installed to workspace

### "Slack API error: channel_not_found"

- Verify `SLACK_CHANNEL_ID` is correct (e.g., `feedback`, `C1234567890`)
- Ensure bot is invited to the channel
- Try using channel ID instead of name

### "No timestamp returned"

- Check you're using `SLACK_BOT_TOKEN`, not just `SLACK_WEBHOOK_URL`
- Webhook mode doesn't support reactions
- Verify API call succeeded (check logs)

### "Polling never detects reactions"

- Verify bot has `reactions:read` scope
- Check message timestamp is correct
- Ensure you're reacting to the right message
- Try restarting the polling script

## Security Notes

### Bot Token Security

- **Never commit** `.env` to version control (it's in `.gitignore`)
- **Rotate tokens** if accidentally exposed
- **Use minimal scopes** required for functionality:
  - `chat:write` - Post messages
  - `channels:history` - Read message history
  - `reactions:read` - Read reactions

### Channel Privacy

- Use private channels for sensitive features
- Limit bot access to specific channels
- Review bot permissions regularly

## Performance Considerations

### API Rate Limits

Slack allows approximately:
- **Tier 1:** 1 request per second
- **Tier 2:** ~20 requests per minute
- **Tier 3:** ~50 requests per minute

Our polling script makes:
- **Fast phase (0-5 min):** 1 request per 30 seconds = 2/min
- **Slow phase (5-30 min):** 1 request per 5 minutes = 0.2/min

Well within rate limits for all tiers.

### Token Efficiency

- **Polling uses zero Claude tokens** (pure bash)
- **Only API costs** are Slack rate limits
- **No external dependencies** required

## Advanced Usage

### Custom Polling Intervals

Edit `/Users/rohit/workspace/Pounce/scripts/check-slack-reaction.sh`:

```bash
# Timing configuration (in seconds)
MAX_TIME=1800        # 30 minutes total
FAST_INTERVAL=30     # 0-5 min: check every 30 seconds
SLOW_INTERVAL=300    # 5-30 min: check every 5 minutes
TRANSITION_TIME=300  # Switch to slow interval after 5 minutes
```

### Multiple Channel Support

You can override the channel for specific notifications:

```bash
# Temporarily override channel
SLACK_CHANNEL_ID=releases ./scripts/notify-slack.sh T007 "Release" ready
```

### Custom Reaction Detection

Edit the reaction check patterns in `check-slack-reaction.sh`:

```bash
# Check for approval reactions
if echo "$reactions" | grep -qE '"name":"(heart|rocket|tada)"'; then
    echo "approved"
    return 0
fi
```

## Files Reference

| File | Purpose | Size |
|------|---------|------|
| `notify-slack.sh` | Send notifications (webhook or bot API) | 7.6K |
| `check-slack-reaction.sh` | Poll for reactions on message | 6.7K |
| `wait-for-approval.sh` | Integrated notification + polling | 5.0K |
| `test-approval-workflow.sh` | Test the complete workflow | 3.1K |
| `README.md` | Comprehensive documentation | Updated |
| `SLACK_APPROVAL_GUIDE.md` | This guide | This file |

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main README: `/Users/rohit/workspace/Pounce/scripts/README.md`
3. Test with `test-approval-workflow.sh`
4. Check Slack API docs: https://api.slack.com/

---

**Built for Pounce Game Development** | Last Updated: 2026-02-15
