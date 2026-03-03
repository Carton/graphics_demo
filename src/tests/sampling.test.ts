import { describe, it, expect } from 'vitest';
import { Surface } from '../core/surface';
import { sampleNearest, sampleBilinear } from '../core/rasterization';

describe('Texture Sampling', () => {
  const src = new Surface(2, 2);
  // Set up a 2x2 grid:
  // (0,0): Red,    (1,0): Green
  // (0,1): Blue,   (1,1): White
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
      // Average of Red(255,0,0), Green(0,255,0), Blue(0,0,255), White(255,255,255)
      // R: (255+0+0+255)/4 = 127.5
      // G: (0+255+0+255)/4 = 127.5
      // B: (0+0+255+255)/4 = 127.5
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
});
