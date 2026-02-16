import Phaser from 'phaser';

/**
 * Utility class for drawing procedural cat graphics
 * Creates cute, cartoon-style cats using Phaser's Graphics API
 */
export class CatGraphics {
  /**
   * Draw a complete cat on a graphics object
   * @param graphics - Phaser Graphics object to draw on
   * @param size - Base size of the cat (height in pixels)
   * @param color - Main body color (e.g., 0xFFA500 for orange)
   * @param variant - 'player' or 'pirate' for different styles
   */
  static drawCat(
    graphics: Phaser.GameObjects.Graphics,
    size: number,
    color: number,
    variant: 'player' | 'pirate'
  ): void {
    graphics.clear();

    if (variant === 'player') {
      this.drawPlayerCat(graphics, size, color);
    } else {
      this.drawPirateCat(graphics, size, color);
    }
  }

  /**
   * Draw the player cat (orange tabby)
   */
  private static drawPlayerCat(
    graphics: Phaser.GameObjects.Graphics,
    size: number,
    color: number
  ): void {
    const centerX = 0;
    const centerY = 0;
    const headRadius = size * 0.35;
    const bodyWidth = size * 0.5;
    const bodyHeight = size * 0.4;

    // Draw tail (curved line behind body using arc)
    graphics.lineStyle(size * 0.15, color, 1);
    // Draw curved tail using arc approximation
    graphics.beginPath();
    graphics.arc(
      centerX - bodyWidth * 0.6,
      centerY + bodyHeight * 0.2,
      size * 0.3,
      Phaser.Math.DegToRad(45),
      Phaser.Math.DegToRad(180),
      false
    );
    graphics.strokePath();

    // Draw body (rounded oval)
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(centerX, centerY + size * 0.1, bodyWidth, bodyHeight);

    // Draw stripes on body (tabby pattern)
    const stripeColor = this.darkenColor(color, 0.3);
    graphics.fillStyle(stripeColor, 1);
    for (let i = 0; i < 3; i++) {
      const stripeY = centerY + size * 0.1 + (i - 1) * bodyHeight * 0.25;
      graphics.fillEllipse(centerX, stripeY, bodyWidth * 0.8, bodyHeight * 0.12);
    }

    // Draw head (circle)
    graphics.fillStyle(color, 1);
    graphics.fillCircle(centerX, centerY - size * 0.2, headRadius);

    // Draw ears (triangles)
    graphics.fillStyle(color, 1);
    // Left ear
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.6, centerY - size * 0.2);
    graphics.lineTo(centerX - headRadius * 0.9, centerY - size * 0.5);
    graphics.lineTo(centerX - headRadius * 0.3, centerY - size * 0.35);
    graphics.closePath();
    graphics.fillPath();
    // Right ear
    graphics.beginPath();
    graphics.moveTo(centerX + headRadius * 0.6, centerY - size * 0.2);
    graphics.lineTo(centerX + headRadius * 0.9, centerY - size * 0.5);
    graphics.lineTo(centerX + headRadius * 0.3, centerY - size * 0.35);
    graphics.closePath();
    graphics.fillPath();

    // Draw inner ear (pink triangles)
    graphics.fillStyle(0xFFB6C1, 1);
    // Left inner ear
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.65, centerY - size * 0.25);
    graphics.lineTo(centerX - headRadius * 0.75, centerY - size * 0.4);
    graphics.lineTo(centerX - headRadius * 0.5, centerY - size * 0.32);
    graphics.closePath();
    graphics.fillPath();
    // Right inner ear
    graphics.beginPath();
    graphics.moveTo(centerX + headRadius * 0.65, centerY - size * 0.25);
    graphics.lineTo(centerX + headRadius * 0.75, centerY - size * 0.4);
    graphics.lineTo(centerX + headRadius * 0.5, centerY - size * 0.32);
    graphics.closePath();
    graphics.fillPath();

    // Draw eyes (white circles with black pupils)
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillCircle(centerX - headRadius * 0.35, centerY - size * 0.25, headRadius * 0.25);
    graphics.fillCircle(centerX + headRadius * 0.35, centerY - size * 0.25, headRadius * 0.25);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(centerX - headRadius * 0.35, centerY - size * 0.25, headRadius * 0.15);
    graphics.fillCircle(centerX + headRadius * 0.35, centerY - size * 0.25, headRadius * 0.15);

    // Draw nose (small pink triangle)
    graphics.fillStyle(0xFFB6C1, 1);
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.1, centerY - size * 0.12);
    graphics.lineTo(centerX + headRadius * 0.1, centerY - size * 0.12);
    graphics.lineTo(centerX, centerY - size * 0.05);
    graphics.closePath();
    graphics.fillPath();

    // Draw whiskers (thin black lines)
    graphics.lineStyle(1, 0x000000, 0.8);
    // Left whiskers
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.1, centerY - size * 0.1);
    graphics.lineTo(centerX - headRadius * 0.8, centerY - size * 0.15);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.1, centerY - size * 0.05);
    graphics.lineTo(centerX - headRadius * 0.8, centerY - size * 0.05);
    graphics.strokePath();
    // Right whiskers
    graphics.beginPath();
    graphics.moveTo(centerX + headRadius * 0.1, centerY - size * 0.1);
    graphics.lineTo(centerX + headRadius * 0.8, centerY - size * 0.15);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(centerX + headRadius * 0.1, centerY - size * 0.05);
    graphics.lineTo(centerX + headRadius * 0.8, centerY - size * 0.05);
    graphics.strokePath();
  }

  /**
   * Draw a pirate cat (enemy variant with pirate accessories)
   */
  private static drawPirateCat(
    graphics: Phaser.GameObjects.Graphics,
    size: number,
    color: number
  ): void {
    const centerX = 0;
    const centerY = 0;
    const headRadius = size * 0.35;
    const bodyWidth = size * 0.5;
    const bodyHeight = size * 0.4;

    // Draw tail (curved line behind body using arc)
    graphics.lineStyle(size * 0.15, color, 1);
    // Draw curved tail using arc approximation
    graphics.beginPath();
    graphics.arc(
      centerX - bodyWidth * 0.6,
      centerY + bodyHeight * 0.2,
      size * 0.3,
      Phaser.Math.DegToRad(45),
      Phaser.Math.DegToRad(180),
      false
    );
    graphics.strokePath();

    // Draw body (rounded oval)
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(centerX, centerY + size * 0.1, bodyWidth, bodyHeight);

    // Draw head (circle)
    graphics.fillStyle(color, 1);
    graphics.fillCircle(centerX, centerY - size * 0.2, headRadius);

    // Draw ears (triangles)
    graphics.fillStyle(color, 1);
    // Left ear
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.6, centerY - size * 0.2);
    graphics.lineTo(centerX - headRadius * 0.9, centerY - size * 0.5);
    graphics.lineTo(centerX - headRadius * 0.3, centerY - size * 0.35);
    graphics.closePath();
    graphics.fillPath();
    // Right ear
    graphics.beginPath();
    graphics.moveTo(centerX + headRadius * 0.6, centerY - size * 0.2);
    graphics.lineTo(centerX + headRadius * 0.9, centerY - size * 0.5);
    graphics.lineTo(centerX + headRadius * 0.3, centerY - size * 0.35);
    graphics.closePath();
    graphics.fillPath();

    // Draw bandana (red cloth on head)
    graphics.fillStyle(0xE74C3C, 1);
    graphics.fillRect(centerX - headRadius, centerY - size * 0.35, headRadius * 2, headRadius * 0.3);
    // Bandana knot (triangle on side)
    graphics.beginPath();
    graphics.moveTo(centerX + headRadius, centerY - size * 0.35);
    graphics.lineTo(centerX + headRadius * 1.3, centerY - size * 0.3);
    graphics.lineTo(centerX + headRadius, centerY - size * 0.25);
    graphics.closePath();
    graphics.fillPath();

    // Draw eye patch (black oval over left eye)
    graphics.fillStyle(0x000000, 1);
    graphics.fillEllipse(centerX - headRadius * 0.35, centerY - size * 0.25, headRadius * 0.35, headRadius * 0.3);
    // Eye patch string (thin black line)
    graphics.lineStyle(2, 0x000000, 1);
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.6, centerY - size * 0.25);
    graphics.lineTo(centerX + headRadius * 0.6, centerY - size * 0.25);
    graphics.strokePath();

    // Draw visible eye (white circle with black pupil)
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillCircle(centerX + headRadius * 0.35, centerY - size * 0.25, headRadius * 0.25);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(centerX + headRadius * 0.35, centerY - size * 0.25, headRadius * 0.15);

    // Draw nose (small dark triangle)
    graphics.fillStyle(0x2C2C2C, 1);
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.1, centerY - size * 0.12);
    graphics.lineTo(centerX + headRadius * 0.1, centerY - size * 0.12);
    graphics.lineTo(centerX, centerY - size * 0.05);
    graphics.closePath();
    graphics.fillPath();

    // Draw whiskers (thin dark lines)
    graphics.lineStyle(1, 0x2C2C2C, 0.8);
    // Left whiskers (fewer visible due to eye patch)
    graphics.beginPath();
    graphics.moveTo(centerX - headRadius * 0.1, centerY - size * 0.05);
    graphics.lineTo(centerX - headRadius * 0.6, centerY - size * 0.05);
    graphics.strokePath();
    // Right whiskers
    graphics.beginPath();
    graphics.moveTo(centerX + headRadius * 0.1, centerY - size * 0.1);
    graphics.lineTo(centerX + headRadius * 0.8, centerY - size * 0.15);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(centerX + headRadius * 0.1, centerY - size * 0.05);
    graphics.lineTo(centerX + headRadius * 0.8, centerY - size * 0.05);
    graphics.strokePath();
  }

  /**
   * Generate a random pirate cat color
   * Returns colors suitable for enemy cats (black, gray, white, brown)
   */
  static getRandomPirateColor(): number {
    const colors = [
      0x2C3E50, // Dark slate
      0x34495E, // Dark gray
      0x7F8C8D, // Gray
      0xBDC3C7, // Light gray
      0x8B4513, // Brown
      0x654321, // Dark brown
      0x1A1A1A, // Near black
      0xECF0F1, // White-ish
    ];
    return Phaser.Math.RND.pick(colors);
  }

  /**
   * Helper function to darken a color by a percentage
   * @param color - Hex color value
   * @param amount - Amount to darken (0-1, where 0.3 = 30% darker)
   */
  private static darkenColor(color: number, amount: number): number {
    const r = ((color >> 16) & 0xFF) * (1 - amount);
    const g = ((color >> 8) & 0xFF) * (1 - amount);
    const b = (color & 0xFF) * (1 - amount);
    return (r << 16) | (g << 8) | b;
  }
}
