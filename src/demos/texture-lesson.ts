import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { Matrix } from '../core/matrix';
import { drawSurface } from '../core/rasterization';
import type { Lesson, LessonManager } from '../main';

export class TextureLesson implements Lesson {
  id = 'texture';
  title = 'Advanced Texture Mapping (Demo 4)';

  private params = {
    tx: 200,
    ty: 200,
    rotation: 0,
    scale: 1,
    interpolation: 'bilinear' as 'nearest' | 'bilinear',
    wrap: 'repeat' as 'clamp' | 'transparent' | 'repeat' | 'mirror',
    showGrid: true,
  };

  private texture: Surface;
  private manager: LessonManager | null = null;

  constructor() {
    // Create a 64x64 test pattern texture
    this.texture = new Surface(64, 64);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        // Grid pattern
        if ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) {
          this.texture.setPixel(x, y, 240, 240, 240, 255); // Near white
        } else {
          this.texture.setPixel(x, y, x * 4, y * 4, 128, 255); // Gradient
        }
        // Markers
        if (x < 4 && y < 4) this.texture.setPixel(x, y, 255, 0, 0, 255); // Red TL
        if (x > 60 && y > 60) this.texture.setPixel(x, y, 0, 255, 0, 255); // Green BR
      }
    }
  }

  init(surface: Surface, pane: Pane, manager: LessonManager): void {
    this.manager = manager;

    const folder = pane.addFolder({ title: 'Texture Settings' });
    folder.addBinding(this.params, 'interpolation', {
      options: { 'Nearest Neighbor': 'nearest', Bilinear: 'bilinear' },
    });
    folder.addBinding(this.params, 'wrap', {
      options: {
        Clamp: 'clamp',
        Transparent: 'transparent',
        Repeat: 'repeat',
        Mirror: 'mirror',
      },
    });
    folder.addBinding(this.params, 'showGrid', { label: 'Show UV Grid' });

    const transform = pane.addFolder({ title: 'Transformation' });
    transform.addBinding(this.params, 'tx', { min: 0, max: 400, label: 'Offset X' });
    transform.addBinding(this.params, 'ty', { min: 0, max: 400, label: 'Offset Y' });
    transform.addBinding(this.params, 'rotation', { min: 0, max: Math.PI * 2, label: 'Rotation' });
    transform.addBinding(this.params, 'scale', { min: 0.1, max: 10, label: 'Scale' });

    const btn = document.getElementById('btn-scan');
    if (btn) btn.style.display = 'none';
  }

  render(surface: Surface): void {
    surface.clear();

    const matrix = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale))
      .multiply(Matrix.translation(-32, -32));

    drawSurface(surface, this.texture, matrix, this.params.interpolation, this.params.wrap);

    if (this.params.showGrid) {
      this.drawUVGrid(surface, matrix);
    }
  }

  private drawUVGrid(surface: Surface, matrix: Matrix) {
    // Draw 8x8 grid lines
    for (let i = 0; i <= 8; i++) {
      const v = i * 8;
      // Horizontal
      this.drawTransformedLine(surface, matrix, 0, v, 64, v, 255, 255, 0, 100);
      // Vertical
      this.drawTransformedLine(surface, matrix, v, 0, v, 64, 255, 255, 0, 100);
    }
  }

  private drawTransformedLine(
    s: Surface,
    m: Matrix,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ) {
    const p0 = m.apply(x0, y0);
    const p1 = m.apply(x1, y1);
    // Simple Bresenham already in core
    import('../core/rasterization').then((mod) => {
      mod.drawLine(s, p0.x, p0.y, p1.x, p1.y, r, g, b, a);
    });
  }

  updateInspector(x: number, y: number, surface: Surface): string {
    const matrix = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale))
      .multiply(Matrix.translation(-32, -32));

    const srcPoint = matrix.applyInverse(x + 0.5, y + 0.5);

    return `
      <b style="color: var(--accent)">Texture Inspector</b>
      <div style="font-size: 10px; color: #888">
        Interpolation: ${this.params.interpolation}<br/>
        Wrap: ${this.params.wrap}<br/>
        UV (px): (${srcPoint.x.toFixed(2)}, ${srcPoint.y.toFixed(2)})
      </div>
      <div class="math-box" style="margin-top: 10px;">
        ${
          this.params.interpolation === 'bilinear'
            ? `<code style="font-size: 9px; color: #00ff00">
            f(u,v) = p00(1-du)(1-dv) + p10(du)(1-dv) + p01(1-du)(v) + p11(u)(v)
          </code>`
            : 'Nearest pixel sampling active.'
        }
      </div>
    `;
  }

  getTheoryContent(): string {
    return 'Content to be implemented in Phase 3.';
  }

  cleanup(): void {}
}
