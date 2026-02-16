/**
 * Level configuration for progressive difficulty
 */

export interface LevelDefinition {
  level: number;
  name: string;
  catCount: number;
  catSpeed: number;
  winPercentage: number;
  theme: string;
}

export const LEVELS: LevelDefinition[] = [
  {
    level: 1,
    name: "Tropical Paradise",
    catCount: 5,
    catSpeed: 70,
    winPercentage: 85,
    theme: "tropical"
  },
  {
    level: 2,
    name: "Deeper Waters",
    catCount: 7,
    catSpeed: 85,
    winPercentage: 90,
    theme: "tropical"
  },
  {
    level: 3,
    name: "Pirate's Lair",
    catCount: 10,
    catSpeed: 100,
    winPercentage: 95,
    theme: "tropical"
  }
];

/**
 * Get level configuration by level number
 * @param levelNum - Level number (1-indexed)
 * @returns Level configuration, defaults to level 1 if invalid
 */
export function getLevelConfig(levelNum: number): LevelDefinition {
  return LEVELS[levelNum - 1] || LEVELS[0];
}
