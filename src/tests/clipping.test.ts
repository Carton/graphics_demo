import { describe, it, expect } from 'vitest';
import { Surface } from '../core/surface';
import { Region } from '../core/region';
import { drawLine } from '../core/rasterization';

describe('Line Clipping', () => {
  it('should clip a horizontal line against a region', () => {
    const surface = new Surface(100, 100);
    surface.clipRegion = new Region([{ x1: 10, y1: 10, x2: 30, y2: 30 }]);

    drawLine(surface, 0, 15, 50, 15, 255, 255, 255, 255);

    expect(surface.getPixel(5, 15).a).toBe(0);
    expect(surface.getPixel(40, 15).a).toBe(0);
    expect(surface.getPixel(15, 15).a).toBe(255);
  });

  it('should only draw pixels inside the region for a diagonal line', () => {
    const sNormal = new Surface(100, 100);
    const sClipped = new Surface(100, 100);
    const region = new Region([
      { x1: 10, y1: 10, x2: 30, y2: 30 },
      { x1: 30, y1: 10, x2: 50, y2: 20 },
    ]);
    sClipped.clipRegion = region;

    const x0 = 0,
      y0 = 0,
      x1 = 60,
      y1 = 30;
    drawLine(sNormal, x0, y0, x1, y1, 255, 0, 0, 255);
    drawLine(sClipped, x0, y0, x1, y1, 255, 0, 0, 255);

    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 100; x++) {
        const pNormal = sNormal.getPixel(x, y);
        const pClipped = sClipped.getPixel(x, y);
        const inRegion = region.contains(x, y);

        if (pNormal.a > 0 && inRegion) {
          expect(pClipped.a).toBe(255);
        } else {
          expect(pClipped.a).toBe(0);
        }
      }
    }
  });
});
