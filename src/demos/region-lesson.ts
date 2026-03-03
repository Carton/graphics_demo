import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { Region, Rectangle } from '../core/region';
import type { Lesson, LessonManager } from '../main';

export class RegionLesson implements Lesson {
  id = 'region';
  title = 'Region Management & Clipping (Demo 5)';

  private params = {
    operation: 'union' as 'union' | 'intersect' | 'subtract' | 'xor',
    showDecomposition: true,
    showMask: false,
    rect1: { x: 50, y: 50, w: 100, h: 100 },
    rect2: { x: 100, y: 100, w: 100, h: 100 },
  };

  private region1: Region = new Region();
  private region2: Region = new Region();
  private resultRegion: Region = new Region();

  init(surface: Surface, pane: Pane, manager: LessonManager): void {
    const folder = pane.addFolder({ title: 'Boolean Operations' });
    folder.addBinding(this.params, 'operation', {
      options: {
        Union: 'union',
        Intersect: 'intersect',
        Subtract: 'subtract',
        XOR: 'xor',
      },
    });
    folder.addBinding(this.params, 'showDecomposition', { label: 'Show Rects' });
    folder.addBinding(this.params, 'showMask', { label: 'Test Clipping Mask' });

    const r1 = pane.addFolder({ title: 'Region A (Blue)' });
    r1.addBinding(this.params.rect1, 'x', { min: 0, max: 300 });
    r1.addBinding(this.params.rect1, 'y', { min: 0, max: 300 });

    const r2 = pane.addFolder({ title: 'Region B (Red)' });
    r2.addBinding(this.params.rect2, 'x', { min: 0, max: 300 });
    r2.addBinding(this.params.rect2, 'y', { min: 0, max: 300 });

    const btn = document.getElementById('btn-scan');
    if (btn) btn.style.display = 'none';
  }

  render(surface: Surface): void {
    surface.clear();
    surface.clipRegion = null;

    this.region1 = new Region([
      {
        x1: this.params.rect1.x,
        y1: this.params.rect1.y,
        x2: this.params.rect1.x + this.params.rect1.w,
        y2: this.params.rect1.y + this.params.rect1.h,
      },
    ]);

    this.region2 = new Region([
      {
        x1: this.params.rect2.x,
        y1: this.params.rect2.y,
        x2: this.params.rect2.x + this.params.rect2.w,
        y2: this.params.rect2.y + this.params.rect2.h,
      },
    ]);

    // Perform operation
    switch (this.params.operation) {
      case 'union':
        this.resultRegion = this.region1.union(this.region2);
        break;
      case 'intersect':
        this.resultRegion = this.region1.intersect(this.region2);
        break;
      case 'subtract':
        this.resultRegion = this.region1.subtract(this.region2);
        break;
      case 'xor':
        this.resultRegion = this.region1.xor(this.region2);
        break;
    }

    if (this.params.showMask) {
      // Demo clipping: draw a gradient restricted by the region
      surface.clipRegion = this.resultRegion;
      for (let y = 0; y < surface.height; y++) {
        const r = (y / surface.height) * 255;
        surface.fillScanline(y, 0, surface.width, r, 128, 255 - r, 255);
      }
    } else {
      // Draw result region with decomposition
      this.drawRegion(surface, this.resultRegion, 0, 255, 0, 100);

      // Outline the source regions
      this.drawRegionOutline(surface, this.region1, 0, 100, 255, 255);
      this.drawRegionOutline(surface, this.region2, 255, 0, 0, 255);
    }
  }

  private drawRegion(surface: Surface, r: Region, red: number, g: number, b: number, a: number) {
    for (const rect of r.rects) {
      for (let y = rect.y1; y < rect.y2; y++) {
        surface.fillScanline(y, rect.x1, rect.x2, red, g, b, a);
      }
      if (this.params.showDecomposition) {
        this.drawRectOutline(surface, rect, 255, 255, 255, 150);
      }
    }
  }

  private drawRegionOutline(
    surface: Surface,
    r: Region,
    red: number,
    g: number,
    b: number,
    a: number,
  ) {
    for (const rect of r.rects) {
      this.drawRectOutline(surface, rect, red, g, b, a);
    }
  }

  private drawRectOutline(
    s: Surface,
    rect: Rectangle,
    r: number,
    g: number,
    b: number,
    a: number,
  ) {
    import('../core/rasterization').then((mod) => {
      mod.drawLine(s, rect.x1, rect.y1, rect.x2, rect.y1, r, g, b, a);
      mod.drawLine(s, rect.x2, rect.y1, rect.x2, rect.y2, r, g, b, a);
      mod.drawLine(s, rect.x2, rect.y2, rect.x1, rect.y2, r, g, b, a);
      mod.drawLine(s, rect.x1, rect.y2, rect.x1, rect.y1, r, g, b, a);
    });
  }

  updateInspector(x: number, y: number, surface: Surface): string {
    const inRegion = this.resultRegion.contains(x, y);
    const rectCount = this.resultRegion.rects.length;

    return `
      <b style="color: var(--accent)">Region Inspector</b>
      <div style="font-size: 10px; color: #888">
        Op: ${this.params.operation.toUpperCase()}<br/>
        Inside: <span style="color: ${inRegion ? '#00ff00' : '#ff4444'}">${inRegion}</span><br/>
        Complex Rects: ${rectCount}
      </div>
      <div class="math-box" style="margin-top: 10px;">
        <code style="font-size: 9px; color: #aaa">
          Region = { R1, R2, ... Rn }<br/>
          Ri ∩ Rj = ∅
        </code>
      </div>
    `;
  }

  getTheoryContent(): string {
    return 'Content to be implemented in Phase 4.';
  }

  cleanup(): void {
    //
  }
}
