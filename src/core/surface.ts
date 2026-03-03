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

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // 4 channels (R, G, B, A) per pixel
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  /**
   * Set a pixel's color at (x, y).
   */
  public setPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
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
   * Fills the entire surface with a specific color.
   */
  public fill(r: number, g: number, b: number, a: number): void {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }

  /**
   * Clears the entire surface (transparent black).
   */
  public clear(): void {
    this.data.fill(0);
  }
}
