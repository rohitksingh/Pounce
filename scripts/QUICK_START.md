# Slack Approval Workflow - Quick Start Guide

## 30-Second Setup

```bash
# 1. Add your Slack bot token to .env
echo "SLACK_BOT_TOKEN=xoxb-your-token-here" >> .env
echo "SLACK_CHANNEL_ID=feedback" >> .env

# 2. Test the notification
./scripts/notify-slack.sh T007 "Test Feature" ready

# 3. Try the full approval workflow
./scripts/wait-for-approval.sh T007 "My Feature" 5174
```

## Three Usage Patterns

### Pattern 1: Simple Notification (No Approval Needed)

**When to use:** Just notify the team, no approval required.

```bash
./scripts/notify-slack.sh T007 "Feature Complete" done
```

### Pattern 2: Send + Manual Check (Custom Logic)

**When to use:** You need custom logic or want to check manually.

```bash
# Send notification
timestamp=$(./scripts/notify-slack.sh T007 "Review This" ready 5174 2>&1 | tail -n 1)

# Later, check for approval
result=$(./scripts/check-slack-reaction.sh "$timestamp")

if [ "$result" = "approved" ]; then
  # Your custom deployment logic
  npm run deploy
  git push production
fi
```

### Pattern 3: Integrated Workflow (Recommended)

**When to use:** Simple approval gate before deployment.

```bash
# One command - notify and wait for approval
if ./scripts/wait-for-approval.sh T007 "Deploy to Prod" 5174; then
  npm run deploy
  echo "✅ Deployed!"
else
  echo "❌ Deployment cancelled"
fi
```

## Real-World Examples

### Example 1: Feature Review Before Merge

```bash
#!/bin/bash
# review-and-merge.sh

TICKET=$1
FEATURE_NAME=$2

# Start dev server
npm run dev &
SERVER_PID=$!

# Wait for team approval
if ./scripts/wait-for-approval.sh "$TICKET" "$FEATURE_NAME" 5173; then
  echo "✅ Approved! Merging to main..."
  git checkout main
  git merge "$TICKET"
  git push origin main

  # Notify completion
  ./scripts/notify-slack.sh "$TICKET" "$FEATURE_NAME" complete
else
  echo "❌ Changes requested - check Slack feedback"
fi

# Cleanup
kill $SERVER_PID
```

**Usage:**
```bash
./review-and-merge.sh T007 "Slack Polling System"
```

### Example 2: Multi-Stage Deployment

```bash
#!/bin/bash
# deploy-with-approval.sh

TICKET=$1
FEATURE=$2

# Stage 1: Deploy to staging
echo "Deploying to staging..."
npm run deploy:staging

# Stage 2: Wait for approval
echo "Testing at https://staging.example.com"
if ./scripts/wait-for-approval.sh "$TICKET" "$FEATURE (Staging)" 8080; then

  # Stage 3: Deploy to production
  echo "✅ Approved! Deploying to production..."
  npm run deploy:production

  # Stage 4: Notify completion
  ./scripts/notify-slack.sh "$TICKET" "$FEATURE (Production)" complete

  echo "🚀 Deployed to production!"
else
  echo "❌ Production deployment cancelled"
  exit 1
fi
```

**Usage:**
```bash
./deploy-with-approval.sh T007 "New Feature"
```

### Example 3: Automated Testing Gate

```bash
#!/bin/bash
# test-and-approve.sh

TICKET=$1

# Run tests
echo "Running tests..."
if ! npm test; then
  echo "❌ Tests failed - fix before requesting approval"
  exit 1
fi

# Tests passed - request approval
echo "✅ Tests passed! Requesting team review..."
if ./scripts/wait-for-approval.sh "$TICKET" "Ready for Production" 5173; then
  echo "✅ Approved! Proceeding with deployment..."

  # Deploy
  npm run build
  npm run deploy

  # Tag release
  git tag -a "v1.0.0" -m "$TICKET: Release"
  git push --tags
else
  echo "❌ Not approved - deployment cancelled"
fi
```

## Troubleshooting

### "missing_scope" Error

Your bot needs these OAuth scopes:
- `chat:write`
- `channels:history`
- `reactions:read`

**Fix:**
1. Go to https://api.slack.com/apps
2. Select your app
3. Go to "OAuth & Permissions"
4. Add missing scopes
5. Reinstall app to workspace

### "not_in_channel" Error

Bot isn't in the #feedback channel.

**Fix:**
```
In Slack: /invite @YourBotName
```

### No Timestamp Returned

You're using webhook instead of bot token.

**Fix:**
Edit `.env`:
```bash
# Comment out webhook
# SLACK_WEBHOOK_URL=...

# Add bot token
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=feedback
```

## Quick Reference

### All Scripts

| Script | Purpose | Example |
|--------|---------|---------|
| `notify-slack.sh` | Send notification | `./scripts/notify-slack.sh T007 "Feature" ready` |
| `check-slack-reaction.sh` | Poll for reactions | `./scripts/check-slack-reaction.sh 1708012345.123456` |
| `wait-for-approval.sh` | Notify + wait | `./scripts/wait-for-approval.sh T007 "Feature" 5174` |
| `test-approval-workflow.sh` | Test setup | `./scripts/test-approval-workflow.sh` |

### Reaction Meanings

| Reaction | Meaning | Return Value |
|----------|---------|--------------|
| 👍 | Approved | `approved` |
| ✅ | Approved | `approved` |
| 👎 | Changes needed | `rejected` |
| ❌ | Changes needed | `rejected` |

### Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| 0 | Success / Approved |
| 1 | Error / Rejected / Timeout |

## Complete Setup Checklist

- [ ] Create Slack App at https://api.slack.com/apps
- [ ] Add OAuth scopes: `chat:write`, `channels:history`, `reactions:read`
- [ ] Install app to workspace
- [ ] Copy Bot User OAuth Token
- [ ] Add `SLACK_BOT_TOKEN` to `.env`
- [ ] Add `SLACK_CHANNEL_ID` to `.env`
- [ ] Invite bot to channel: `/invite @BotName`
- [ ] Test: `./scripts/test-approval-workflow.sh`
- [ ] React to test message in Slack
- [ ] Verify reaction detected

## Next Steps

Once setup is complete:

1. **Read full documentation:** [README.md](./README.md)
2. **See all examples:** [SLACK_APPROVAL_GUIDE.md](./SLACK_APPROVAL_GUIDE.md)
3. **Review implementation:** [T007_IMPLEMENTATION_SUMMARY.md](./T007_IMPLEMENTATION_SUMMARY.md)

## Support

**Common Issues:**
- Bot scope errors → Add required scopes and reinstall
- Channel not found → Check channel ID or invite bot
- No reactions detected → Verify bot has `reactions:read` scope
- Timeout → Normal after 30 minutes, adjust timing if needed

**Still stuck?**
Check the troubleshooting section in [SLACK_APPROVAL_GUIDE.md](./SLACK_APPROVAL_GUIDE.md)

---

**Quick Start Complete!** You're ready to use Slack approval workflows in your development process.
