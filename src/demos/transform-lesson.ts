import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { Matrix } from '../core/matrix';
import { drawPolygon, drawSurface } from '../core/rasterization';
import type { Lesson, LessonManager } from '../main';

export class TransformLesson implements Lesson {
  id = 'transform';
  title = '2D Affine Transformations';
  private params = {
    tx: 200,
    ty: 200,
    rotation: 0,
    scale: 1,
    mode: 'Polygon' as 'Polygon' | 'Surface',
  };

  private srcSurface: Surface;
  private isScanning: boolean = false;
  private manager: LessonManager | null = null;

  constructor() {
    this.srcSurface = new Surface(50, 50);
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        this.srcSurface.setPixel(x, y, (x / 50) * 255, (y / 50) * 255, 128, 255);
      }
    }
  }

  init(surface: Surface, pane: Pane, manager: LessonManager): void {
    this.manager = manager;
    pane.addBinding(this.params, 'mode', { options: { Polygon: 'Polygon', Surface: 'Surface' } });
    pane.addBinding(this.params, 'tx', { min: 0, max: 400 });
    pane.addBinding(this.params, 'ty', { min: 0, max: 400 });
    pane.addBinding(this.params, 'rotation', { min: 0, max: Math.PI * 2 });
    pane.addBinding(this.params, 'scale', { min: 0.1, max: 5 });

    const btn = document.getElementById('btn-scan');
    if (btn) {
      btn.onclick = () => this.startScan(surface);
    }
  }

  private async startScan(surface: Surface) {
    if (this.isScanning || !this.manager) return;
    this.isScanning = true;

    const m = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale));

    surface.clear();

    let minX, maxX, minY, maxY;

    if (this.params.mode === 'Polygon') {
      const triangle = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
      ];
      const transformed = triangle.map((v) => m.apply(v.x, v.y));
      minX = Math.floor(Math.min(...transformed.map((v) => v.x)));
      maxX = Math.ceil(Math.max(...transformed.map((v) => v.x)));
      minY = Math.floor(Math.min(...transformed.map((v) => v.y)));
      maxY = Math.ceil(Math.max(...transformed.map((v) => v.y)));

      this.drawBoundingBox(surface, minX, maxX, minY, maxY);
      this.manager.render();

      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const sourcePoint = m.applyInverse(px + 0.5, py + 0.5);
          if (sourcePoint.x >= 0 && sourcePoint.y >= 0 && sourcePoint.x + sourcePoint.y <= 100) {
            surface.setPixel(px, py, 0, 168, 255, 255);
          } else {
            surface.setPixel(px, py, 40, 40, 40, 255);
          }
        }
        this.manager.render();
        await new Promise((r) => setTimeout(r, 10));
      }
    } else {
      // Surface mode scan
      const centeredM = m.multiply(Matrix.translation(-25, -25));
      const corners = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 },
      ];
      const transformed = corners.map((v) => centeredM.apply(v.x, v.y));
      minX = Math.floor(Math.min(...transformed.map((v) => v.x)));
      maxX = Math.ceil(Math.max(...transformed.map((v) => v.x)));
      minY = Math.floor(Math.min(...transformed.map((v) => v.y)));
      maxY = Math.ceil(Math.max(...transformed.map((v) => v.y)));

      this.drawBoundingBox(surface, minX, maxX, minY, maxY);
      this.manager.render();

      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const srcPoint = centeredM.applyInverse(px + 0.5, py + 0.5);
          if (srcPoint.x >= 0 && srcPoint.x < 50 && srcPoint.y >= 0 && srcPoint.y < 50) {
            const sampled = this.srcSurface.getPixel(
              Math.floor(srcPoint.x),
              Math.floor(srcPoint.y),
            );
            surface.setPixel(px, py, sampled.r, sampled.g, sampled.b, sampled.a);
          } else {
            surface.setPixel(px, py, 40, 40, 40, 255);
          }
        }
        this.manager.render();
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    this.isScanning = false;
  }

  private drawBoundingBox(
    surface: Surface,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
  ) {
    // Clip to screen
    const sX = Math.max(0, minX);
    const eX = Math.min(surface.width - 1, maxX);
    const sY = Math.max(0, minY);
    const eY = Math.min(surface.height - 1, maxY);

    for (let x = sX; x <= eX; x++) {
      surface.setPixel(x, sY, 255, 255, 0, 255);
      surface.setPixel(x, eY, 255, 255, 0, 255);
    }
    for (let y = sY; y <= eY; y++) {
      surface.setPixel(sX, y, 255, 255, 0, 255);
      surface.setPixel(eX, y, 255, 255, 0, 255);
    }
  }

  render(surface: Surface): void {
    if (this.isScanning) return;
    surface.clear();
    const m = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale));

    if (this.params.mode === 'Polygon') {
      const triangle = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
      ];
      drawPolygon(surface, triangle, m, 0, 168, 255, 255);
    } else {
      const centeredM = m.multiply(Matrix.translation(-25, -25));
      drawSurface(surface, this.srcSurface, centeredM);
    }
  }

  updateInspector(_x: number, _y: number, _surface: Surface): string {
    const m = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale));

    return `
      <p style="margin-bottom: 5px">Affine Matrix (2x3):</p>
      <div style="background: #222; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 11px; color: var(--accent)">
        [ ${m.a.toFixed(2)}  ${m.c.toFixed(2)}  ${m.tx.toFixed(1)} ]<br/>
        [ ${m.b.toFixed(2)}  ${m.d.toFixed(2)}  ${m.ty.toFixed(1)} ]<br/>
        [ 0.00  0.00  1.0 ]
      </div>
      <div style="margin-top: 10px; font-size: 10px; color: #888">
        x' = a*x + c*y + tx<br/>
        y' = b*x + d*y + ty
      </div>
    `;
  }

  getTheoryContent(): string {
    return `
## 2D 几何变换与齐次坐标

在计算机图形学中，我们将平移、旋转、缩放等操作统一表示为**矩阵乘法**。这使得我们可以将复杂的变换序列组合成一个单一的矩阵，极大地提高了计算效率。

### 为什么需要齐次坐标？

普通的 2x2 矩阵只能表示线性变换（如旋转、缩放和错切），但无法表示**平移**。因为平移是加上一个常数，而不是乘以一个常数。

为了将平移也纳入矩阵乘法，我们引入了**齐次坐标 (Homogeneous Coordinates)**。我们将 2D 坐标 \`(x, y)\` 扩展为 3D 的 \`(x, y, 1)\`，并使用 3x3 矩阵：

\`\`\`text
[ x' ]   [ a  c  tx ] [ x ]
[ y' ] = [ b  d  ty ] [ y ]
[ 1  ]   [ 0  0   1 ] [ 1 ]
\`\`\`

这展开后正是我们想要的代数方程：
- \`x' = a*x + c*y + tx\`
- \`y' = b*x + d*y + ty\`

在代码实现中，因为最后一行永远是 \`[0, 0, 1]\`，我们通常只存储前两行（即 2x3 矩阵）以节省内存：

\`\`\`typescript
export class Matrix {
  constructor(
    public a: number = 1, public c: number = 0, public tx: number = 0,
    public b: number = 0, public d: number = 1, public ty: number = 0
  ) {}

  apply(x: number, y: number): Point {
    return {
      x: this.a * x + this.c * y + this.tx,
      y: this.b * x + this.d * y + this.ty
    };
  }
}
\`\`\`

### 逆向映射 (Inverse Mapping)

渲染变换后的图像时，我们**不是**遍历源图像的像素然后计算它到目标图像的位置（这会留下空隙），而是**遍历目标图像的像素，通过矩阵的“逆矩阵”找回源图像中对应的颜色**。

这也是为什么理解和实现矩阵求逆 (\`invert()\`) 在光栅化中至关重要。
    `;
  }

  cleanup(): void {}
}
