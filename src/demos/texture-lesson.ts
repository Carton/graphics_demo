import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { Matrix } from '../core/matrix';
import { drawSurface } from '../core/rasterization';
import type { Lesson, LessonManager } from '../main';

export class TextureLesson implements Lesson {
  id = 'texture';
  title = 'Texture Mapping & Bilinear Filtering';
  
  private params = {
    tx: 200,
    ty: 200,
    rotation: 0,
    scale: 1,
    interpolation: 'bilinear' as 'nearest' | 'bilinear',
    wrap: 'transparent' as 'clamp' | 'transparent',
  };

  private texture: Surface;
  private manager: LessonManager | null = null;

  constructor() {
    // Create a 64x64 test pattern texture
    this.texture = new Surface(64, 64);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        // Grid pattern with some color gradients
        if ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) {
          this.texture.setPixel(x, y, 255, 255, 255, 255); // White
        } else {
          this.texture.setPixel(x, y, x * 4, y * 4, 128, 255); // Gradient
        }
        // Red dot at (0,0) and Green at (63,63) to verify orientation
        if (x < 4 && y < 4) this.texture.setPixel(x, y, 255, 0, 0, 255);
        if (x > 60 && y > 60) this.texture.setPixel(x, y, 0, 255, 0, 255);
      }
    }
  }

  init(surface: Surface, pane: Pane, manager: LessonManager): void {
    this.manager = manager;
    pane.addBinding(this.params, 'interpolation', { options: { 'Nearest Neighbor': 'nearest', 'Bilinear': 'bilinear' } });
    pane.addBinding(this.params, 'wrap', { options: { 'Clamp': 'clamp', 'Transparent': 'transparent' } });
    pane.addBinding(this.params, 'tx', { min: 0, max: 400 });
    pane.addBinding(this.params, 'ty', { min: 0, max: 400 });
    pane.addBinding(this.params, 'rotation', { min: 0, max: Math.PI * 2 });
    pane.addBinding(this.params, 'scale', { min: 0.1, max: 10 });

    const btn = document.getElementById('btn-scan');
    if (btn) btn.style.display = 'none'; // No scan demo for this one yet
  }

  render(surface: Surface): void {
    surface.clear();
    
    // Transform to center of texture then apply params
    const matrix = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale))
      .multiply(Matrix.translation(-32, -32)); // Center the 64x64 texture

    drawSurface(surface, this.texture, matrix, this.params.interpolation, this.params.wrap);
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
        UV: (${srcPoint.x.toFixed(2)}, ${srcPoint.y.toFixed(2)})
      </div>
      <div style="margin-top: 10px; border-top: 1px solid #444; pt: 5px">
        ${this.params.interpolation === 'bilinear' ? `
          <code style="font-size: 9px; color: #00ff00">
            f(u,v) = p00(1-du)(1-dv) + ...
          </code>
        ` : 'Nearest pixel sampling.'}
      </div>
    `;
  }

  getTheoryContent(): string {
    return `
## 纹理映射 (Texture Mapping) 与双线性过滤

纹理映射是将一张二维图像（纹理）“贴”到几何图形表面上的过程。

在 Demo 2 中我们学习了逆向映射。当我们遍历目标屏幕的像素 \`(x', y')\` 并将其逆变换回纹理坐标 \`(x, y)\` 时，得到的坐标通常是一个**浮点数**（例如 \`(3.7, 4.2)\`）。但像素在内存中是离散的网格，我们如何获取这个“中间”坐标的颜色呢？这就是纹理过滤要解决的问题。

### 最近邻插值 (Nearest Neighbor)

这是最简单的过滤方法：直接四舍五入到最近的物理像素。
- **优点**：极快，完美保留了像素艺术（Pixel Art）的硬边缘。
- **缺点**：放大时会出现明显的马赛克方块，旋转时边缘会呈现阶梯状的严重走样。

\`\`\`typescript
export function sampleNearest(surface: Surface, x: number, y: number) {
  // 直接四舍五入取整
  const ix = Math.round(x);
  const iy = Math.round(y);
  return surface.getPixel(ix, iy);
}
\`\`\`

### 双线性插值 (Bilinear Interpolation)

为了解决马赛克问题，双线性插值会获取目标坐标周围的 **4 个最近的像素**，并根据距离的远近计算一个加权平均值。

假设我们的浮点坐标 \`(x, y)\` 整数部分是 \`(x0, y0)\`，小数部分是 \`(u, v)\`（即 \`u = x - x0\`, \`v = y - y0\`）。
周围四个像素分别为：
- 左上：\`p00 = (x0, y0)\`
- 右上：\`p10 = (x0+1, y0)\`
- 左下：\`p01 = (x0, y0+1)\`
- 右下：\`p11 = (x0+1, y0+1)\`

数学公式为：
**Result = (1-u)(1-v)*p00 + u(1-v)*p10 + (1-u)*v*p01 + u*v*p11**

在代码中，这相当于在 X 轴上做两次线性插值（Lerp），然后在 Y 轴上对这两次的结果再做一次线性插值：

\`\`\`typescript
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function sampleBilinear(surface: Surface, x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  
  const u = x - x0;
  const v = y - y0;
  
  // 取周围 4 个像素点 (需处理边界条件)
  const p00 = surface.getPixel(x0, y0);
  const p10 = surface.getPixel(x1, y0);
  const p01 = surface.getPixel(x0, y1);
  const p11 = surface.getPixel(x1, y1);
  
  return {
    // 嵌套 Lerp: X 轴两次，Y 轴一次
    r: lerp(lerp(p00.r, p10.r, u), lerp(p01.r, p11.r, u), v),
    g: lerp(lerp(p00.g, p10.g, u), lerp(p01.g, p11.g, u), v),
    // ...
  };
}
\`\`\`
    `;
  }

  cleanup(): void {}
}
