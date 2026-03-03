import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { blend, type BlendMode, premultiply } from '../core/blending';
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
    return `
## 三元合成模型 (Source, Mask, Destination)

在先前的 Demo 1 中，我们了解了 **Porter-Duff 合成规则**，也就是图层 A (Source) 与图层 B (Destination) 是如何相互混合的：\`D = S OP D\`。

然而，在工业级图形库（如 **Pixman**, Cairo, Skia）中，最底层的合成流水线通常是一个**三元模型**，引入了一个非常重要的中间层：**Mask (遮罩)**。

### 1. 核心管线公式

在 Pixman 的源码中，其核心 API \`pixman_image_composite\` 的数学模型严格定义为：
> **\`Destination = (Source IN Mask) OP Destination\`**

这意味着混合是分两步进行的：
1. **Mask 调制 (Attenuation)**：首先，提取 Mask 图像中对应像素的 Alpha 通道（通常忽略其 RGB，或 Mask 本身就是一个 \`a8\` 即只有 alpha 通道的图像）。用这个 Alpha 值来乘以 Source 图像的四个通道（预乘后）。这等价于执行了一次 \`Source IN Mask\` 的操作。
2. **OP 混合 (Blending)**：然后，拿着调制后的新 Source，根据指定的 \`Operator\` (如 SrcOver, In, Out) 与 Destination 进行最终混合。

### 2. 代码解析

在我们的实现中，为了模拟这一过程，我们提取了 Mask 的 Alpha 值，并在传入 \`blend\` 引擎前应用了调制：

\`\`\`typescript
// src 和 dst 必须是预乘(premultiplied)格式的像素
export function blend(src: Pixel, dst: Pixel, mode: BlendMode, maskAlpha: number = 255): Pixel {
  // 1. Apply mask: src' = src IN mask
  // maskAlpha 的范围是 0-255，将其归一化到 0.0-1.0
  const mf = maskAlpha / 255;
  const s = {
    r: src.r * mf,
    g: src.g * mf,
    b: src.b * mf,
    a: src.a * mf,
  };

  // 2. 提取后续混合所需的 Alpha 值
  const sa = s.a / 255;
  const da = dst.a / 255;

  // 3. 执行常规的 Porter-Duff 混合
  switch (mode) {
    case 'src-over': {
      // S + D * (1 - Sa)
      const invSa = 1 - sa;
      return {
        r: s.r + dst.r * invSa,
        g: s.g + dst.g * invSa,
        ...
      };
    }
    // ...
  }
}
\`\`\`

### 3. 为什么需要独立的 Mask 层？

在图形界面系统中，独立的 Mask 设计带来了极大的灵活性：
- **字体渲染**: 文本字形通常被缓存为仅包含 Alpha 值的位图（即 Mask）。渲染时，Source 设置为当前画笔颜色（如蓝色），通过 \`pixman_image_composite\` 就能将文字以任意颜色绘制到屏幕上。
- **矢量裁剪 (Anti-aliased Clipping)**: 在 Demo 5 中我们看到了矩形区域裁剪。但如何裁剪出一个平滑的圆形？答案是生成一个带抗锯齿边缘的圆形蒙版（Mask），然后执行复合操作。

在当前的交互沙盒中，你可以独立移动 **Source Layer** 和 **Mask Layer**，直观地感受到 Mask 是如何像一个透明的窗口一样，限制了 Source 像素对底层的影响。
    `;
  }

  cleanup(): void {}
}
