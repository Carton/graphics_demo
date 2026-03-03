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

describe('Region Boolean Operations', () => {
  it('should compute union of two rectangles', () => {
    const r1 = new Region([{ x1: 0, y1: 0, x2: 10, y2: 10 }]);
    const r2 = new Region([{ x1: 5, y1: 5, x2: 15, y2: 15 }]);
    const result = r1.union(r2);

    expect(result.contains(2, 2)).toBe(true);
    expect(result.contains(7, 7)).toBe(true);
    expect(result.contains(12, 12)).toBe(true);
    expect(result.contains(16, 16)).toBe(false);
  });

  it('should compute intersection of two rectangles', () => {
    const r1 = new Region([{ x1: 0, y1: 0, x2: 10, y2: 10 }]);
    const r2 = new Region([{ x1: 5, y1: 5, x2: 15, y2: 15 }]);
    const result = r1.intersect(r2);

    expect(result.contains(7, 7)).toBe(true);
    expect(result.contains(2, 2)).toBe(false);
    expect(result.getBounds()).toEqual({ x1: 5, y1: 5, x2: 10, y2: 10 });
  });

  it('should compute subtraction of two rectangles', () => {
    const r1 = new Region([{ x1: 0, y1: 0, x2: 10, y2: 10 }]);
    const r2 = new Region([{ x1: 5, y1: 0, x2: 15, y2: 10 }]);
    const result = r1.subtract(r2);

    expect(result.contains(2, 5)).toBe(true);
    expect(result.contains(7, 5)).toBe(false);
    expect(result.getBounds()).toEqual({ x1: 0, y1: 0, x2: 5, y2: 10 });
  });

  it('should compute XOR of two rectangles', () => {
    const r1 = new Region([{ x1: 0, y1: 0, x2: 10, y2: 10 }]);
    const r2 = new Region([{ x1: 5, y1: 0, x2: 15, y2: 10 }]);
    const result = r1.xor(r2);

    expect(result.contains(2, 5)).toBe(true);
    expect(result.contains(7, 5)).toBe(false);
    expect(result.contains(12, 5)).toBe(true);
  });

  it('should optimize and merge rectangles vertically', () => {
    // Two vertically adjacent rects with same X span
    const r1 = new Region([{ x1: 0, y1: 0, x2: 10, y2: 5 }]);
    const r2 = new Region([{ x1: 0, y1: 5, x2: 10, y2: 10 }]);
    const result = r1.union(r2);

    // Result should be a single 10x10 rect
    expect(result.rects).toHaveLength(1);
    expect(result.rects[0]).toEqual({ x1: 0, y1: 0, x2: 10, y2: 10 });
  });
});
