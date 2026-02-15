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
  initialCats: 2,
  mouseSpeed: 100,          // pixels per second
  catSpeed: 80,
  winPercentage: 75,        // % of territory to win
  initialLives: 3,

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
