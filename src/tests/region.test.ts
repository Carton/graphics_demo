import { describe, it, expect } from 'vitest';
import { Region, Rectangle } from '../core/region';

describe('Region Data Structure', () => {
  it('should be empty when created without rects', () => {
    const r = new Region();
    expect(r.isEmpty()).toBe(true);
    expect(r.rects).toHaveLength(0);
  });

  it('should compute correct bounds', () => {
    const rects: Rectangle[] = [
      { x1: 10, y1: 10, x2: 20, y2: 20 },
      { x1: 50, y1: 50, x2: 60, y2: 60 },
    ];
    const r = new Region(rects);
    const bounds = r.getBounds();
    expect(bounds).toEqual({ x1: 10, y1: 10, x2: 60, y2: 60 });
  });

  it('should detect if a point is contained', () => {
    const r = new Region([{ x1: 10, y1: 10, x2: 20, y2: 20 }]);
    expect(r.contains(15, 15)).toBe(true);
    expect(r.contains(5, 5)).toBe(false);
    expect(r.contains(10, 10)).toBe(true); // Left-inclusive
    expect(r.contains(20, 20)).toBe(false); // Right-exclusive
  });
});
