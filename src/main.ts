import './style.css';
import { Pane } from 'tweakpane';
import { Surface } from './core/surface';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
});

// Base Lesson Interface
export interface Lesson {
  id: string;
  title: string;
  init(surface: Surface, pane: Pane, manager: LessonManager): void;
  render(surface: Surface): void;
  updateInspector?(x: number, y: number, surface: Surface): string; // Returns math logic html
  cleanup(): void;
  getTheoryContent?(): string;
}

class LessonManager {
  private currentLesson: Lesson | null = null;
  private surface: Surface;
  private pane: Pane;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.surface = new Surface(this.canvas.width, this.canvas.height);
    this.pane = new Pane({
      title: 'Parameters',
      container: document.getElementById('controls-container')!,
    });

    this.initNavigation();
    this.initInspector();
  }
private initNavigation() {
  const items = document.querySelectorAll('.lesson-item');
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const id = (item as HTMLElement).dataset.lesson;
      if (id) {
        this.switchLesson(id);
        items.forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

  private initInspector() {
    const inspectorCanvas = document.getElementById('inspector-canvas') as HTMLCanvasElement;
    const inspectorCtx = inspectorCanvas.getContext('2d')!;
    const posVal = document.getElementById('pos-val')!;
    const rgbaVal = document.getElementById('rgba-val')!;
    const mathContent = document.getElementById('math-content')!;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);

      if (x >= 0 && x < this.surface.width && y >= 0 && y < this.surface.height) {
        posVal.textContent = `${x}, ${y}`;
        const p = this.surface.getPixel(x, y);
        rgbaVal.textContent = `${p.r}, ${p.g}, ${p.b}, ${p.a}`;

        // Draw zoomed grid
        this.drawZoomedGrid(inspectorCtx, x, y);

        // Update math logic if lesson provides it
        if (this.currentLesson?.updateInspector) {
          mathContent.innerHTML = this.currentLesson.updateInspector(x, y, this.surface);
        }
      }
    });
  }

  private drawZoomedGrid(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const zoom = 10; // 10x magnification
    ctx.clearRect(0, 0, 150, 150);

    for (let dy = -7; dy <= 7; dy++) {
      for (let dx = -7; dx <= 7; dx++) {
        const px = cx + dx;
        const py = cy + dy;
        const p = this.surface.getPixel(px, py);

        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a / 255})`;
        ctx.fillRect((dx + 7) * zoom, (dy + 7) * zoom, zoom, zoom);

        // Draw grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.strokeRect((dx + 7) * zoom, (dy + 7) * zoom, zoom, zoom);
      }
    }
    // Highlight center
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(7 * zoom, 7 * zoom, zoom, zoom);
  }

  public async switchLesson(id: string) {
    console.log('Switching to lesson:', id);
    if (this.currentLesson) {
      this.currentLesson.cleanup();
      this.pane.dispose();
      this.pane = new Pane({
        title: 'Parameters',
        container: document.getElementById('controls-container')!,
      });
    }

    // Dynamic import of lesson
    if (id === 'blending') {
      const { BlendingLesson } = await import('./demos/blending-lesson');
      this.currentLesson = new BlendingLesson();
    } else if (id === 'transform') {
      const { TransformLesson } = await import('./demos/transform-lesson');
      this.currentLesson = new TransformLesson();
    } else if (id === 'raster') {
      const { RasterLesson } = await import('./demos/raster-lesson');
      this.currentLesson = new RasterLesson();
    } else if (id === 'texture') {
      const { TextureLesson } = await import('./demos/texture-lesson');
      this.currentLesson = new TextureLesson();
    } else if (id === 'region') {
      const { RegionLesson } = await import('./demos/region-lesson');
      this.currentLesson = new RegionLesson();
    }

    if (this.currentLesson) {
      document.getElementById('lesson-title')!.textContent = this.currentLesson!.title;
      this.currentLesson!.init(this.surface, this.pane, this);

      const theoryContainer = document.getElementById('theory-container');
      if (theoryContainer) {
        if (this.currentLesson!.getTheoryContent) {
          const rawContent = this.currentLesson!.getTheoryContent();
          theoryContainer.innerHTML = marked.parse(rawContent) as string;
        } else {
          theoryContainer.innerHTML =
            '<p style="color: #888; font-style: italic;">No theory content available for this lesson yet.</p>';
        }
      }

      this.pane.on('change', () => this.render());
      this.render();
    }
  }

  public render() {
    if (!this.currentLesson) return;
    this.currentLesson.render(this.surface);
    const imageData = new ImageData(
      new Uint8ClampedArray(this.surface.data), // Ensure a fresh copy for display
      this.surface.width,
      this.surface.height,
    );
    this.ctx.putImageData(imageData, 0, 0);
  }
}

// Start app
export const manager = new LessonManager();
manager.switchLesson('blending');
