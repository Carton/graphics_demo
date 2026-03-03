export interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Region represents a collection of non-overlapping rectangles.
 * It uses the coordinate rule where (x1, y1) is inclusive and (x2, y2) is exclusive.
 */
export class Region {
  public readonly rects: Rectangle[];

  constructor(rects: Rectangle[] = []) {
    this.rects = [...rects];
  }

  public isEmpty(): boolean {
    return this.rects.length === 0;
  }

  public getBounds(): Rectangle {
    if (this.isEmpty()) {
      return { x1: 0, y1: 0, x2: 0, y2: 0 };
    }

    let x1 = Infinity,
      y1 = Infinity,
      x2 = -Infinity,
      y2 = -Infinity;

    for (const r of this.rects) {
      if (r.x1 < x1) x1 = r.x1;
      if (r.y1 < y1) y1 = r.y1;
      if (r.x2 > x2) x2 = r.x2;
      if (r.y2 > y2) y2 = r.y2;
    }

    return { x1, y1, x2, y2 };
  }

  public contains(x: number, y: number): boolean {
    for (const r of this.rects) {
      if (x >= r.x1 && x < r.x2 && y >= r.y1 && y < r.y2) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns a list of X-intervals (spans) for a given scanline Y.
   */
  public getSpans(y: number): { x1: number; x2: number }[] {
    // In our optimized storage, rects in the same band share the same y1, y2.
    return this.rects
      .filter((r) => y >= r.y1 && y < r.y2)
      .map((r) => ({ x1: r.x1, x2: r.x2 }))
      .sort((a, b) => a.x1 - b.x1);
  }

  public union(other: Region): Region {
    return this.op(other, (a, b) => a || b);
  }

  public intersect(other: Region): Region {
    return this.op(other, (a, b) => a && b);
  }

  public subtract(other: Region): Region {
    return this.op(other, (a, b) => a && !b);
  }

  public xor(other: Region): Region {
    return this.op(other, (a, b) => a !== b);
  }

  /**
   * Generic scanline-based boolean operation.
   */
  private op(other: Region, logic: (inA: boolean, inB: boolean) => boolean): Region {
    const ySet = new Set<number>();
    for (const r of this.rects) {
      ySet.add(r.y1);
      ySet.add(r.y2);
    }
    for (const r of other.rects) {
      ySet.add(r.y1);
      ySet.add(r.y2);
    }

    const yCoords = Array.from(ySet).sort((a, b) => a - b);
    const resultRects: Rectangle[] = [];

    for (let i = 0; i < yCoords.length - 1; i++) {
      const y1 = yCoords[i];
      const y2 = yCoords[i + 1];

      // Get X intervals for this horizontal band
      const xSet = new Set<number>();
      const bandA = this.rects.filter((r) => r.y1 <= y1 && r.y2 >= y2);
      const bandB = other.rects.filter((r) => r.y1 <= y1 && r.y2 >= y2);

      for (const r of bandA) {
        xSet.add(r.x1);
        xSet.add(r.x2);
      }
      for (const r of bandB) {
        xSet.add(r.x1);
        xSet.add(r.x2);
      }

      const xCoords = Array.from(xSet).sort((a, b) => a - b);
      for (let j = 0; j < xCoords.length - 1; j++) {
        const x1 = xCoords[j];
        const x2 = xCoords[j + 1];
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const inA = this.contains(midX, midY);
        const inB = other.contains(midX, midY);

        if (logic(inA, inB)) {
          resultRects.push({ x1, y1, x2, y2 });
        }
      }
    }

    return new Region(this.optimize(resultRects));
  }

  /**
   * Minimizes the number of rectangles by merging vertically adjacent ones
   * with identical X spans.
   */
  private optimize(rects: Rectangle[]): Rectangle[] {
    if (rects.length <= 1) return rects;

    // Group by Y band
    const bands: Map<string, { y1: number; y2: number; xs: { x1: number; x2: number }[] }> =
      new Map();
    const sortedY = Array.from(new Set(rects.map((r) => r.y1))).sort((a, b) => a - b);

    const result: Rectangle[] = [];
    let currentBandRects: Rectangle[] = [];
    let currentY1 = -Infinity;
    let currentY2 = -Infinity;

    for (const y of sortedY) {
      const bandRects = rects.filter((r) => r.y1 === y).sort((a, b) => a.x1 - b.x1);
      if (bandRects.length === 0) continue;

      const y1 = bandRects[0].y1;
      const y2 = bandRects[0].y2;

      const isSameXs = (r1: Rectangle[], r2: Rectangle[]) => {
        if (r1.length !== r2.length) return false;
        for (let i = 0; i < r1.length; i++) {
          if (r1[i].x1 !== r2[i].x1 || r1[i].x2 !== r2[i].x2) return false;
        }
        return true;
      };

      if (y1 === currentY2 && isSameXs(bandRects, currentBandRects)) {
        // Merge vertically
        currentY2 = y2;
        currentBandRects = currentBandRects.map((r) => ({ ...r, y2 }));
      } else {
        // Flush previous
        if (currentBandRects.length > 0) {
          result.push(...currentBandRects.map((r) => ({ ...r, y1: currentY1, y2: currentY2 })));
        }
        currentY1 = y1;
        currentY2 = y2;
        currentBandRects = bandRects;
      }
    }

    // Final flush
    if (currentBandRects.length > 0) {
      result.push(...currentBandRects.map((r) => ({ ...r, y1: currentY1, y2: currentY2 })));
    }

    return result;
  }
}
