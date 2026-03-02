import { describe, it, expect } from 'vitest';
import { Matrix } from '../core/matrix';

describe('Matrix', () => {
  it('should initialize as an identity matrix', () => {
    const m = new Matrix();
    // Identity: 
    // 1 0 0
    // 0 1 0
    expect(m.a).toBe(1);
    expect(m.b).toBe(0);
    expect(m.c).toBe(0);
    expect(m.d).toBe(1);
    expect(m.tx).toBe(0);
    expect(m.ty).toBe(0);
  });

  it('should create a translation matrix', () => {
    const m = Matrix.translation(10, 20);
    expect(m.tx).toBe(10);
    expect(m.ty).toBe(20);
    expect(m.a).toBe(1);
    expect(m.d).toBe(1);
  });

  it('should create a scaling matrix', () => {
    const m = Matrix.scaling(2, 3);
    expect(m.a).toBe(2);
    expect(m.d).toBe(3);
    expect(m.tx).toBe(0);
    expect(m.ty).toBe(0);
  });

  it('should create a rotation matrix', () => {
    const angle = Math.PI / 2; // 90 degrees
    const m = Matrix.rotation(angle);
    // cos(90) = 0, sin(90) = 1
    expect(m.a).toBeCloseTo(0);
    expect(m.b).toBeCloseTo(1);
    expect(m.c).toBeCloseTo(-1);
    expect(m.d).toBeCloseTo(0);
  });

  it('should multiply two matrices correctly', () => {
    // M1: Translate(10, 20)
    // M2: Scale(2, 2)
    // Result should be Scale then Translate: x' = x*2 + 10, y' = y*2 + 20
    const m1 = Matrix.translation(10, 20);
    const m2 = Matrix.scaling(2, 2);
    const result = m1.multiply(m2);

    expect(result.a).toBe(2);
    expect(result.d).toBe(2);
    expect(result.tx).toBe(10);
    expect(result.ty).toBe(20);
  });

  it('should invert a matrix correctly', () => {
    const m = Matrix.translation(10, 20);
    const inv = m.invert();
    expect(inv.tx).toBe(-10);
    expect(inv.ty).toBe(-20);

    const m2 = Matrix.scaling(2, 4);
    const inv2 = m2.invert();
    expect(inv2.a).toBe(0.5);
    expect(inv2.d).toBe(0.25);
  });

  it('should yield identity when multiplying a matrix by its inverse', () => {
    // Arbitrary matrix
    const m = Matrix.translation(10, 20).multiply(Matrix.rotation(Math.PI / 4)).multiply(Matrix.scaling(2, 3));
    const inv = m.invert();
    const result = m.multiply(inv);

    expect(result.a).toBeCloseTo(1);
    expect(result.b).toBeCloseTo(0);
    expect(result.c).toBeCloseTo(0);
    expect(result.d).toBeCloseTo(1);
    expect(result.tx).toBeCloseTo(0);
    expect(result.ty).toBeCloseTo(0);
  });

  it('should apply transformation to a point', () => {
    const m = Matrix.translation(10, 20);
    const p = m.apply(1, 2);
    expect(p.x).toBe(11);
    expect(p.y).toBe(22);

    const m2 = Matrix.scaling(2, 3);
    const p2 = m2.apply(1, 1);
    expect(p2.x).toBe(2);
    expect(p2.y).toBe(3);

    const m3 = Matrix.rotation(Math.PI / 2);
    const p3 = m3.apply(1, 0); // Rotate (1,0) 90 deg -> (0, 1)
    expect(p3.x).toBeCloseTo(0);
    expect(p3.y).toBeCloseTo(1);
  });

  it('should apply inverse transformation correctly', () => {
    const m = Matrix.translation(10, 20).multiply(Matrix.scaling(2, 2));
    // (1, 1) -> Scale(2,2) -> (2, 2) -> Translate(10,20) -> (12, 22)
    const p = m.applyInverse(12, 22);
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(1);
  });
});
