# Slack Approval System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Pounce Developer                            │
│                      (Triggers approval workflow)                    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ ./scripts/wait-for-approval.sh T007 "Feature" 5174
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     wait-for-approval.sh                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 1. Validate inputs                                            │  │
│  │ 2. Call notify-slack.sh                                       │  │
│  │ 3. Capture message timestamp                                 │  │
│  │ 4. Call check-slack-reaction.sh                              │  │
│  │ 5. Return approval status                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┬───────────────────┘
                 │                                │
                 │ Step 2                         │ Step 4
                 ▼                                ▼
┌─────────────────────────────┐    ┌─────────────────────────────────┐
│   notify-slack.sh           │    │   check-slack-reaction.sh       │
│  ┌──────────────────────┐   │    │  ┌──────────────────────────┐   │
│  │ 1. Load .env         │   │    │  │ 1. Load .env             │   │
│  │ 2. Format message    │   │    │  │ 2. Start polling loop    │   │
│  │ 3. Detect method:    │   │    │  │ 3. Call Slack API        │   │
│  │    - Bot API  ✓      │   │    │  │ 4. Parse reactions       │   │
│  │    - Webhook         │   │    │  │ 5. Check for 👍/👎       │   │
│  │ 4. Send to Slack     │   │    │  │ 6. Return status         │   │
│  │ 5. Return timestamp  │   │    │  └──────────────────────────┘   │
│  └──────────────────────┘   │    └─────────────────────────────────┘
└──────────────┬──────────────┘                   │
               │                                  │
               │ POST chat.postMessage            │ GET conversations.history
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Slack API                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Endpoints:                                                    │  │
│  │  • chat.postMessage - Send message, return timestamp         │  │
│  │  • conversations.history - Get message with reactions        │  │
│  │                                                               │  │
│  │ Authentication: Bearer xoxb-... (Bot Token)                  │  │
│  │                                                               │  │
│  │ Required Scopes:                                             │  │
│  │  • chat:write - Post messages                                │  │
│  │  • channels:history - Read message history                   │  │
│  │  • reactions:read - Read reactions                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ Message posted to channel
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Slack Channel (#feedback)                        │
│                                                                       │
│  🎮 *Pounce Dev Update*                                              │
│                                                                       │
│  *[T007]* Slack Reaction Polling                                     │
│  Status: ✅ *Ready for Review*                                       │
│  URL: http://localhost:5174/                                         │
│                                                                       │
│  React with 👍 to approve or 👎 if changes needed!                  │
│                                                                       │
│  Reactions: 👍 (2) 👎 (0) ✅ (1)                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ Team members react
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Team Members                                 │
│  👤 Alice: 👍    👤 Bob: 👍    👤 Charlie: ✅                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Polling Flow Diagram

```
Start Polling
     │
     ├─ elapsed = 0
     ├─ interval = 30 (seconds)
     ├─ max_time = 1800 (30 minutes)
     │
     ▼
┌────────────────────────────────┐
│  Check: elapsed < max_time?    │
└────────┬───────────────────────┘
         │ Yes
         ▼
┌────────────────────────────────┐
│  Call Slack API                │
│  GET conversations.history     │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Parse reactions array         │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Check for approval reactions? │
│  (+1, thumbsup, white_check)   │
└────┬───────────┬───────────────┘
     │ Yes       │ No
     │           ▼
     │      ┌────────────────────────────────┐
     │      │  Check for reject reactions?   │
     │      │  (-1, thumbsdown, x)           │
     │      └────┬───────────┬───────────────┘
     │           │ Yes       │ No
     │           │           ▼
     │           │      ┌────────────────────────────┐
     │           │      │  Adjust interval?          │
     │           │      │  (elapsed > 300 sec)       │
     │           │      └────┬───────────────────────┘
     │           │           │ Yes: interval = 300
     │           │           │ No: keep interval = 30
     │           │           ▼
     │           │      ┌────────────────────────────┐
     │           │      │  Sleep for interval        │
     │           │      └────┬───────────────────────┘
     │           │           │
     │           │           ├─ elapsed += interval
     │           │           │
     │           │           └─ Loop back to top
     │           │
     │           ▼
     │      Return "rejected"
     │
     ▼
Return "approved"

                               ┌─────────────────────┐
                               │  Timeout reached?   │
                               └────┬────────────────┘
                                    │ elapsed >= max_time
                                    ▼
                               Return "no_reaction"
```

## Timing Strategy

```
┌──────────────────────────────────────────────────────────────────────┐
│                        30 Minute Timeline                             │
├──────────────┬────────────────────────────────────────────────────────┤
│              │                                                        │
│   0-5 min    │  Fast Polling (30 second intervals)                   │
│              │  ─────────────────────────────────────                 │
│              │  Rationale: Quick team reviews                         │
│              │  API Calls: ~10 calls                                  │
│              │                                                        │
├──────────────┼────────────────────────────────────────────────────────┤
│              │                                                        │
│  5-30 min    │  Slow Polling (5 minute intervals)                    │
│              │  ────────────────────────────────────────────────────  │
│              │  Rationale: Thorough reviews, API efficiency          │
│              │  API Calls: ~5 calls                                   │
│              │                                                        │
├──────────────┼────────────────────────────────────────────────────────┤
│              │                                                        │
│   30+ min    │  Timeout                                               │
│              │  ────────                                              │
│              │  Rationale: Prevent infinite waiting                   │
│              │  Action: Return "no_reaction"                          │
│              │                                                        │
└──────────────┴────────────────────────────────────────────────────────┘

Total API Calls: Maximum 15 over 30 minutes
Average: 0.5 calls/minute
Peak: 2 calls/minute (first 5 min)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Input (Developer)                                                 │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ Ticket Number: "T007"
         ├─ Feature Title: "Slack Polling System"
         ├─ Port: 5174
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Environment (.env)                                                │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ SLACK_BOT_TOKEN: "xoxb-..."
         ├─ SLACK_CHANNEL_ID: "feedback"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Message Construction                                              │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ Emoji: ✅ (based on status)
         ├─ Message: "🎮 *Pounce Dev Update*\n[T007]..."
         ├─ URL: "http://localhost:5174/"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Slack API Request                                                 │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ Endpoint: POST chat.postMessage
         ├─ Headers: Authorization: Bearer xoxb-...
         ├─ Body: {"channel": "feedback", "text": "..."}
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. Slack API Response                                                │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ ok: true
         ├─ ts: "1708012345.123456" ◄── Message Timestamp
         ├─ channel: "C1234567890"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. Polling Request (Loop)                                            │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ Endpoint: GET conversations.history
         ├─ Params: channel=feedback, latest=1708012345.123456
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. Message with Reactions                                            │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ ok: true
         ├─ messages: [
         │     {
         │       "ts": "1708012345.123456",
         │       "reactions": [
         │         {"name": "+1", "count": 2, "users": ["U123", "U456"]},
         │         {"name": "white_check_mark", "count": 1, "users": ["U789"]}
         │       ]
         │     }
         │   ]
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. Reaction Parsing                                                  │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ Extract: reactions array
         ├─ Match: grep -qE '"name":"(\+1|thumbsup|white_check_mark)"'
         ├─ Result: MATCH FOUND
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. Output (to Developer)                                             │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ Status: "approved"
         ├─ Exit Code: 0
         ├─ Message: "✅ APPROVED - Feature has been approved!"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 10. Automation Action                                                │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─ Deploy to production
         ├─ Merge to main
         ├─ Tag release
         └─ Notify completion
```

## Component Responsibilities

```
┌─────────────────────────────────────────────────────────────────────┐
│ notify-slack.sh                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ Responsibilities:                                                    │
│  • Load environment variables from .env                              │
│  • Validate SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL                    │
│  • Format status emoji based on status input                         │
│  • Construct message with ticket, title, URL                         │
│  • Choose notification method (bot API vs webhook)                   │
│  • Send to Slack API                                                 │
│  • Extract and return message timestamp                              │
│  • Handle errors with helpful messages                               │
│                                                                       │
│ Inputs:                                                              │
│  • Ticket number (T007)                                              │
│  • Feature title                                                     │
│  • Status (ready/progress/complete/blocked)                          │
│  • Port (default: 5173)                                              │
│                                                                       │
│ Outputs:                                                             │
│  • Message timestamp (stdout)                                        │
│  • Log messages (stderr)                                             │
│  • Exit code (0=success, 1=error)                                    │
│                                                                       │
│ Dependencies:                                                        │
│  • curl (HTTP client)                                                │
│  • grep (text parsing)                                               │
│  • .env file                                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ check-slack-reaction.sh                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Responsibilities:                                                    │
│  • Validate message timestamp format                                 │
│  • Implement smart polling with hybrid timing                        │
│  • Call Slack API to get message with reactions                      │
│  • Parse reactions array from JSON response                          │
│  • Match approval reactions (+1, thumbsup, white_check_mark)         │
│  • Match rejection reactions (-1, thumbsdown, x)                     │
│  • Handle timeout after 30 minutes                                   │
│  • Return status (approved/rejected/no_reaction/timeout)             │
│                                                                       │
│ Inputs:                                                              │
│  • Message timestamp (1708012345.123456)                             │
│                                                                       │
│ Outputs:                                                             │
│  • Status string (stdout)                                            │
│  • Progress logs (stderr)                                            │
│  • Exit code (0=approved/rejected, 1=timeout/no_reaction)            │
│                                                                       │
│ Dependencies:                                                        │
│  • curl (HTTP client)                                                │
│  • grep (regex matching)                                             │
│  • sleep (polling delays)                                            │
│  • .env file                                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ wait-for-approval.sh                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Responsibilities:                                                    │
│  • Validate inputs (ticket, title, port)                             │
│  • Call notify-slack.sh to send notification                         │
│  • Capture message timestamp from output                             │
│  • Validate timestamp format                                         │
│  • Call check-slack-reaction.sh to poll for reactions                │
│  • Display beautiful formatted output with headers                   │
│  • Return appropriate exit code for automation                       │
│  • Handle errors at each step                                        │
│                                                                       │
│ Inputs:                                                              │
│  • Ticket number (T007)                                              │
│  • Feature title                                                     │
│  • Port (default: 5173)                                              │
│                                                                       │
│ Outputs:                                                             │
│  • Formatted status messages (stderr)                                │
│  • Exit code (0=approved, 1=rejected/timeout/error)                  │
│                                                                       │
│ Dependencies:                                                        │
│  • notify-slack.sh                                                   │
│  • check-slack-reaction.sh                                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Error Source                                                         │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ├─ Missing .env file?
         │  └─ Exit with setup instructions
         │
         ├─ SLACK_BOT_TOKEN not set?
         │  └─ Exit with configuration instructions
         │
         ├─ Invalid timestamp format?
         │  └─ Exit with format example
         │
         ├─ Slack API Error?
         │  ├─ missing_scope → Guide to add scopes
         │  ├─ not_in_channel → Guide to invite bot
         │  ├─ channel_not_found → Guide to find channel
         │  ├─ invalid_auth → Guide to update token
         │  └─ Other → Display error message
         │
         ├─ Network Error?
         │  └─ Log error and retry (in polling loop)
         │
         ├─ Timeout reached?
         │  └─ Return "no_reaction" status
         │
         └─ All OK
            └─ Continue processing
```

## Performance Characteristics

### Time Complexity

```
Polling Loop:
├─ Best Case: O(1) - Immediate approval (first check)
├─ Average Case: O(n) - n checks until approval
└─ Worst Case: O(max_time/interval) - Full 30 min timeout
   └─ Fast phase: 300s / 30s = 10 checks
   └─ Slow phase: 1500s / 300s = 5 checks
   └─ Total: 15 checks maximum
```

### Space Complexity

```
Memory Usage:
├─ Bash variables: ~1-2 KB
├─ API responses: ~2-5 KB per call
├─ Total: ~2-3 MB (bash script runtime)
└─ No persistent storage or accumulation
```

### Network Usage

```
Bandwidth:
├─ POST chat.postMessage: ~1 KB request, ~500 bytes response
├─ GET conversations.history: ~200 bytes request, ~2 KB response
└─ Total (30 min): ~1 KB + (15 × 2.2 KB) = ~34 KB maximum
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ Security Layer 1: Token Storage                                     │
├─────────────────────────────────────────────────────────────────────┤
│  • Bot token stored in .env (gitignored)                             │
│  • .env.example provides template (no secrets)                       │
│  • No tokens in code or logs                                         │
│  • Tokens masked in error messages                                   │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Security Layer 2: OAuth Scopes (Least Privilege)                    │
├─────────────────────────────────────────────────────────────────────┤
│  • chat:write - Only post messages (no delete/edit)                  │
│  • channels:history - Only read public channels invited to           │
│  • reactions:read - Only read reactions (no add/remove)              │
│  • No user data, DMs, or admin permissions                           │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Security Layer 3: Channel Privacy                                   │
├─────────────────────────────────────────────────────────────────────┤
│  • Bot only sees channels it's invited to                            │
│  • Can use private channels for sensitive features                   │
│  • No cross-channel access                                           │
│  • Channel ID validated before posting                               │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Security Layer 4: Input Validation                                  │
├─────────────────────────────────────────────────────────────────────┤
│  • Timestamp format validated                                        │
│  • API responses checked for "ok": true                              │
│  • JSON parsing uses grep (no eval)                                  │
│  • No shell injection vulnerabilities                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Architecture Documentation** | Last Updated: 2026-02-15
