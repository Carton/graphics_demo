import { describe, it, expect } from 'vitest';
import { Surface } from '../core/surface';
import { sampleNearest, sampleBilinear } from '../core/rasterization';

describe('Texture Sampling', () => {
  const src = new Surface(2, 2);
  // Set up a 2x2 grid:
  // (0,0): Red(255,0,0),    (1,0): Green(0,255,0)
  // (0,1): Blue(0,0,255),   (1,1): White(255,255,255)
  src.setPixel(0, 0, 255, 0, 0, 255);
  src.setPixel(1, 0, 0, 255, 0, 255);
  src.setPixel(0, 1, 0, 0, 255, 255);
  src.setPixel(1, 1, 255, 255, 255, 255);

  describe('Nearest Neighbor', () => {
    it('should pick the closest pixel (top-left)', () => {
      const p = sampleNearest(src, 0.4, 0.4);
      expect(p.r).toBe(255);
      expect(p.g).toBe(0);
    });

    it('should pick the closest pixel (bottom-right)', () => {
      const p = sampleNearest(src, 0.6, 0.6);
      expect(p.r).toBe(255);
      expect(p.g).toBe(255);
    });

    it('should handle boundary coordinates', () => {
      const p = sampleNearest(src, 1.9, 1.9, 'clamp');
      expect(p.r).toBe(255);
      expect(p.g).toBe(255);
    });
  });

  describe('Bilinear Interpolation', () => {
    it('should interpolate exactly between 4 pixels at center', () => {
      const p = sampleBilinear(src, 0.5, 0.5);
      expect(p.r).toBeCloseTo(127.5, 1);
      expect(p.g).toBeCloseTo(127.5, 1);
      expect(p.b).toBeCloseTo(127.5, 1);
    });

    it('should match pixel value at exact coordinates', () => {
      const p = sampleBilinear(src, 0, 0);
      expect(p.r).toBe(255);
      expect(p.g).toBe(0);
    });
  });

  describe('Wrapping Modes', () => {
    it('should repeat the texture when coordinates are out of bounds (repeat)', () => {
      // src is 2x2. pixels are at (0,0), (1,0), (0,1), (1,1)
      // (2.1, 1.0) repeat -> (0.1, 1.0)
      const p = sampleNearest(src, 2.1, 1.0, 'repeat');
      const expected = sampleNearest(src, 0.1, 1.0, 'clamp');
      expect(p).toEqual(expected);
    });

    it('should mirror the texture when coordinates are out of bounds (mirror)', () => {
      // Size=2.
      // x=2.1 -> normX = 1.05. abs((1.05+1)%2 - 1) = abs(0.05 - 1) = 0.95. wx = 0.95 * 2 = 1.9. round(1.9) = 2 (out, clamped to 1)
      // x=-0.1 -> normX = -0.05. abs((-0.05+1)%2 - 1) = abs(0.95 - 1) = 0.05. wx = 0.05 * 2 = 0.1. round(0.1) = 0
      // So they are NOT equal in this case. Let's pick points that should be equal.
      // x=1.1 (norm 0.55) -> abs(1.55%2 - 1) = abs(1.55 - 1) = 0.55. wx = 1.1
      // x=2.9 (norm 1.45) -> abs(2.45%2 - 1) = abs(0.45 - 1) = 0.55. wx = 1.1
      const p1 = sampleNearest(src, 1.1, 0.5, 'mirror');
      const p2 = sampleNearest(src, 2.9, 0.5, 'mirror');
      expect(p1).toEqual(p2);
    });
  });
});
