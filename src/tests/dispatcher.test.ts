import { describe, it, expect } from 'vitest';
import { CompositeDispatcher } from '../core/dispatcher';
import { Matrix } from '../core/matrix';
import { Surface } from '../core/surface';

describe('Fast Path Dispatcher', () => {
  const dst = new Surface(10, 10);
  const src = new Surface(5, 5);

  it('should detect SRC_COPY path for identity matrix and SRC operator', () => {
    const matrix = Matrix.identity();
    const info = CompositeDispatcher.analyze(dst, dst, matrix, 'src');
    expect(info.path).toBe('SRC_COPY');
  });

  it('should detect TRANSLATE_ONLY path for integer translation', () => {
    const matrix = Matrix.translation(5, 5);
    const info = CompositeDispatcher.analyze(dst, src, matrix, 'src-over');
    expect(info.path).toBe('TRANSLATE_ONLY');
  });

  it('should detect SRC_OVER_SOLID path when source is effectively a solid color', () => {
    // We'll simulate this by passing a null source or a specific flag in analyze
    // For Pixman, a solid source is a 1x1 image with repeat
    const info = CompositeDispatcher.analyze(dst, null, Matrix.identity(), 'src-over', { solidColor: { r: 255, g: 0, b: 0, a: 255 } });
    expect(info.path).toBe('SRC_OVER_SOLID');
  });

  it('should fallback to GENERIC path for complex rotations', () => {
    const matrix = Matrix.rotation(Math.PI / 4);
    const info = CompositeDispatcher.analyze(dst, src, matrix, 'src-over');
    expect(info.path).toBe('GENERIC');
  });
});
