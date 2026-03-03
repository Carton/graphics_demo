import { describe, it, expect } from 'vitest';
import { Surface } from '../core/surface';
import { Matrix } from '../core/matrix';
import { drawPolygon, drawLine, sampleBilinear } from '../core/rasterization';

describe('Rasterization', () => {
  it('should draw a horizontal line', () => {
    const surface = new Surface(10, 10);
    drawLine(surface, 2, 2, 8, 2, 255, 0, 0, 255);

    // Check start, middle, and end
    expect(surface.getPixel(2, 2)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(surface.getPixel(5, 2)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(surface.getPixel(8, 2)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    // Check out of line
    expect(surface.getPixel(5, 3).a).toBe(0);
  });

  it('should draw a vertical line', () => {
    const surface = new Surface(10, 10);
    drawLine(surface, 5, 1, 5, 9, 0, 255, 0, 255);

    expect(surface.getPixel(5, 1)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
    expect(surface.getPixel(5, 5)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
    expect(surface.getPixel(5, 9)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
  });

  it('should draw a diagonal line', () => {
    const surface = new Surface(10, 10);
    drawLine(surface, 0, 0, 9, 9, 0, 0, 255, 255);

    for (let i = 0; i < 10; i++) {
      expect(surface.getPixel(i, i)).toEqual({ r: 0, g: 0, b: 255, a: 255 });
    }
  });

  it('should draw a convex polygon (triangle)', () => {

    const s = new Surface(10, 10);
    const vertices = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 5 },
    ];
    // Simple identity matrix
    const m = Matrix.identity();
    drawPolygon(s, vertices, m, 255, 255, 255, 255);

    // (0,0) should be colored
    expect(s.getPixel(0, 0).a).toBe(255);
    // (4,0) should be colored
    expect(s.getPixel(4, 0).a).toBe(255);
    // (0,4) should be colored
    expect(s.getPixel(0, 4).a).toBe(255);
    // (5,5) should be empty
    expect(s.getPixel(5, 5).a).toBe(0);
  });

  it('should draw a transformed triangle', () => {
    const s = new Surface(20, 20);
    const vertices = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];
    // Translate by 5, 5
    const m = Matrix.translation(5, 5);
    drawPolygon(s, vertices, m, 255, 0, 0, 255);

    // (0,0) should be empty now
    expect(s.getPixel(0, 0).a).toBe(0);
    // (5,5) should be colored
    expect(s.getPixel(5, 5).a).toBe(255);
    expect(s.getPixel(5, 5).r).toBe(255);
  });
});

describe('Bilinear Interpolation', () => {
  it('should interpolate between pixels correctly', () => {
    const s = new Surface(2, 2);
    // (0,0): Red, (1,0): Blue, (0,1): Green, (1,1): White
    s.setPixel(0, 0, 255, 0, 0, 255);
    s.setPixel(1, 0, 0, 0, 255, 255);
    s.setPixel(0, 1, 0, 255, 0, 255);
    s.setPixel(1, 1, 255, 255, 255, 255);
    
    // Sample at (0.5, 0.5) -> average of all 4
    const result = sampleBilinear(s, 0.5, 0.5);
    // Red: (255 + 0 + 0 + 255) / 4 = 510 / 4 = 127.5
    expect(result.r).toBeCloseTo(127.5, 0);
    expect(result.g).toBeCloseTo(127.5, 0);
    expect(result.b).toBeCloseTo(127.5, 0);
    expect(result.a).toBe(255);
  });
});
