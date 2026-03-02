# Task Plan: Demo 3 - Rasterization & Antialiasing

## Goal
实现基础光栅化图元（直线、渐变三角形）并引入超采样反走样（SSAA），为理解 Pixman 的边缘处理和高质量渲染打下基础。

## Phases
- [ ] Phase 1: 线条光栅化 (Bresenham's Algorithm)
    - [ ] 任务：在 `src/core/rasterization.ts` 中实现 `drawLine`。
    - [ ] 验证：在 Demo 3 中展示不同斜率的线条。
- [ ] Phase 2: 渐变三角形填充 (Gouraud Shading / Vertex Interpolation)
    - [ ] 任务：升级 `drawPolygon` 或实现 `drawTriangle` 以支持顶点颜色。
    - [ ] 任务：在重心坐标计算中增加颜色插值逻辑。
    - [ ] 验证：绘制一个三个顶点颜色不同的渐变三角形。
- [ ] Phase 3: 超采样反走样 (SSAA)
    - [ ] 任务：实现 SSAA 渲染管线（在一个像素内采样 2x2 或 4x4 子像素）。
    - [ ] 任务：实现结果像素的平均降采样。
    - [ ] 验证：提供开关对比开启/关闭 SSAA 后的边缘平滑度。
- [ ] Phase 4: 集成到实验室仪表盘
    - [ ] 任务：创建 `src/demos/raster-lesson.ts`。
    - [ ] 任务：添加实时公式（Bresenham 误差项、重心坐标插值公式）。
    - [ ] 任务：完善扫描动画，展示子像素采样点。

## Success Criteria
- 用户可以看到手动绘制的直线且无断裂。
- 三角形填充支持平滑的颜色渐变。
- SSAA 开启时，斜线和三角形边缘明显变平滑。
- 所有逻辑均可在实验室仪表盘中通过滑块交互。
