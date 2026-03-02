import { describe, it, expect } from 'vitest';
import { premultiply, unpremultiply, blend } from '../core/blending';

describe('Premultiplied Alpha Helpers', () => {
  it('should correctly premultiply alpha', () => {
    // White pixel with 50% alpha (128)
    const r = 255, g = 255, b = 255, a = 128;
    const result = premultiply(r, g, b, a);
    
    // r * (a/255) => 255 * (128/255) approx 128
    expect(result.r).toBeCloseTo(128, 0);
    expect(result.g).toBeCloseTo(128, 0);
    expect(result.b).toBeCloseTo(128, 0);
    expect(result.a).toBe(a);
  });

  it('should correctly unpremultiply alpha', () => {
    const pr = 128, pg = 128, pb = 128, pa = 128;
    const result = unpremultiply(pr, pg, pb, pa);
    
    // pr / (pa/255) => 128 / (128/255) approx 255
    expect(result.r).toBeCloseTo(255, 0);
    expect(result.g).toBeCloseTo(255, 0);
    expect(result.b).toBeCloseTo(255, 0);
    expect(result.a).toBe(pa);
  });
});

describe('Porter-Duff Operators', () => {
  it('should implement Clear (0, 0)', () => {
    const src = { r: 255, g: 0, b: 0, a: 255 };
    const dst = { r: 0, g: 255, b: 0, a: 255 };
    const result = blend(src, dst, 'clear');
    expect(result.a).toBe(0);
  });

  it('should implement Source (S)', () => {
    const src = { r: 255, g: 0, b: 0, a: 255 };
    const dst = { r: 0, g: 255, b: 0, a: 255 };
    const result = blend(src, dst, 'src');
    expect(result.r).toBe(255);
    expect(result.a).toBe(255);
  });

  it('should implement Destination (D)', () => {
    const src = { r: 255, g: 0, b: 0, a: 255 };
    const dst = { r: 0, g: 255, b: 0, a: 255 };
    const result = blend(src, dst, 'dst');
    expect(result.g).toBe(255);
    expect(result.a).toBe(255);
  });

  it('should implement Source-Over (S + D*(1-Sa))', () => {
    // Top: 50% Red (premultiplied: 128, 0, 0, 128)
    // Bottom: 100% Green (premultiplied: 0, 255, 0, 255)
    const src = { r: 128, g: 0, b: 0, a: 128 };
    const dst = { r: 0, g: 255, b: 0, a: 255 };
    const result = blend(src, dst, 'src-over');
    
    // a = sa + da*(1 - sa/255) => 128 + 255*(1 - 0.5) = 128 + 127 = 255
    // r = sr + dr*(1 - sa/255) => 128 + 0 = 128
    // g = sg + dg*(1 - sa/255) => 0 + 255*(0.5) = 127.5
    expect(result.a).toBe(255);
    expect(result.r).toBe(128);
    expect(result.g).toBeCloseTo(127, 0);
  });
});
