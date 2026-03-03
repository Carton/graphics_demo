import { Surface } from './surface';
import { Matrix } from './matrix';

export interface Point {
  x: number;
  y: number;
}

/**
 * Draws a line using Bresenham's integer algorithm.
 */
export function drawLine(
  surface: Surface,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  g: number,
  b: number,
  a: number,
  onPixel?: (x: number, y: number) => void,
): void {
  x0 = Math.floor(x0);
  y0 = Math.floor(y0);
  x1 = Math.floor(x1);
  y1 = Math.floor(y1);

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    surface.setPixel(x0, y0, r, g, b, a);
    if (onPixel) onPixel(x0, y0);

    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Computes barycentric coordinates (u, v, w) for a point P relative to triangle (A, B, C).
 */
export function getBarycentric(p: Point, a: Point, b: Point, c: Point) {
  const v0 = { x: b.x - a.x, y: b.y - a.y };
  const v1 = { x: c.x - a.x, y: c.y - a.y };
  const v2 = { x: p.x - a.x, y: p.y - a.y };
  const d00 = v0.x * v0.x + v0.y * v0.y;
  const d01 = v0.x * v1.x + v0.y * v1.y;
  const d11 = v1.x * v1.x + v1.y * v1.y;
  const d20 = v2.x * v0.x + v2.y * v0.y;
  const d21 = v2.x * v1.x + v2.y * v1.y;
  const denom = d00 * d11 - d01 * d01;

  if (Math.abs(denom) < 1e-6) return null; // Degenerate triangle

  const v = (d11 * d20 - d01 * d21) / denom;
  const w = (d00 * d21 - d01 * d20) / denom;
  const u = 1.0 - v - w;
  return { u, v, w };
}

/**
 * Draws a triangle with interpolated vertex colors (Gouraud Shading).
 */
export function drawGradientTriangle(
  surface: Surface,
  vertices: [Point, Point, Point],
  colors: [
    { r: number; g: number; b: number; a: number },
    { r: number; g: number; b: number; a: number },
    { r: number; g: number; b: number; a: number },
  ],
  matrix: Matrix,
): void {
  const p0 = matrix.apply(vertices[0].x, vertices[0].y);
  const p1 = matrix.apply(vertices[1].x, vertices[1].y);
  const p2 = matrix.apply(vertices[2].x, vertices[2].y);

  const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)));
  const maxX = Math.min(surface.width - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
  const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)));
  const maxY = Math.min(surface.height - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const bc = getBarycentric({ x: x + 0.5, y: y + 0.5 }, p0, p1, p2);
      if (bc && bc.u >= 0 && bc.v >= 0 && bc.w >= 0) {
        const r = colors[0].r * bc.u + colors[1].r * bc.v + colors[2].r * bc.w;
        const g = colors[0].g * bc.u + colors[1].g * bc.v + colors[2].g * bc.w;
        const b = colors[0].b * bc.u + colors[1].b * bc.v + colors[2].b * bc.w;
        const a = colors[0].a * bc.u + colors[1].a * bc.v + colors[2].a * bc.w;
        surface.setPixel(x, y, r, g, b, a);
      }
    }
  }
}

/**
 * Checks if a point is inside a convex polygon using the cross product method.
 */
function isPointInPolygon(p: Point, vertices: Point[]): boolean {
  let lastSide = 0;
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const side = (v2.x - v1.x) * (p.y - v1.y) - (v2.y - v1.y) * (p.x - v1.x);
    if (side === 0) continue;
    const currentSide = side > 0 ? 1 : -1;
    if (lastSide === 0) {
      lastSide = currentSide;
    } else if (lastSide !== currentSide) {
      return false;
    }
  }
  return true;
}

/**
 * Draws a transformed convex polygon on a surface.
 */
export function drawPolygon(
  surface: Surface,
  vertices: Point[],
  matrix: Matrix,
  r: number,
  g: number,
  b: number,
  a: number,
  onPixel?: (x: number, y: number) => void,
): void {
  if (vertices.length < 3) return;
  const transformedVertices = vertices.map((v) => matrix.apply(v.x, v.y));
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const v of transformedVertices) {
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  }
  const startX = Math.max(0, Math.floor(minX));
  const endX = Math.min(surface.width - 1, Math.ceil(maxX));
  const startY = Math.max(0, Math.floor(minY));
  const endY = Math.min(surface.height - 1, Math.ceil(maxY));

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const sourcePoint = matrix.applyInverse(x + 0.5, y + 0.5);
      if (isPointInPolygon(sourcePoint, vertices)) {
        surface.setPixel(x, y, r, g, b, a);
        if (onPixel) onPixel(x, y);
      }
    }
  }
}

/**
 * Downsamples a high-resolution surface to a target surface using box filtering.
 * scale is the ratio (e.g. 2 means src is 2x larger than dst)
 */
export function downsample(src: Surface, dst: Surface, scale: number): void {
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      const count = scale * scale;

      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const p = src.getPixel(x * scale + sx, y * scale + sy);
          r += p.r;
          g += p.g;
          b += p.b;
          a += p.a;
        }
      }

      dst.setPixel(x, y, r / count, g / count, b / count, a / count);
    }
  }
}

/**
 * Helper to wrap coordinates based on the selected mode.
 * Returns coordinates in pixels.
 */
function wrapCoordinate(
  v: number,
  size: number,
  mode: 'clamp' | 'transparent' | 'repeat' | 'mirror',
): number {
  if (mode === 'repeat') {
    const normV = v / size;
    const wrapped = normV - Math.floor(normV);
    return wrapped * size;
  }
  if (mode === 'mirror') {
    const normV = v / size;
    const wrapped = Math.abs(((normV + 1) % 2) - 1);
    return wrapped * size;
  }
  // Default for clamp/transparent is handled in the sampler
  return v;
}

/**
 * Samples a surface at (x, y) using nearest neighbor interpolation.
 */
export function sampleNearest(
  surface: Surface,
  x: number,
  y: number,
  wrap: 'clamp' | 'transparent' | 'repeat' | 'mirror' = 'transparent',
) {
  const wx = wrapCoordinate(x, surface.width, wrap);
  const wy = wrapCoordinate(y, surface.height, wrap);

  const ix = Math.round(wx);
  const iy = Math.round(wy);

  if (ix < 0 || ix >= surface.width || iy < 0 || iy >= surface.height) {
    if (wrap === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    return surface.getPixel(
      Math.max(0, Math.min(ix, surface.width - 1)),
      Math.max(0, Math.min(iy, surface.height - 1)),
    );
  }
  return surface.getPixel(ix, iy);
}

/**
 * Samples a surface at (x, y) using bilinear interpolation.
 */
export function sampleBilinear(
  surface: Surface,
  x: number,
  y: number,
  wrap: 'clamp' | 'transparent' | 'repeat' | 'mirror' = 'transparent',
) {
  const wx = wrapCoordinate(x, surface.width, wrap);
  const wy = wrapCoordinate(y, surface.height, wrap);

  const x0 = Math.floor(wx);
  const y0 = Math.floor(wy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const clampX = (v: number) => Math.max(0, Math.min(v, surface.width - 1));
  const clampY = (v: number) => Math.max(0, Math.min(v, surface.height - 1));

  const u = wx - x0;
  const v = wy - y0;

  // For wrapping modes, we should wrap the neighbor coordinates too
  const getP = (px: number, py: number) => {
    if (wrap === 'repeat' || wrap === 'mirror') {
      const wpx = wrapCoordinate(px, surface.width, wrap);
      const wpy = wrapCoordinate(py, surface.height, wrap);
      return surface.getPixel(Math.floor(wpx), Math.floor(wpy));
    }
    return surface.getPixel(clampX(px), clampY(py));
  };

  if (wx < 0 || wx >= surface.width || wy < 0 || wy >= surface.height) {
    if (
      wrap === 'transparent' &&
      (wx < -0.5 || wx > surface.width - 0.5 || wy < -0.5 || wy > surface.height - 0.5)
    ) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
  }

  const p00 = getP(x0, y0);
  const p10 = getP(x1, y0);
  const p01 = getP(x0, y1);
  const p11 = getP(x1, y1);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  return {
    r: lerp(lerp(p00.r, p10.r, u), lerp(p01.r, p11.r, u), v),
    g: lerp(lerp(p00.g, p10.g, u), lerp(p01.g, p11.g, u), v),
    b: lerp(lerp(p00.b, p10.b, u), lerp(p01.b, p11.b, u), v),
    a: lerp(lerp(p00.a, p10.a, u), lerp(p01.a, p11.a, u), v),
  };
}

/**
 * Draws a source surface onto a destination surface using a transformation matrix.
 */
export function drawSurface(
  dst: Surface,
  src: Surface,
  matrix: Matrix,
  interpolation: 'nearest' | 'bilinear' = 'bilinear',
  wrap: 'clamp' | 'transparent' | 'repeat' | 'mirror' = 'transparent',
): void {
  const corners = [
    { x: 0, y: 0 },
    { x: src.width, y: 0 },
    { x: src.width, y: src.height },
    { x: 0, y: src.height },
  ];
  const transformedCorners = corners.map((c) => matrix.apply(c.x, c.y));
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const c of transformedCorners) {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y);
    maxY = Math.max(maxY, c.y);
  }

  // Expansion for Repeat/Mirror: we iterate over the destination's bounds
  // as the texture might cover the entire destination.
  // For 'clamp' or 'transparent', we can use the transformed bounds.
  let startX = Math.max(0, Math.floor(minX));
  let endX = Math.min(dst.width - 1, Math.ceil(maxX));
  let startY = Math.max(0, Math.floor(minY));
  let endY = Math.min(dst.height - 1, Math.ceil(maxY));

  if (wrap === 'repeat' || wrap === 'mirror') {
    startX = 0;
    endX = dst.width - 1;
    startY = 0;
    endY = dst.height - 1;
  }

  const sampler = interpolation === 'nearest' ? sampleNearest : sampleBilinear;

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const srcPoint = matrix.applyInverse(x + 0.5, y + 0.5);
      const sampled = sampler(src, srcPoint.x, srcPoint.y, wrap);
      if (sampled.a > 0) {
        // Simple alpha blending for now (src-over)
        if (sampled.a === 255) {
          dst.setPixel(x, y, sampled.r, sampled.g, sampled.b, 255);
        } else {
          // If we want full PD blending, we should use the blending module
          // For texture lesson, simple overlay is enough or skip if a=0
          const dstP = dst.getPixel(x, y);
          const alpha = sampled.a / 255;
          const invAlpha = 1 - alpha;
          dst.setPixel(
            x,
            y,
            sampled.r * alpha + dstP.r * invAlpha,
            sampled.g * alpha + dstP.g * invAlpha,
            sampled.b * alpha + dstP.b * invAlpha,
            Math.max(sampled.a, dstP.a),
          );
        }
      }
    }
  }
}
