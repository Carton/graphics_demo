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
    return `
## 优化调度与定点数模拟 (Optimization & Fixed-point)

本节探讨了工业级图形库（如 **Pixman**）如何通过牺牲代码简洁性来换取极致的渲染性能。

### 1. Fast Path 调度架构

在 Pixman 源码中，成千上万行的代码其实都在做同一件事：**特化优化**。
与其使用一个通用的矩阵采样循环来处理所有情况，不如针对常见的特例编写专门的极速循环（Fast Paths）。

#### 案例对比：Identity Copy
- **通用路径 (Generic)**: 读取矩阵 -> 求逆 -> 坐标变换 -> 双线性采样 -> 混合。
- **快速路径 (SRC_COPY)**: 检测到矩阵为单位阵且操作为 SRC -> **\`memcpy(dst, src)\`**。性能差距可达百倍。

在 \`dispatcher.ts\` 中，我们模拟了这种“决策树”：
\`\`\`typescript
if (isIdentity && mode === 'src') {
  return { path: 'SRC_COPY', ... };
}
\`\`\`

### 2. 定点数运算 (Fixed-point Math)

Pixman 内部主要使用 **16.16 定点数** 来存储坐标。
- **为什么不用浮点数？**
  1. 历史原因：早期硬件浮点运算慢。
  2. **确定性**: 定点数在不同 CPU 架构下表现完全一致，不会因为浮点精度舍入差异导致跨平台渲染出的图像有“一个像素”的抖动。
  3. 性能：可以使用整数位移（Shift）代替昂贵的浮点乘除。

在 \`Fixed\` 类中，我们模拟了这种逻辑：
- \`fromFloat(1.5)\` -> \`1.5 * 65536\` -> \`98304\` (整数)
- \`toInt(98304)\` -> \`98304 >> 16\` -> \`1\`

### 3. 源码映射：pixman-fast-path.c

当你阅读 Pixman 源码时，你会看到类似这样的代码：
\`\`\`c
// 对应我们的 TRANSLATE_ONLY 路径
while (n--) {
    *dst = *src;
    dst++;
    src++;
}
\`\`\`
Pixman 的强大之处在于它为每一种组合（如 \`a8r8g8b8\` + \`SrcOver\` + \`None transform\`）都准备了这样的紧凑循环。

在 Demo 中开启 **"Show Precision Error"**，你可以看到浮点数与定点数计算结果的微小差异（洋红色像素），这正是底层图形学中“亚像素精度”与“数值稳定性”博弈的缩影。
    `;
  }

  cleanup(): void {}
}
