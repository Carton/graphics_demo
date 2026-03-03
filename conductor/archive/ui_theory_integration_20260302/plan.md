# Implementation Plan: Theory & Code Integration

## Phase 1: UI Infrastructure & Markdown Support
搭建渲染理论内容的 UI 容器和文本渲染管道。

- [x] Task: 扩展 UI 布局 c8f2b1
    - [x] 在 `index.html` 的 main viewport 中添加 `.theory-panel` 容器。
    - [x] 更新 `src/style.css`，为文章、代码块（`<pre><code>`）、引用、表格和行内代码设计暗色主题样式。
- [x] Task: 更新 LessonManager 逻辑 c8f2b1
    - [x] 扩展 `Lesson` 接口，增加 `getTheoryContent(): string` 方法。
    - [x] 在 `switchLesson` 时获取内容并注入到 `.theory-panel` 容器。

## Phase 2: Content Injection (Demo 1 & 2)
为前两个 Demo 补充理论与代码。

- [x] Task: 编写 Blending (Demo 1) 教程内容 5a2bf8
    - [x] 解释预乘 Alpha (Premultiplied Alpha)。
    - [x] 提供 Source-Over 的数学公式及 `blend` 函数的核心代码。
- [x] Task: 编写 Transformations (Demo 2) 教程内容 5a2bf8
    - [x] 解释齐次坐标矩阵乘法。
    - [x] 提供逆向映射循环的核心逻辑代码片段。

## Phase 3: Content Injection (Demo 3 & 4)
为后两个 Demo 补充理论与代码。

- [x] Task: 编写 Rasterization (Demo 3) 教程内容 d5e8f2
    - [x] 简述重心坐标 (Barycentric) 推导。
    - [x] 说明 SSAA 的降采样 (Downsample) 逻辑。
- [x] Task: 编写 Texture Mapping (Demo 4) 教程内容 d5e8f2
    - [x] 对比 Nearest 和 Bilinear 插值的特点。
    - [x] 提供 Bilinear `(1-u)(1-v)...` 的数学公式与 TypeScript 代码对照。

## Phase 4: Final Verification
- [x] Task: 检查所有 Demo 的排版和内容正确性。 59748
- [x] Task: Conductor - User Manual Verification 'Theory Integration Complete' 59748

## Phase: Review Fixes
- [x] Task: Apply review suggestions d52dd26
