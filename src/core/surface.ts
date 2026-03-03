import { Region } from './region';

export interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Surface represents a raw pixel buffer (RGBA8888).
 * It encapsulates a Uint8ClampedArray and provides basic pixel manipulation.
 */
export class Surface {
  public readonly data: Uint8ClampedArray;
  public readonly width: number;
  public readonly height: number;
  public clipRegion: Region | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // 4 channels (R, G, B, A) per pixel
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  /**
   * Set a pixel's color at (x, y).
   * Respects the current clipRegion if set.
   */
  public setPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }
    if (this.clipRegion && !this.clipRegion.contains(x, y)) {
      return;
    }
    const index = (y * this.width + x) * 4;
    this.data[index] = r;
    this.data[index + 1] = g;
    this.data[index + 2] = b;
    this.data[index + 3] = a;
  }

  /**
   * Get a pixel's color at (x, y).
   * Returns a transparent black pixel if out of bounds.
   */
  public getPixel(x: number, y: number): Pixel {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    const index = (y * this.width + x) * 4;
    return {
      r: this.data[index],
      g: this.data[index + 1],
      b: this.data[index + 2],
      a: this.data[index + 3],
    };
  }

  /**
   * Efficiently fills a horizontal line segment with clipping.
   */
  public fillScanline(y: number, x1: number, x2: number, r: number, g: number, b: number, a: number): void {
    y = Math.floor(y);
    if (y < 0 || y >= this.height) return;

    let spans: { x1: number; x2: number }[] = [{ x1, x2 }];

    if (this.clipRegion) {
      const regionSpans = this.clipRegion.getSpans(y);
      const intersected: { x1: number; x2: number }[] = [];
      for (const rs of regionSpans) {
        const ix1 = Math.max(x1, rs.x1);
        const ix2 = Math.min(x2, rs.x2);
        if (ix1 < ix2) {
          intersected.push({ x1: ix1, x2: ix2 });
        }
      }
      spans = intersected;
    }

    for (const span of spans) {
      const startX = Math.max(0, Math.floor(span.x1));
      const endX = Math.min(this.width, Math.ceil(span.x2));
      for (let x = startX; x < endX; x++) {
        const i = (y * this.width + x) * 4;
        this.data[i] = r;
        this.data[i + 1] = g;
        this.data[i + 2] = b;
        this.data[i + 3] = a;
      }
    }
  }

  /**
   * Fills the entire surface with a specific color.
   */
  public fill(r: number, g: number, b: number, a: number): void {
    if (!this.clipRegion) {
      for (let i = 0; i < this.data.length; i += 4) {
        this.data[i] = r;
        this.data[i + 1] = g;
        this.data[i + 2] = b;
        this.data[i + 3] = a;
      }
    } else {
      for (let y = 0; y < this.height; y++) {
        this.fillScanline(y, 0, this.width, r, g, b, a);
      }
    }
  }

  /**
   * Clears the entire surface (transparent black).
   */
  public clear(): void {
    this.data.fill(0);
  }
}
