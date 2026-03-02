import { describe, it, expect } from 'vitest';
import { Surface } from '../core/surface';

describe('Surface', () => {
  it('should initialize with correct dimensions', () => {
    const width = 100;
    const height = 50;
    const surface = new Surface(width, height);
    expect(surface.width).toBe(width);
    expect(surface.height).toBe(height);
  });

  it('should have a data array of correct size', () => {
    const width = 2;
    const height = 2;
    const surface = new Surface(width, height);
    // 4 channels per pixel (RGBA)
    expect(surface.data.length).toBe(width * height * 4);
  });

  it('should be able to set and get a pixel', () => {
    const surface = new Surface(10, 10);
    const r = 255, g = 128, b = 64, a = 200;
    surface.setPixel(5, 5, r, g, b, a);
    
    const pixel = surface.getPixel(5, 5);
    expect(pixel.r).toBe(r);
    expect(pixel.g).toBe(g);
    expect(pixel.b).toBe(b);
    expect(pixel.a).toBe(a);
  });

  it('should return black transparent for out of bounds', () => {
    const surface = new Surface(10, 10);
    const pixel = surface.getPixel(11, 11);
    expect(pixel.r).toBe(0);
    expect(pixel.a).toBe(0);
  });

  it('should fill the surface with a color', () => {
    const surface = new Surface(2, 2);
    surface.fill(255, 0, 0, 255);
    const pixel = surface.getPixel(0, 0);
    const pixel2 = surface.getPixel(1, 1);
    expect(pixel.r).toBe(255);
    expect(pixel2.r).toBe(255);
  });

  it('should clear the surface', () => {
    const surface = new Surface(2, 2);
    surface.fill(255, 255, 255, 255);
    surface.clear();
    const pixel = surface.getPixel(0, 0);
    expect(pixel.r).toBe(0);
    expect(pixel.a).toBe(0);
  });
});
