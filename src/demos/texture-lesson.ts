import { Pane } from 'tweakpane';
import { Surface } from '../core/surface';
import { Matrix } from '../core/matrix';
import { drawSurface, drawLine } from '../core/rasterization';
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

    const assets = pane.addFolder({ title: 'Assets' });
    assets.addButton({ title: 'Upload Image' }).on('click', () => {
      const input = document.getElementById('texture-upload-input') as HTMLInputElement;
      if (!input) {
        return;
      }

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              this.loadTextureFromImage(img);
              this.manager?.render();
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    });

    const btn = document.getElementById('btn-scan');
    if (btn) btn.style.display = 'none';
  }

  private loadTextureFromImage(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height);

    this.texture = new Surface(img.width, img.height);
    this.texture.data.set(data.data);
  }

  render(surface: Surface): void {
    surface.clear();

    const matrix = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale))
      .multiply(Matrix.translation(-this.texture.width / 2, -this.texture.height / 2));

    drawSurface(surface, this.texture, matrix, this.params.interpolation, this.params.wrap);

    if (this.params.showGrid) {
      this.drawUVGrid(surface, matrix);
    }
  }

  private drawUVGrid(surface: Surface, matrix: Matrix) {
    const w = this.texture.width;
    const h = this.texture.height;
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const y = (i / steps) * h;
      // Horizontal
      this.drawTransformedLine(surface, matrix, 0, y, w, y, 255, 255, 0, 100);
      // Vertical
      this.drawTransformedLine(surface, matrix, x, 0, x, h, 255, 255, 0, 100);
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
    drawLine(s, p0.x, p0.y, p1.x, p1.y, r, g, b, a);
  }

  updateInspector(x: number, y: number, surface: Surface): string {
    const matrix = Matrix.translation(this.params.tx, this.params.ty)
      .multiply(Matrix.rotation(this.params.rotation))
      .multiply(Matrix.scaling(this.params.scale, this.params.scale))
      .multiply(Matrix.translation(-this.texture.width / 2, -this.texture.height / 2));

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
    return `
## 纹理映射 (Texture Mapping) 高级原理

纹理映射是将 2D 图像（纹理）映射到几何图形表面的过程。在 Demo 2 中我们学习了逆向映射，本节将深入探讨采样时的过滤与坐标处理。

### 1. 纹理采样过滤 (Filtering)

当我们反求出纹理坐标 \`(u, v)\` 时，它们通常是浮点数。如何确定该点的颜色取决于过滤算法。

#### 最近邻插值 (Nearest Neighbor)
最直接的方法是取最近的物理像素点：
- **公式**：\`ix = round(u)\`, \`iy = round(v)\`
- **特点**：速度极快，保留硬边缘（像素感），但在缩放或旋转时会有严重的锯齿（Aliasing）。

#### 双线性插值 (Bilinear Filtering)
为了平滑过渡，我们获取目标点周围的 4 个像素，并根据距离进行加权平均。
假设小数部分为 \`du = u - floor(u)\`, \`dv = v - floor(v)\`：
- **公式**：\`f(u,v) = p00(1-du)(1-dv) + p10(du)(1-dv) + p01(1-du)(dv) + p11(du)(dv)\`
- **代码实现**：
\`\`\`typescript
const r = lerp(lerp(p00.r, p10.r, du), lerp(p01.r, p11.r, du), dv);
\`\`\`

### 2. 环绕模式 (Wrapping)

当采样的坐标 \`(u, v)\` 超出纹理定义的 \`[0, width]\` 或 \`[0, height]\` 范围时，环绕模式决定了如何处理。

- **Clamp-to-Edge**: 强制将坐标限制在边缘。
  - \`u' = max(0, min(u, width-1))\`
- **Repeat (平铺)**: 纹理在面上无限重复。
  - \`u' = u - floor(u / width) * width\` (即取模运算)
- **Mirror (镜像)**: 纹理在边界处反向，形成无缝镜像。
  - \`u' = abs(((u / width) + 1) % 2 - 1) * width\`

### 3. UV 网格叠加 (UV Grid)
在 Demo 中开启 "Show UV Grid" 可以直观地看到纹理坐标系是如何随着仿射变换矩阵（旋转、缩放、偏移）而变形的。黄色网格代表了纹理空间的整数边界。
    `;
  }

  cleanup(): void {}
}
