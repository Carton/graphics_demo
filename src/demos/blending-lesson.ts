import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { blend, premultiply } from '../core/blending';
import type { BlendMode } from '../core/blending';
import type { Lesson, LessonManager } from '../main';

export class BlendingLesson implements Lesson {
  id = 'blending';
  title = 'Pixel Blending (Porter-Duff)';
  private params = {
    mode: 'src-over' as BlendMode,
    srcColor: { r: 255, g: 0, b: 0, a: 0.8 },
    dstColor: { r: 0, g: 255, b: 0, a: 0.8 },
  };

  private isScanning: boolean = false;
  private manager: LessonManager | null = null;

  init(surface: Surface, pane: Pane, manager: LessonManager): void {
    this.manager = manager;
    pane.addBinding(this.params, 'mode', {
      options: {
        'Source Over': 'src-over',
        Source: 'src',
        Destination: 'dst',
        Clear: 'clear',
      },
    });
    pane.addBinding(this.params, 'srcColor', { label: 'Source (Top)' });
    pane.addBinding(this.params, 'dstColor', { label: 'Destination (Bottom)' });

    const btn = document.getElementById('btn-scan');
    if (btn) {
      btn.onclick = () => this.startScan(surface);
    }
  }

  private async startScan(surface: Surface) {
    if (this.isScanning || !this.manager) return;
    this.isScanning = true;

    surface.clear();
    const w = surface.width;
    const h = surface.height;

    // Phase 1: Draw Destination
    for (let py = 50; py < 250; py++) {
      for (let px = 50; px < 250; px++) {
        surface.setPixel(
          px,
          py,
          this.params.dstColor.r,
          this.params.dstColor.g,
          this.params.dstColor.b,
          this.params.dstColor.a * 255,
        );
      }
      if (py % 10 === 0) {
        this.manager.render();
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    // Phase 2: Slow Blend Source
    const srcPixel = premultiply(
      this.params.srcColor.r,
      this.params.srcColor.g,
      this.params.srcColor.b,
      Math.round(this.params.srcColor.a * 255),
    );

    for (let py = 150; py < 350; py++) {
      for (let px = 150; px < 350; px++) {
        const dstPixel = surface.getPixel(px, py);
        const result = blend(srcPixel, dstPixel, this.params.mode);
        surface.setPixel(px, py, result.r, result.g, result.b, result.a);
      }
      if (py % 2 === 0) {
        this.manager.render();
        await new Promise((r) => setTimeout(r, 16));
      }
    }

    this.isScanning = false;
  }

  render(surface: Surface): void {
    if (this.isScanning) return;
    surface.clear();

    const w = surface.width;
    const h = surface.height;

    // Draw Dst Rect (Left half)
    this.drawSimpleRect(surface, 50, 50, 200, 200, this.params.dstColor, 'src');

    // Draw Src Rect (Right half, overlapping)
    this.drawSimpleRect(surface, 150, 150, 200, 200, this.params.srcColor, this.params.mode);
  }

  private drawSimpleRect(
    s: Surface,
    x: number,
    y: number,
    w: number,
    h: number,
    color: any,
    mode: BlendMode,
  ) {
    const srcPixel = premultiply(color.r, color.g, color.b, Math.round(color.a * 255));
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (px < 0 || px >= s.width || py < 0 || py >= s.height) continue;
        const dstPixel = s.getPixel(px, py);
        const result = blend(srcPixel, dstPixel, mode);
        s.setPixel(px, py, result.r, result.g, result.b, result.a);
      }
    }
  }

  updateInspector(x: number, y: number, surface: Surface): string {
    const p = surface.getPixel(x, y);
    const mode = this.params.mode;

    // In a real study tool, we might want to store original src/dst before blending
    // But for this demo, let's show the result and the active formula

    let formula = '';
    let colorPreview = `rgba(${p.r},${p.g},${p.b},${p.a / 255})`;

    if (mode === 'src-over') {
      formula = `
        <div style="margin-top: 10px; border-top: 1px solid #444; pt: 10px">
          <b style="color: var(--accent)">Porter-Duff: Source Over</b><br/>
          <code style="font-size: 11px">C = S + D * (1 - Sa)</code><br/>
          <div style="font-size: 10px; color: #aaa; margin-top: 5px">
            R: ${p.r.toFixed(0)} = Sr + Dr * (1 - Sa)<br/>
            G: ${p.g.toFixed(0)} = Sg + Dg * (1 - Sa)<br/>
            B: ${p.b.toFixed(0)} = Sb + Db * (1 - Sa)<br/>
            A: ${p.a.toFixed(0)} = Sa + Da * (1 - Sa)
          </div>
        </div>
      `;
    } else {
      formula = `<b style="color: var(--accent)">Mode: ${mode}</b><br/>Calculation active.`;
    }

    return `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px">
        <div style="width: 20px; height: 20px; background: ${colorPreview}; border: 1px solid #fff"></div>
        <span>Final Color</span>
      </div>
      ${formula}
    `;
  }

  getTheoryContent(): string {
    return `
## 像素合成与 Porter-Duff 规则

在 2D 图形学中，将两个带有透明度的图像叠加在一起是一个核心操作。1984年，Thomas Porter 和 Tom Duff 发表了著名的论文，定义了 12 种图像混合的代数模型，这就是我们熟知的 **Porter-Duff 合成规则**。

### 核心概念：预乘 Alpha (Premultiplied Alpha)

在进行数学公式推导前，图形系统通常会将颜色的 RGB 通道预先乘以 Alpha 通道。
传统的直观颜色 \`(R, G, B, A)\` 如果 A 是 0.5 (即 128/255)，预乘后的格式为 \`(R*A, G*A, B*A, A)\`。

为什么要预乘？因为这能极大地简化合成公式，并避免在插值和纹理采样时产生可怕的“黑边”或“白边”瑕疵。

\`\`\`typescript
export function premultiply(r: number, g: number, b: number, a: number): Pixel {
  // Alpha maps 0-255 to 0.0-1.0 internally
  const f = a / 255.0;
  return {
    r: Math.round(r * f),
    g: Math.round(g * f),
    b: Math.round(b * f),
    a: a
  };
}
\`\`\`

### 最常见的规则：Source-Over

当我们说“把图层 A 放在图层 B 上面”时，使用的就是 \`Source-Over\` 模式。其预乘后的数学公式非常优雅：

**Result = Source + Destination × (1 - SourceAlpha)**

映射到具体的代码实现上：

\`\`\`typescript
// src 和 dst 均为预乘后的像素，通道值范围 0-255
function blendSourceOver(src: Pixel, dst: Pixel): Pixel {
  // 1 - Sa (范围映射到 0.0 - 1.0)
  const invSa = 1.0 - (src.a / 255.0);
  
  return {
    r: Math.min(255, Math.round(src.r + dst.r * invSa)),
    g: Math.min(255, Math.round(src.g + dst.g * invSa)),
    b: Math.min(255, Math.round(src.b + dst.b * invSa)),
    a: Math.min(255, Math.round(src.a + dst.a * invSa))
  };
}
\`\`\`

### 其他模式
除了 Source-Over，Pixman 等底层库还支持数十种模式，例如：
- \`Source\`: 直接覆盖，丢弃底层（Result = Source）。
- \`Destination\`: 保持底层不变（Result = Destination）。
- \`Clear\`: 完全清除，返回透明像素。

*在右侧的控制面板中点击 "Slow Scan Demo"，你可以直观地观察混合运算在内存中逐像素扫描应用的过程。*
    `;
  }

  cleanup(): void {}
}
