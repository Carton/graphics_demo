import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { blend, BlendMode, premultiply } from '../core/blending';
import { Matrix } from '../core/matrix';
import { drawSurface } from '../core/rasterization';
import type { Lesson, LessonManager } from '../main';

export class CompositeLesson implements Lesson {
  id = 'composite';
  title = 'Triple-Operand Composite (Source, Mask, Dst)';

  private params = {
    operator: 'src-over' as BlendMode,
    maskType: 'circle' as 'circle' | 'rect' | 'image',
    showMaskOnly: false,
    srcPos: { x: 0, y: 0 },
    maskPos: { x: 0, y: 0 },
    maskScale: 1.0,
  };

  private srcTexture: Surface;
  private maskTexture: Surface;
  private manager: LessonManager | null = null;

  constructor() {
    // 1. Create a 256x256 Source texture (e.g., a colorful pattern)
    this.srcTexture = new Surface(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        this.srcTexture.setPixel(x, y, x, y, 128, 255);
      }
    }

    // 2. Create a 256x256 Mask surface
    this.maskTexture = new Surface(256, 256);
    this.updateMaskBuffer();
  }

  private updateMaskBuffer() {
    this.maskTexture.clear();
    const w = this.maskTexture.width;
    const h = this.maskTexture.height;
    const cx = w / 2;
    const cy = h / 2;

    if (this.params.maskType === 'circle') {
      const radius = 80 * this.params.maskScale;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const alpha = Math.max(0, Math.min(255, (radius - dist) * 2)); // Soft edge
          this.maskTexture.setPixel(x, y, 255, 255, 255, alpha);
        }
      }
    } else if (this.params.maskType === 'rect') {
      const size = 120 * this.params.maskScale;
      const x1 = cx - size / 2;
      const y1 = cy - size / 2;
      const x2 = cx + size / 2;
      const y2 = cy + size / 2;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (x >= x1 && x < x2 && y >= y1 && y < y2) {
            this.maskTexture.setPixel(x, y, 255, 255, 255, 255);
          }
        }
      }
    }
  }

  init(surface: Surface, pane: Pane, manager: LessonManager): void {
    this.manager = manager;

    const pipeline = pane.addFolder({ title: 'Composite Pipeline' });
    pipeline.addBinding(this.params, 'operator', {
      options: {
        'Source Over': 'src-over',
        'In': 'in',
        'Out': 'out',
        'Atop': 'atop',
        'XOR': 'xor',
        'Source': 'src',
        'Clear': 'clear'
      }
    });
    pipeline.addBinding(this.params, 'showMaskOnly', { label: 'Visualize Mask' });

    const srcFolder = pane.addFolder({ title: 'Source Layer' });
    srcFolder.addBinding(this.params.srcPos, 'x', { min: -200, max: 200, label: 'Offset X' });
    srcFolder.addBinding(this.params.srcPos, 'y', { min: -200, max: 200, label: 'Offset Y' });

    const maskFolder = pane.addFolder({ title: 'Mask Layer' });
    maskFolder.addBinding(this.params, 'maskType', {
      options: { Circle: 'circle', Rectangle: 'rect' }
    }).on('change', () => {
      this.updateMaskBuffer();
      this.manager?.render();
    });
    maskFolder.addBinding(this.params, 'maskScale', { min: 0.1, max: 2.0 }).on('change', () => {
      this.updateMaskBuffer();
      this.manager?.render();
    });
    maskFolder.addBinding(this.params.maskPos, 'x', { min: -200, max: 200, label: 'Offset X' });
    maskFolder.addBinding(this.params.maskPos, 'y', { min: -200, max: 200, label: 'Offset Y' });

    const btn = document.getElementById('btn-scan');
    if (btn) btn.style.display = 'none';
  }

  render(surface: Surface): void {
    surface.clear();

    if (this.params.showMaskOnly) {
      // Just render the mask for visualization
      const m = Matrix.translation(this.params.maskPos.x, this.params.maskPos.y);
      drawSurface(surface, this.maskTexture, m, 'bilinear', 'transparent');
      return;
    }

    // 1. Draw a background grid on destination
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        if ((Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0) {
          surface.setPixel(x, y, 40, 40, 40, 255);
        } else {
          surface.setPixel(x, y, 60, 60, 60, 255);
        }
      }
    }

    // 2. Perform triple-operand composite
    // pixman: dst = (src IN mask) OP dst
    // In our manual implementation, we iterate over surface pixels
    const srcM = Matrix.translation(this.params.srcPos.x, this.params.srcPos.y);
    const maskM = Matrix.translation(this.params.maskPos.x, this.params.maskPos.y);
    
    const srcInv = srcM.invert();
    const maskInv = maskM.invert();

    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        // Sample Source
        const sp = srcInv.apply(x + 0.5, y + 0.5);
        const sRaw = this.srcTexture.getPixel(Math.floor(sp.x), Math.floor(sp.y));
        const sP = premultiply(sRaw.r, sRaw.g, sRaw.b, sRaw.a);

        // Sample Mask
        const mp = maskInv.apply(x + 0.5, y + 0.5);
        const mP = this.maskTexture.getPixel(Math.floor(mp.x), Math.floor(mp.y));
        const maskAlpha = mP.a;

        // Apply Blending
        const dP = surface.getPixel(x, y);
        const result = blend(sP, dP, this.params.operator, maskAlpha);
        
        surface.setPixel(x, y, result.r, result.g, result.b, result.a);
      }
    }
  }

  updateInspector(x: number, y: number, surface: Surface): string {
    return `
      <b style="color: var(--accent)">Composite Inspector</b>
      <div style="font-size: 10px; color: #888">
        Model: (Src IN Mask) OP Dst<br/>
        Operator: ${this.params.operator}<br/>
      </div>
      <div class="math-box" style="margin-top: 10px;">
        <code style="font-size: 9px; color: #00ff00">
          S' = S * (Ma / 255)<br/>
          D = S' OP D
        </code>
      </div>
    `;
  }

  getTheoryContent(): string {
    return 'Content to be implemented in Phase 3.';
  }

  cleanup(): void {}
}
