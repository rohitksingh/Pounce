export const GameConfig = {
  // Canvas dimensions
  width: 800,
  height: 600,

  // Grid configuration
  gridCols: 80,
  gridRows: 60,
  cellSize: 10,

  // Colors (Pirate Theme)
  colors: {
    void: 0x1E3A5F,        // Deep sea blue
    captured: 0xD4A574,     // Deck/island wood
    trail: 0xF1C40F,        // Golden treasure trail
    mouse: 0xFFA500,        // Orange cat player
    cat: 0x2C3E50,          // Dark pirate
    border: 0x8B7355,       // Brown border
  },

  // Game settings
  initialCats: 7,
  mouseSpeed: 100,          // pixels per second (base speed)
  catSpeed: 80,
  winPercentage: 75,        // % of territory to win
  initialLives: 3,
  speedIncreasePerCat: 0.1, // 10% increase per cat captured (multiplicative)
  maxSpeedMultiplier: 2.5,  // Cap speed at 2.5× base speed

  // Power-up settings
  powerUps: {
    maxActive: 3,             // Max power-ups on field at once
    spawnInterval: 10000,     // ms between spawn attempts
    effectDuration: 5000,     // ms that effects last
    freezeSpeedMultiplier: 0, // Cats don't move when frozen
    slowSpeedMultiplier: 0.5, // Cats move at 50% speed when slowed
  },

  // Physics
  physics: {
    gravity: { x: 0, y: 0 }
  }
};

export enum CellState {
  VOID = 0,
  CAPTURED = 1,
  TRAIL = 2
}
