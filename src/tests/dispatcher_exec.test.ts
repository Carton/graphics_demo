import { describe, it, expect } from 'vitest';
import { CompositeDispatcher } from '../core/dispatcher';
import { Matrix } from '../core/matrix';
import { Surface } from '../core/surface';

describe('Fast Path Execution', () => {
  it('should correctly execute SRC_COPY', () => {
    const dst = new Surface(2, 2);
    const src = new Surface(2, 2);
    src.setPixel(0, 0, 255, 0, 0, 255);
    src.setPixel(1, 1, 0, 255, 0, 255);

    CompositeDispatcher.composite(dst, src, Matrix.identity(), 'src');

    expect(dst.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(dst.getPixel(1, 1)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
  });

  it('should correctly execute SRC_OVER_SOLID', () => {
    const dst = new Surface(2, 2);
    dst.fill(0, 0, 255, 255); // Blue background

    // Over with 50% Red solid
    CompositeDispatcher.composite(dst, null, Matrix.identity(), 'src-over', {
      solidColor: { r: 128, g: 0, b: 0, a: 128 }, // Premultiplied
    });

    // R: 128 + 0 * (1 - 0.5) = 128
    // G: 0 + 0 * 0.5 = 0
    // B: 0 + 255 * 0.5 = 127.5
    const p = dst.getPixel(0, 0);
    expect(p.r).toBe(128);
    expect(p.b).toBeCloseTo(127, 0);
  });

  it('should correctly execute TRANSLATE_ONLY', () => {
    const dst = new Surface(4, 4);
    const src = new Surface(2, 2);
    src.setPixel(0, 0, 255, 255, 255, 255); // White dot at (0,0)

    // Translate by (1, 1)
    CompositeDispatcher.composite(dst, src, Matrix.translation(1, 1), 'src');

    expect(dst.getPixel(0, 0).a).toBe(0);
    expect(dst.getPixel(1, 1)).toEqual({ r: 255, g: 255, b: 255, a: 255 });
  });

  it('should correctly execute SRC_OVER_SOLID with mask alpha', () => {
    const dst = new Surface(2, 2);
    dst.fill(0, 0, 0, 0);

    // Solid Red (255,0,0,255) with 50% mask (128)
    CompositeDispatcher.composite(dst, null, Matrix.identity(), 'src-over', {
      solidColor: { r: 255, g: 0, b: 0, a: 255 },
      maskAlpha: 128,
    });

    const p = dst.getPixel(0, 0);
    // (Src IN Mask) Over Dst
    // Src' = 255 * 0.5 = 127.5
    // Result = 127.5 + 0 * (1 - 0.5) = 127.5
    // Uint8ClampedArray rounds to nearest (128)
    expect(p.r).toBeCloseTo(128, 0);
    expect(p.a).toBeCloseTo(128, 0);
  });

  it('should handle out of bounds TRANSLATE_ONLY', () => {
    const dst = new Surface(2, 2);
    const src = new Surface(2, 2);
    src.fill(255, 255, 255, 255);

    // Translate by (1, 1) -> only (1,1) of dst should be filled
    CompositeDispatcher.composite(dst, src, Matrix.translation(1, 1), 'src');

    expect(dst.getPixel(0, 0).a).toBe(0);
    expect(dst.getPixel(1, 1).a).toBe(255);
  });
});
