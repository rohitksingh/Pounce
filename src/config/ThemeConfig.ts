/**
 * Theme Configuration
 *
 * Defines visual parameters for each biome/theme in the game.
 * Each theme has distinct colors, decorations, particles, and ambient effects.
 */

export interface ThemeVisuals {
  backgroundLayers: {
    colors: number[];        // 3 colors for wave/dune/ice layers
    type: 'waves' | 'dunes' | 'ice';
    alpha: number[];
    speedMultiplier: number; // Animation speed modifier
    amplitudeMultiplier: number; // Wave height modifier
  };
  ambientEffect: {
    color: number;
    secondaryColor: number;
    intensity: number;
    type: 'caustics' | 'heatwave' | 'aurora';
  };
  decoration: {
    type: 'palm' | 'cactus' | 'iceberg';
    trunkColor: number;
    foliageColors: number[];
    spacing: number;
  };
  particles: {
    primary: {
      color: number;
      type: 'bubble' | 'snowflake' | 'sand';
      tint: number;
      direction: 'up' | 'down'; // Spawn direction
    };
    secondary: {
      color: number;
      type: 'sparkle' | 'ice-crystal' | 'dust';
      tint: number;
      direction: 'up' | 'down';
    };
  };
  territory: {
    baseColor: number;
    lineColor: number;
    textureName: string;
  };
}

export const THEME_CONFIGS: Record<string, ThemeVisuals> = {
  tropical: {
    backgroundLayers: {
      colors: [0x0A2540, 0x1E3A5F, 0x2E5A7F], // Deep to light blue ocean
      type: 'waves',
      alpha: [0.6, 0.4, 0.2],
      speedMultiplier: 1.0,
      amplitudeMultiplier: 1.0,
    },
    ambientEffect: {
      color: 0x87CEEB,      // Sky blue
      secondaryColor: 0x4682B4, // Steel blue
      intensity: 0.3,
      type: 'caustics',
    },
    decoration: {
      type: 'palm',
      trunkColor: 0x8B4513,  // Saddle brown
      foliageColors: [0x228B22, 0x32CD32, 0x00FF00], // Forest to lime green
      spacing: 120,
    },
    particles: {
      primary: {
        color: 0xFFFFFF,
        type: 'bubble',
        tint: 0x87CEEB,
        direction: 'up',
      },
      secondary: {
        color: 0xFFD700,     // Gold
        type: 'sparkle',
        tint: 0xFFD700,
        direction: 'up',
      },
    },
    territory: {
      baseColor: 0xF4A460,   // Sandy brown
      lineColor: 0xDEB887,   // Burlywood
      textureName: 'deck',
    },
  },

  arctic: {
    backgroundLayers: {
      colors: [0xE8F4F8, 0xB0E0E6, 0x4682B4], // White to powder blue to steel blue
      type: 'ice',
      alpha: [0.7, 0.5, 0.3],
      speedMultiplier: 0.2,  // Very slow movement
      amplitudeMultiplier: 0.8, // Flatter waves
    },
    ambientEffect: {
      color: 0x00FFFF,       // Cyan
      secondaryColor: 0x9370DB, // Medium purple
      intensity: 0.25,
      type: 'aurora',
    },
    decoration: {
      type: 'iceberg',
      trunkColor: 0xF0F8FF,  // Alice blue (main iceberg)
      foliageColors: [0xE0FFFF, 0xAFEEEE, 0x87CEEB], // Light cyan to sky blue
      spacing: 150,
    },
    particles: {
      primary: {
        color: 0xFFFFFF,
        type: 'snowflake',
        tint: 0xE0FFFF,
        direction: 'down',   // Snow falls
      },
      secondary: {
        color: 0x00FFFF,
        type: 'ice-crystal',
        tint: 0xAFEEEE,
        direction: 'down',
      },
    },
    territory: {
      baseColor: 0xF0F8FF,   // Alice blue (icy)
      lineColor: 0xB0E0E6,   // Powder blue
      textureName: 'ice',
    },
  },

  desert: {
    backgroundLayers: {
      colors: [0xFF8C00, 0xFFD700, 0xF4A460], // Dark orange to gold to sandy brown
      type: 'dunes',
      alpha: [0.65, 0.45, 0.25],
      speedMultiplier: 0.3,  // Slow dune movement
      amplitudeMultiplier: 1.5, // Higher dunes
    },
    ambientEffect: {
      color: 0xFF8C00,       // Dark orange
      secondaryColor: 0xFFD700, // Gold
      intensity: 0.35,
      type: 'heatwave',
    },
    decoration: {
      type: 'cactus',
      trunkColor: 0x228B22,  // Forest green
      foliageColors: [0x2E8B57, 0x3CB371, 0x90EE90], // Sea green to light green
      spacing: 130,
    },
    particles: {
      primary: {
        color: 0xFFD700,
        type: 'sand',
        tint: 0xDEB887,
        direction: 'up',     // Sand blows up
      },
      secondary: {
        color: 0xFFFFFF,
        type: 'dust',
        tint: 0xFFD700,      // Sun glints
        direction: 'up',
      },
    },
    territory: {
      baseColor: 0x20B2AA,   // Light sea green (oasis water)
      lineColor: 0x3CB371,   // Medium sea green
      textureName: 'oasis',
    },
  },
};

/**
 * Get theme configuration by name
 * @param themeName Name of the theme ('tropical', 'arctic', 'desert')
 * @returns Theme configuration object
 */
export function getThemeConfig(themeName: string): ThemeVisuals {
  return THEME_CONFIGS[themeName] || THEME_CONFIGS.tropical;
}
