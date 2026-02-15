# Pounce 🎮

A territory-capture game inspired by classic QIX/Volfied gameplay. Control a mouse to claim territory while avoiding cats!

## How to Play

- **Objective**: Capture 75% of the playing field to win
- **Controls**: Use WASD or Arrow Keys to move the mouse
- **Lives**: You start with 3 lives
- **Gameplay**:
  - Move on the green captured territory (safe zone)
  - Venture into the black void to draw yellow trails
  - Return to captured territory to close the loop and claim new area
  - **Avoid cats!** If a cat touches your trail while you're drawing, you lose a life
  - Cats cannot enter your captured territory

## Development

### Setup

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Slack Notifications (Optional)

Enable Slack notifications for development updates:

1. **Get a Slack Webhook URL**
   - Go to https://api.slack.com/messaging/webhooks
   - Create a new webhook for your workspace
   - Copy the webhook URL

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your SLACK_WEBHOOK_URL
   ```

3. **Send Notifications**
   ```bash
   ./scripts/notify-slack.sh T006 "Feature Name" ready
   ```

   **Usage:**
   ```
   ./scripts/notify-slack.sh [TICKET] [TITLE] [STATUS] [PORT]
   ```

   **Status Options:**
   - `ready` - Ready for Review (✅)
   - `progress` - In Progress (🚧)
   - `complete` - Completed (🎉)
   - `blocked` - Blocked (🚫)

   **Examples:**
   ```bash
   # Feature ready for review
   ./scripts/notify-slack.sh T006 "Slack Notifications" ready

   # Work in progress
   ./scripts/notify-slack.sh T007 "New Feature" progress

   # Custom port
   ./scripts/notify-slack.sh T008 "Feature" ready 3000
   ```

## Tech Stack

- **Game Framework**: Phaser 3.80+
- **Language**: TypeScript
- **Build Tool**: Vite 5.x
- **Package Manager**: npm

## Project Structure

```
pounce/
├── src/
│   ├── main.ts              # Entry point, Phaser config
│   ├── scenes/
│   │   ├── BootScene.ts     # Preload assets
│   │   ├── MenuScene.ts     # Main menu
│   │   └── GameScene.ts     # Main gameplay
│   ├── entities/
│   │   ├── Mouse.ts         # Player character
│   │   └── Cat.ts           # Enemy
│   ├── utils/
│   │   ├── GridManager.ts   # Grid state management
│   │   └── FloodFill.ts     # Territory capture algorithm
│   └── config/
│       └── GameConfig.ts    # Game constants
├── public/assets/           # Game assets
├── index.html
└── package.json
```

## Game Mechanics

### Grid System
- 80x60 cell grid (800x600 pixels)
- Three cell states: VOID, CAPTURED, TRAIL

### Territory Capture
- Uses flood fill algorithm
- Captures the region without cats
- Immediate visual feedback

### Collision Detection
- Real-time collision between cats and trail
- Grid-based position checking
- Lives system with game over

## Features

✅ Grid-based movement and territory system
✅ Mouse player with keyboard controls
✅ Cat enemies with physics-based bouncing
✅ Trail drawing in dangerous zones
✅ Flood fill territory capture
✅ Collision detection
✅ Win condition (75% territory)
✅ Lives system (3 lives)
✅ Real-time UI (percentage & lives)
✅ Win/Game Over screens

## Future Enhancements

- Multiple levels with increasing difficulty
- Different cat types (fast, slow, smart)
- Power-ups (freeze, speed boost)
- Sound effects and music
- Sprite graphics
- Mobile touch controls
- Leaderboards

## License

MIT

---

**Built with ❤️ using Phaser and TypeScript**
