# Pounce Development Scripts

This directory contains helper scripts for the Pounce game development workflow.

## Available Scripts

### notify-slack.sh

Sends formatted notifications to Slack when features are ready for review.

#### Quick Start

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

3. **Send Your First Notification**
   ```bash
   ./scripts/notify-slack.sh T006 "Slack Notifications" ready
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

Slack receives messages in this format:

```
🎮 *Pounce Dev Update*

*[T006]* Slack notification system
Status: ✅ *Ready for Review*
URL: http://localhost:5173/

Click to test and provide feedback!
```

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
# Required
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional (for future enhancements)
SLACK_CHANNEL=#general
SLACK_USERNAME=Pounce Bot
```

## Contributing

When adding new scripts:
1. Add executable permissions: `chmod +x scripts/your-script.sh`
2. Include a header comment with usage instructions
3. Update this README
4. Test error cases and edge conditions

---

**Built for the Pounce Game Development Team**
