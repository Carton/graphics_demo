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

export type BlendMode = 'clear' | 'src' | 'dst' | 'src-over' | 'in' | 'out' | 'atop' | 'xor';

/**
 * Porter-Duff Blending Operator.
 * Assumes source and destination pixels are already PREMULTIPLIED.
 *
 * Triple-operand support: dst = (src IN mask) OP dst
 * If maskAlpha is provided, src is first attenuated by maskAlpha/255.
 */
export function blend(src: Pixel, dst: Pixel, mode: BlendMode, maskAlpha: number = 255): Pixel {
  // 1. Apply mask: src' = src IN mask
  const mf = maskAlpha / 255;
  const s = {
    r: src.r * mf,
    g: src.g * mf,
    b: src.b * mf,
    a: src.a * mf,
  };

  const sa = s.a / 255;
  const da = dst.a / 255;

  switch (mode) {
    case 'clear':
      // (0, 0)
      return { r: 0, g: 0, b: 0, a: 0 };

    case 'src':
      // (S)
      return s;

    case 'dst':
      // (D)
      return { ...dst };

    case 'src-over': {
      // S + D * (1 - Sa)
      const invSa = 1 - sa;
      return {
        r: s.r + dst.r * invSa,
        g: s.g + dst.g * invSa,
        b: s.b + dst.b * invSa,
        a: s.a + dst.a * invSa,
      };
    }

    case 'in': {
      // S * Da
      return {
        r: s.r * da,
        g: s.g * da,
        b: s.b * da,
        a: s.a * da,
      };
    }

    case 'out': {
      // S * (1 - Da)
      const invDa = 1 - da;
      return {
        r: s.r * invDa,
        g: s.g * invDa,
        b: s.b * invDa,
        a: s.a * invDa,
      };
    }

    case 'atop': {
      // S * Da + D * (1 - Sa)
      const invSa = 1 - sa;
      return {
        r: s.r * da + dst.r * invSa,
        g: s.g * da + dst.g * invSa,
        b: s.b * da + dst.b * invSa,
        a: s.a * da + dst.a * invSa,
      };
    }

    case 'xor': {
      // S * (1 - Da) + D * (1 - Sa)
      const invSa = 1 - sa;
      const invDa = 1 - da;
      return {
        r: s.r * invDa + dst.r * invSa,
        g: s.g * invDa + dst.g * invSa,
        b: s.b * invDa + dst.b * invSa,
        a: s.a * invDa + dst.a * invSa,
      };
    }

    default:
      return s;
  }
}
