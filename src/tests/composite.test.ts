import { describe, it, expect } from 'vitest';
import { blend } from '../core/blending';

describe('Triple-Operand Blending (Source, Mask, Destination)', () => {
  it('should apply mask alpha to source before blending', () => {
    // Source: 100% Red (premultiplied: 255, 0, 0, 255)
    // Mask: 50% Alpha (128)
    // Destination: 100% Green (premultiplied: 0, 255, 0, 255)
    // Operator: SrcOver

    const src = { r: 255, g: 0, b: 0, a: 255 };
    const dst = { r: 0, g: 255, b: 0, a: 255 };
    const maskAlpha = 128; // 50%

    // pixman formula: dst = (src IN mask) OP dst
    // src IN mask => src' = { r: src.r * maskAlpha/255, g: src.g * maskAlpha/255, b: src.b * maskAlpha/255, a: src.a * maskAlpha/255 }
    // src' = { r: 128, g: 0, b: 0, a: 128 }
    // src' Over Green => { r: 128, g: 127.5, b: 0, a: 255 }

    const result = blend(src, dst, 'src-over', maskAlpha);

    expect(result.r).toBeCloseTo(128, 0);
    expect(result.g).toBeCloseTo(127, 0);
    expect(result.a).toBe(255);
  });

  it('should result in transparent when mask alpha is zero', () => {
    const src = { r: 255, g: 0, b: 0, a: 255 };
    const dst = { r: 0, g: 0, b: 0, a: 0 };
    const maskAlpha = 0;

    const result = blend(src, dst, 'src-over', maskAlpha);
    expect(result.a).toBe(0);
  });

  it('should implement (src IN mask) IN dst correctly', () => {
    // Source: 100% White (255, 255, 255, 255)
    // Mask: 50% Alpha (128)
    // Destination: 100% Blue (0, 0, 255, 255)
    // Op: IN

    const src = { r: 255, g: 255, b: 255, a: 255 };
    const dst = { r: 0, g: 0, b: 255, a: 255 };
    const maskAlpha = 128;

    // src' = (128, 128, 128, 128)
    // result = src' IN dst => src' * da/255 = (128, 128, 128, 128) * 1.0 = (128, 128, 128, 128)

    const result = blend(src, dst, 'in', maskAlpha);
    expect(result.r).toBeCloseTo(128, 0);
    expect(result.a).toBe(128);
  });
});
