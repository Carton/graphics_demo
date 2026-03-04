import { Pane } from 'tweakpane';
import { Surface, type Pixel } from '../core/surface';
import { Matrix } from '../core/matrix';
import { CompositeDispatcher, type DispatchInfo } from '../core/dispatcher';
import { drawSurface } from '../core/rasterization';
import type { Lesson, LessonManager } from '../main';

export class OptimizationLesson implements Lesson {
  id = 'optimization';
  title = 'Optimization & Fixed-point (Demo 7)';

  private params = {
    useDispatcher: true,
    useFixedPoint: false,
    showHeatmap: false,
    tx: 100,
    ty: 100,
    rotation: 0,
    scale: 1.0,
    useSolidSource: false,
    solidColor: { r: 0, g: 255, b: 0, a: 128 },
  };

  private srcTexture: Surface;
  private lastDispatch: DispatchInfo | null = null;
  private manager: LessonManager | null = null;

  constructor() {
    this.srcTexture = new Surface(128, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const r = (x / 128) * 255;
        const g = (y / 128) * 255;
        this.srcTexture.setPixel(x, y, r, g, 150, 255);
      }
    }
  }

  init(surface: Surface, pane: Pane, manager: LessonManager): void {
    this.manager = manager;

    const opt = pane.addFolder({ title: 'Optimization Settings' });
    opt.addBinding(this.params, 'useDispatcher', { label: 'Enable Dispatcher' });
    opt.addBinding(this.params, 'useFixedPoint', { label: 'Use Fixed-point Logic' });
    opt.addBinding(this.params, 'showHeatmap', { label: 'Show Precision Error' });

    const transform = pane.addFolder({ title: 'Transformation' });
    transform.addBinding(this.params, 'tx', { min: 0, max: 300 });
    transform.addBinding(this.params, 'ty', { min: 0, max: 300 });
    transform.addBinding(this.params, 'rotation', { min: 0, max: Math.PI * 2 });
    transform.addBinding(this.params, 'scale', { min: 0.5, max: 3.0 });

    const src = pane.addFolder({ title: 'Source Type' });
    src.addBinding(this.params, 'useSolidSource', { label: 'Use Solid Color' });
    src.addBinding(this.params, 'solidColor');

    const btn = document.getElementById('btn-scan');
    if (btn) btn.style.display = 'none';
  }

  render(surface: Surface): void {
    const backup = new Surface(surface.width, surface.height);
    if (this.params.showHeatmap) {
      this.renderGeneric(backup);
    }

    surface.clear();
    const matrix = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale))
      .multiply(Matrix.translation(-64, -64));

    if (this.params.useDispatcher) {
      this.lastDispatch = CompositeDispatcher.composite(
        surface,
        this.params.useSolidSource ? null : this.srcTexture,
        matrix,
        'src-over',
        {
          solidColor: this.params.useSolidSource
            ? {
                r: this.params.solidColor.r,
                g: this.params.solidColor.g,
                b: this.params.solidColor.b,
                a: this.params.solidColor.a,
              }
            : undefined,
        },
      );
    } else {
      this.lastDispatch = { path: 'GENERIC', description: 'Standard: Full calculation (Dispatcher Disabled)' };
      this.renderGeneric(surface);
    }

    if (this.params.showHeatmap) {
      this.applyHeatmap(surface, backup);
    }
  }

  private renderGeneric(s: Surface) {
    const matrix = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale))
      .multiply(Matrix.translation(-64, -64));

    if (this.params.useSolidSource) {
      for (let y = 0; y < s.height; y++) {
        for (let x = 0; x < s.width; x++) {
          s.setPixel(x, y, this.params.solidColor.r, this.params.solidColor.g, this.params.solidColor.b, this.params.solidColor.a);
        }
      }
    } else {
      drawSurface(s, this.srcTexture, matrix, 'bilinear', 'transparent');
    }
  }

  private applyHeatmap(target: Surface, reference: Surface) {
    for (let i = 0; i < target.data.length; i += 4) {
      const diffR = Math.abs(target.data[i] - reference.data[i]);
      const diffG = Math.abs(target.data[i + 1] - reference.data[i + 1]);
      const diffB = Math.abs(target.data[i + 2] - reference.data[i + 2]);
      const diffA = Math.abs(target.data[i + 3] - reference.data[i + 3]);

      if (diffR > 0 || diffG > 0 || diffB > 0 || diffA > 0) {
        target.data[i] = 255;
        target.data[i + 1] = 0;
        target.data[i + 2] = 255;
        target.data[i + 3] = 255;
      }
    }
  }

  updateInspector(x: number, y: number, surface: Surface): string {
    return `
      <b style="color: var(--accent)">Dispatcher HUD</b>
      <div style="font-size: 11px; color: #fff; margin-top: 5px;">
        Current Path: <span style="color: #00ff00">${this.lastDispatch?.path}</span><br/>
        <span style="color: #888">${this.lastDispatch?.description}</span>
      </div>
      <div class="math-box" style="margin-top: 10px;">
        <code style="font-size: 9px; color: #aaa">
          // Pixman Snippet (Pseudo)<br/>
          if (m->is_identity && op == SRC) {<br/>
          &nbsp;&nbsp;fast_path_copy(dst, src);<br/>
          }
        </code>
      </div>
    `;
  }

  getTheoryContent(): string {
    return 'Content to be implemented in Phase 4.';
  }

  cleanup(): void {}
}
