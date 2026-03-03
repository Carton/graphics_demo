import { describe, it, expect } from 'vitest';
import { Surface } from '../core/surface';
import { Matrix } from '../core/matrix';
import { drawGradientTriangle, getBarycentric } from '../core/rasterization';

describe('Barycentric Coordinates', () => {
  it('should compute correct coordinates for vertices', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    const c = { x: 0, y: 10 };

    expect(getBarycentric(a, a, b, c)).toEqual({ u: 1, v: 0, w: 0 });
    expect(getBarycentric(b, a, b, c)).toEqual({ u: 0, v: 1, w: 0 });
    expect(getBarycentric(c, a, b, c)).toEqual({ u: 0, v: 0, w: 1 });
  });

  it('should compute correct coordinates for center', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    const c = { x: 0, y: 10 };
    const center = { x: 3.333333, y: 3.333333 };

    const bc = getBarycentric(center, a, b, c)!;
    expect(bc.u).toBeCloseTo(0.333, 1);
    expect(bc.v).toBeCloseTo(0.333, 1);
    expect(bc.w).toBeCloseTo(0.333, 1);
  });
});

describe('Gradient Triangle', () => {
  it('should interpolate colors at vertices', () => {
    const s = new Surface(10, 10);
    const vertices: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] =
      [
        { x: 0, y: 0 },
        { x: 9, y: 0 },
        { x: 0, y: 9 },
      ];
    const colors: any = [
      { r: 255, g: 0, b: 0, a: 255 },
      { r: 0, g: 255, b: 0, a: 255 },
      { r: 0, g: 0, b: 255, a: 255 },
    ];

    drawGradientTriangle(s, vertices, colors, Matrix.identity());

    // Check points slightly inside vertices
    // (0.5, 0.5) is inside
    expect(s.getPixel(0, 0).r).toBeGreaterThan(150);
    // (8.5, 0.2) is inside
    expect(s.getPixel(8, 0).g).toBeGreaterThan(150);
    // (0.2, 8.5) is inside
    expect(s.getPixel(0, 8).b).toBeGreaterThan(150);
  });
});
