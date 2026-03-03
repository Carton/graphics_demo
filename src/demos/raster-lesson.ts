import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { Matrix } from '../core/matrix';
import { drawLine, drawGradientTriangle, downsample } from '../core/rasterization';
import type { Lesson, LessonManager } from '../main';

export class RasterLesson implements Lesson {
  id = 'raster';
  title = 'Rasterization & SSAA';

  private params = {
    mode: 'Line' as 'Line' | 'GradientTriangle',
    ssaa: 1 as 1 | 2,
    lineCount: 10,
    rotation: 0,
    showScan: false,
    scanProgress: 1.0,
  };

  private ssaaSurface: Surface | null = null;
  private manager: LessonManager | null = null;

  init(surface: Surface, pane: Pane, manager: LessonManager): void {
    this.manager = manager;
    pane.addBinding(this.params, 'mode', {
      options: { Line: 'Line', Gradient: 'GradientTriangle' },
    });
    pane.addBinding(this.params, 'ssaa', { options: { 'None (1x)': 1, 'SSAA 4x (2x2)': 2 } });
    pane.addBinding(this.params, 'lineCount', { min: 1, max: 50, step: 1 });
    pane.addBinding(this.params, 'rotation', { min: 0, max: Math.PI * 2 });
    pane.addBinding(this.params, 'showScan');
    pane.addBinding(this.params, 'scanProgress', { min: 0, max: 1 });

    const btn = document.getElementById('btn-scan');
    if (btn) {
      btn.style.display = 'block';
      btn.onclick = () => {
        this.params.showScan = true;
        this.params.scanProgress = 0;
        const animate = () => {
          this.params.scanProgress += 0.01;
          if (this.params.scanProgress < 1.0) {
            requestAnimationFrame(animate);
          } else {
            this.params.scanProgress = 1.0;
          }
          this.manager?.render();
        };
        animate();
      };
    }
  }

  render(surface: Surface): void {
    const scale = this.params.ssaa;
    const logicalWidth = surface.width;
    const logicalHeight = surface.height;

    if (scale === 1) {
      surface.clear();
      this.drawScene(surface, Matrix.identity(), logicalWidth, logicalHeight);
    } else {
      if (!this.ssaaSurface || this.ssaaSurface.width !== surface.width * scale) {
        this.ssaaSurface = new Surface(surface.width * scale, surface.height * scale);
      }
      this.ssaaSurface.clear();
      const ssaaMatrix = Matrix.scaling(scale, scale);
      this.drawScene(this.ssaaSurface, ssaaMatrix, logicalWidth, logicalHeight);
      surface.clear();
      downsample(this.ssaaSurface, surface, scale);
    }
  }

  private drawScene(
    target: Surface,
    ssaaMatrix: Matrix,
    logicalWidth: number,
    logicalHeight: number,
  ) {
    const scale = this.params.ssaa;
    const transform = ssaaMatrix
      .multiply(Matrix.translation(logicalWidth / 2, logicalHeight / 2))
      .multiply(Matrix.rotation(this.params.rotation));

    let pixelCount = 0;
    const maxPixels = this.params.showScan
      ? Math.floor(10000 * this.params.scanProgress)
      : Infinity;

    const onPixel = () => {
      pixelCount++;
      return pixelCount <= maxPixels;
    };

    if (this.params.mode === 'Line') {
      const count = this.params.lineCount;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x1 = Math.cos(angle) * 180;
        const y1 = Math.sin(angle) * 180;

        const p0 = transform.apply(0, 0);
        const p1 = transform.apply(x1, y1);

        drawLine(target, p0.x, p0.y, p1.x, p1.y, 255, 255, 255, 255, (x, y) => {
          if (!onPixel()) target.setPixel(x, y, 0, 0, 0, 0); // Hide if over budget
        });

        if (scale > 1) {
          drawLine(target, p0.x + 1, p0.y, p1.x + 1, p1.y, 255, 255, 255, 255, (x, y) => {
            if (!onPixel()) target.setPixel(x, y, 0, 0, 0, 0);
          });
        }
      }
    } else {
      const vertices: [any, any, any] = [
        { x: 0, y: -150 },
        { x: 150, y: 120 },
        { x: -150, y: 120 },
      ];
      const colors: [any, any, any] = [
        { r: 255, g: 0, b: 0, a: 255 },
        { r: 0, g: 255, b: 0, a: 255 },
        { r: 0, g: 0, b: 255, a: 255 },
      ];

      // We need to wrap drawGradientTriangle to support scan animation
      // For now, let's keep it simple.
      drawGradientTriangle(target, vertices, colors, transform);
    }
  }

  updateInspector(x: number, y: number, surface: Surface): string {
    return `
      <b style="color: var(--accent)">Raster Inspector</b>
      <div style="font-size: 10px; color: #888">
        Mode: ${this.params.mode}<br/>
        SSAA: ${this.params.ssaa}x<br/>
      </div>
      <div class="math-box" style="font-size: 10px; color: #00ff00; margin-top: 10px">
        Pixel (x,y) contains ${this.params.ssaa * this.params.ssaa} samples.
      </div>
    `;
  }

  getTheoryContent(): string {
    return `
## 光栅化 (Rasterization) 与反走样 (SSAA)

光栅化是将数学描述的矢量图形（点、线、多边形）转化为屏幕上离散像素网格的过程。

### 直线光栅化：Bresenham 算法

为了在屏幕上画一条直线，最朴素的方法是使用 \`y = mx + b\`，但浮点数运算和除法非常缓慢。**Bresenham 算法**巧妙地通过累加误差（Error）将其全部转化为**整数加减法**。

\`\`\`typescript
// 整数版 Bresenham 核心逻辑
let err = dx - dy;
while (true) {
  surface.setPixel(x0, y0, r, g, b, a);
  if (x0 === x1 && y0 === y1) break;
  const e2 = 2 * err;
  if (e2 > -dy) { err -= dy; x0 += sx; }
  if (e2 < dx)  { err += dx; y0 += sy; }
}
\`\`\`

### 三角形填充与重心坐标 (Barycentric Coordinates)

要填充一个三角形并实现顶点颜色的平滑渐变（Gouraud Shading），我们需要计算当前像素 \`(x, y)\` 位于三角形三个顶点 \`(A, B, C)\` 的相对权重 \`(u, v, w)\`。

这三个权重满足：\`u + v + w = 1\`。如果且仅如果这三个值都大于等于 0，像素就在三角形内部。

\`\`\`typescript
// 计算重心坐标计算颜色插值
const bc = getBarycentric({ x: x + 0.5, y: y + 0.5 }, p0, p1, p2);
if (bc && bc.u >= 0 && bc.v >= 0 && bc.w >= 0) {
  // 根据权重混合顶点颜色
  const r = C0.r * bc.u + C1.r * bc.v + C2.r * bc.w;
  // ... G, B, A 类似
  surface.setPixel(x, y, r, g, b, a);
}
\`\`\`

### 超采样反走样 (SSAA)

光栅化固有的问题是**走样 (Aliasing)**，通常表现为物体边缘的锯齿（Jaggies）。
最暴力的反走样方法是 **SSAA (Super Sample Anti-Aliasing)**：
1. **放大渲染**：在内存中创建一个更高分辨率（例如长宽各 2 倍，即 4 倍像素）的后台 Buffer。
2. **正常光栅化**：所有的图形都在这个巨大的 Buffer 上进行绘制。
3. **降采样 (Downsample)**：在最终输出到屏幕时，将 4 个像素的颜色求平均值，合并成 1 个屏幕像素。这样边缘就会产生平滑的半透明过渡（抗锯齿）。

\`\`\`typescript
export function downsample(src: Surface, dst: Surface, scale: number): void {
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      const count = scale * scale; // 例如 2x2 = 4
      
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const p = src.getPixel(x * scale + sx, y * scale + sy);
          r += p.r; g += p.g; b += p.b; a += p.a;
        }
      }
      dst.setPixel(x, y, r / count, g / count, b / count, a / count);
    }
  }
}
\`\`\`
    `;
  }

  cleanup(): void {}
}
