import { Surface, type Pixel } from './surface';
import { Matrix } from './matrix';
import { type BlendMode, blend } from './blending';
import { Fixed } from './fixed';
import { drawSurface } from './rasterization';

export type FastPath = 'SRC_COPY' | 'SRC_OVER_SOLID' | 'TRANSLATE_ONLY' | 'GENERIC';

export interface DispatchInfo {
  path: FastPath;
  description: string;
}

export interface DispatchOptions {
  solidColor?: Pixel;
  maskAlpha?: number;
}

export class CompositeDispatcher {
  public static analyze(
    dst: Surface,
    src: Surface | null,
    matrix: Matrix,
    mode: BlendMode,
    options: DispatchOptions = {},
  ): DispatchInfo {
    const isIdentity = matrix.isIdentity();
    const isIntegerTranslation = matrix.isIntegerTranslation();

    if (options.solidColor && mode === 'src-over') {
      return { path: 'SRC_OVER_SOLID', description: 'Optimized: Filling with solid color (SrcOver)' };
    }

    if (isIdentity && mode === 'src' && src && dst.width === src.width && dst.height === src.height) {
      return { path: 'SRC_COPY', description: 'Optimized: Direct memory copy (Identity + Src)' };
    }

    if (isIntegerTranslation && src) {
      return { path: 'TRANSLATE_ONLY', description: 'Optimized: Integer translation loop (No sampling)' };
    }

    return { path: 'GENERIC', description: 'Standard: Full matrix transformation and sampling' };
  }

  public static composite(
    dst: Surface,
    src: Surface | null,
    matrix: Matrix,
    mode: BlendMode,
    options: DispatchOptions = {},
  ): DispatchInfo {
    const info = this.analyze(dst, src, matrix, mode, options);

    switch (info.path) {
      case 'SRC_COPY':
        if (src) dst.data.set(src.data);
        break;

      case 'SRC_OVER_SOLID':
        if (options.solidColor) {
          const color = options.solidColor;
          for (let y = 0; y < dst.height; y++) {
            for (let x = 0; x < dst.width; x++) {
              const dp = dst.getPixel(x, y);
              const res = blend(color, dp, 'src-over', options.maskAlpha);
              dst.setPixel(x, y, res.r, res.g, res.b, res.a);
            }
          }
        }
        break;

      case 'TRANSLATE_ONLY':
        if (src) {
          const tx = Math.floor(matrix.tx);
          const ty = Math.floor(matrix.ty);
          
          // Fixed point demonstration: calculate start offset
          const fixedX = Fixed.fromFloat(tx);
          const fixedY = Fixed.fromFloat(ty);
          
          const startX = Math.max(0, Fixed.toInt(fixedX));
          const startY = Math.max(0, Fixed.toInt(fixedY));
          const endX = Math.min(dst.width, startX + src.width);
          const endY = Math.min(dst.height, startY + src.height);

          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const sp = src.getPixel(x - tx, y - ty);
              const dp = dst.getPixel(x, y);
              const res = blend(sp, dp, mode, options.maskAlpha);
              dst.setPixel(x, y, res.r, res.g, res.b, res.a);
            }
          }
        }
        break;

      default:
        if (src) drawSurface(dst, src, matrix, 'bilinear', 'transparent');
        break;
    }

    return info;
  }
}
