export const GameConfig = {
  // Canvas dimensions
  width: 800,
  height: 600,

  // Grid configuration
  gridCols: 80,
  gridRows: 60,
  cellSize: 10,

  // Colors
  colors: {
    void: 0x1a1a1a,        // Dark gray background
    captured: 0x2ecc71,     // Green territory
    trail: 0xf1c40f,        // Yellow trail (Styx)
    mouse: 0x3498db,        // Blue mouse
    cat: 0xe74c3c,          // Red cat
    border: 0xecf0f1,       // Light gray border
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
