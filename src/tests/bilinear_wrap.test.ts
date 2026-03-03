import { describe, it, expect } from 'vitest';
import { Surface } from '../core/surface';
import { sampleBilinear } from '../core/rasterization';

describe('Bilinear Wrapping', () => {
  const src = new Surface(2, 2);
  // (0,0): Red(255,0,0),    (1,0): Green(0,255,0)
  // (0,1): Blue(0,0,255),   (1,1): White(255,255,255)
  src.setPixel(0, 0, 255, 0, 0, 255);
  src.setPixel(1, 0, 0, 255, 0, 255);
  src.setPixel(0, 1, 0, 0, 255, 255);
  src.setPixel(1, 1, 255, 255, 255, 255);

  it('should interpolate across edges in repeat mode', () => {
    // Sample at (1.5, 0.5) in repeat mode.
    // Neighbors should be (1,0), (0,0), (1,1), (0,1)
    // x=1.5 -> x0=1, x1=2(wrapped to 0). u=0.5
    // y=0.5 -> y0=0, y1=1. v=0.5
    const p = sampleBilinear(src, 1.5, 0.5, 'repeat');
    
    // R: lerp(lerp(0, 255, 0.5), lerp(255, 0, 0.5), 0.5)
    // R: lerp(127.5, 127.5, 0.5) = 127.5
    expect(p.r).toBeCloseTo(127.5, 1);
  });
});
