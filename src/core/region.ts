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
    // In a real Pixman-like implementation, we would normalize/validate these here.
    // For now, we assume provided rects are non-overlapping.
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
    // Simple linear search. For complex regions, we could use the bounds first
    // or keep rects sorted by Y then X.
    for (const r of this.rects) {
      if (x >= r.x1 && x < r.x2 && y >= r.y1 && y < r.y2) {
        return true;
      }
    }
    return false;
  }
}
