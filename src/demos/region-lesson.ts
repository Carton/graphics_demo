import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { Region, type Rectangle } from '../core/region';
import { drawLine } from '../core/rasterization';
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
      for (let y = Math.max(0, Math.floor(rect.y1)); y < Math.min(surface.height, Math.ceil(rect.y2)); y++) {
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
    drawLine(s, rect.x1, rect.y1, rect.x2, rect.y1, r, g, b, a);
    drawLine(s, rect.x2, rect.y1, rect.x2, rect.y2, r, g, b, a);
    drawLine(s, rect.x2, rect.y2, rect.x1, rect.y2, r, g, b, a);
    drawLine(s, rect.x1, rect.y2, rect.x1, rect.y1, r, g, b, a);
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
    return `
## 区域管理与裁剪 (Region Management & Clipping)

在像 X11、Pixman 或各种 2D 图形库中，**区域 (Region)** 是一个核心概念，用于精确控制渲染范围，从而减少不必要的绘制以提升性能。

### 1. 区域的底层数据结构

我们并不用多边形来存储区域，而是使用 **一组互不重叠的轴对齐矩形 (List of Non-overlapping Rectangles)**。
这种设计带来了几个显著优势：
- 极其快速的**点包含 (Contains)** 检查。
- 高效的**扫描线填充 (Scanline Fill)** 集成。
- 方便执行集合论上的布尔运算。

矩形遵循左闭右开原则：\`[x1, x2)\` 和 \`[y1, y2)\`。

### 2. 区域的布尔运算

图形系统支持复杂的区域组合，比如 Union (并集)、Intersect (交集)、Subtract (差集) 和 XOR (异或)。

其底层实现通常采用 **扫描线合并算法 (Scanline Merge Algorithm)**：
1. **收集 Y 轴条带**：找出所有参与运算矩形的上下边界 (Y坐标)，将其切分为一系列水平条带 (Bands)。
2. **一维布尔运算**：在每个 Y 条带内，提取所有的 X 轴区间。对这两组 X 轴区间执行简单的一维布尔逻辑运算。
3. **垂直优化 (Vertical Optimization)**：如果两个垂直相邻的 Y 条带拥有完全相同的 X 区间集合，则将它们上下合并成一个更大的矩形。

在 Demo 中，你可以勾选 "Show Rects" 选项，直观地观察到经过运算并自动优化合并后的不重叠矩形集合。

### 3. 高效扫描线裁剪

有了区域后，我们如何在渲染时应用它？

最笨的方法是在写入每个像素时，都调用 \`region.contains(x, y)\`：
\`\`\`typescript
if (this.clipRegion && !this.clipRegion.contains(x, y)) return;
// setPixel(x, y, color)
\`\`\`
但这种方法极慢。

**高效的扫描线裁剪 (Scanline Clipping)**
图形绘制（比如填充三角形）本质上是一行行画横线的。我们可以一次性处理一整行：
1. 当我们要填充 \`y\` 行的 \`[x1, x2]\` 时。
2. 调用 \`region.getSpans(y)\`，它会快速返回该区域在 \`y\` 行的所有有效 X 区间。
3. 将我们原本要画的 \`[x1, x2]\` 与这些有效区间求交集，得到若干个较短的 \`[clip_x1, clip_x2]\`。
4. 直接使用紧凑的 \`for\` 循环去填充这些安全的区间，彻底避免了逐像素的区域判断分支！
    `;
  }

  cleanup(): void {
    //
  }
}
