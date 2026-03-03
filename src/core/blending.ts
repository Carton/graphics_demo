import type { Pixel } from './surface';

/**
 * Premultiplies the color components by the alpha value.
 * Alpha is expected to be in range [0, 255].
 *
 * Formula: C' = C * (A / 255)
 */
export function premultiply(r: number, g: number, b: number, a: number): Pixel {
  const alphaFactor = a / 255;
  return {
    r: r * alphaFactor,
    g: g * alphaFactor,
    b: b * alphaFactor,
    a: a,
  };
}

/**
 * Unpremultiplies the color components (reverses premultiplication).
 *
 * Formula: C = C' / (A / 255)
 */
export function unpremultiply(pr: number, pg: number, pb: number, pa: number): Pixel {
  if (pa === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const invAlphaFactor = 255 / pa;
  return {
    r: pr * invAlphaFactor,
    g: pg * invAlphaFactor,
    b: pb * invAlphaFactor,
    a: pa,
  };
}

export type BlendMode = 'clear' | 'src' | 'dst' | 'src-over';

/**
 * Porter-Duff Blending Operator.
 * Assumes source and destination pixels are already PREMULTIPLIED.
 */
export function blend(src: Pixel, dst: Pixel, mode: BlendMode): Pixel {
  const sa = src.a / 255;

  switch (mode) {
    case 'clear':
      // (0, 0)
      return { r: 0, g: 0, b: 0, a: 0 };

    case 'src':
      // (S)
      return { ...src };

    case 'dst':
      // (D)
      return { ...dst };

    case 'src-over': {
      // S + D * (1 - Sa)
      const invSa = 1 - sa;
      return {
        r: src.r + dst.r * invSa,
        g: src.g + dst.g * invSa,
        b: src.b + dst.b * invSa,
        a: src.a + dst.a * invSa,
      };
    }

    default:
      return { ...src };
  }
}
