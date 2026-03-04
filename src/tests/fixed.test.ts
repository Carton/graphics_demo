import { describe, it, expect } from 'vitest';
import { Fixed } from '../core/fixed';

describe('Fixed-point Math (16.16)', () => {
  it('should convert float to fixed and back', () => {
    const f = 10.5;
    const fixed = Fixed.fromFloat(f);
    expect(Fixed.toFloat(fixed)).toBe(10.5);
  });

  it('should convert negative float to fixed and back', () => {
    const f = -5.25;
    const fixed = Fixed.fromFloat(f);
    expect(Fixed.toFloat(fixed)).toBe(-5.25);
  });

  it('should implement addition', () => {
    const a = Fixed.fromFloat(10.5);
    const b = Fixed.fromFloat(5.25);
    const res = Fixed.add(a, b);
    expect(Fixed.toFloat(res)).toBe(15.75);
  });

  it('should implement subtraction', () => {
    const a = Fixed.fromFloat(10.5);
    const b = Fixed.fromFloat(5.25);
    const res = Fixed.sub(a, b);
    expect(Fixed.toFloat(res)).toBe(5.25);
  });

  it('should implement multiplication', () => {
    const a = Fixed.fromFloat(2.5);
    const b = Fixed.fromFloat(4.0);
    const res = Fixed.mul(a, b);
    expect(Fixed.toFloat(res)).toBe(10.0);
  });

  it('should convert fixed to integer (floor)', () => {
    const a = Fixed.fromFloat(10.9);
    expect(Fixed.toInt(a)).toBe(10);
    const b = Fixed.fromFloat(-1.1);
    expect(Fixed.toInt(b)).toBe(-2);
  });
});
