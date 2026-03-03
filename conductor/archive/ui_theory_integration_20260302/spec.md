# Specification: Theory & Code Integration

## Goal
为现有的所有互动演示（Demo 1-4）增加配套的教学文本模块，包括背景知识、核心数学公式（如矩阵乘法、插值公式）以及关键代码片段，打造闭环的“交互-理论-代码”学习体验。

## Key Components
1. **UI Layout Update**: 
   - 在 `#viewport` 区域（Canvas 下方或侧边）添加一个 Markdown 渲染卡片 (`#lesson-theory`)。
   - 样式需要与现有的暗色调匹配，支持代码块高亮和数学公式格式化展示（例如使用 HTML/CSS 直接渲染简单的公式排版，或引入轻量级渲染器）。
2. **Content Module Structure**:
   - `src/content/`: 存放各章节的文本内容。为保持简单且无需复杂构建，可以采用导出 Markdown 字符串的 TS 文件，或直接在组件中嵌入 HTML。
3. **Lesson Integrations**:
   - **Demo 1 (Blending)**: Porter-Duff 规则简介，预乘 Alpha 概念，各个混合模式的代数公式和代码实现片段。
   - **Demo 2 (Transform)**: 齐次坐标系 (Homogeneous Coordinates) 介绍，2x3 仿射变换矩阵的数学推导，逆向映射 (Inverse Mapping) 原理。
   - **Demo 3 (Rasterization & SSAA)**: Bresenham 直线算法原理，重心坐标 (Barycentric Coordinates) 计算方法，超采样反走样原理。
   - **Demo 4 (Texture Mapping)**: UV 坐标映射，最近邻 vs 双线性插值的数学展开。

## Requirements
- 必须支持在切换 Demo 时动态刷新理论面板。
- 文本需使用简洁有力的技术语言，公式要求清晰易读。
- 代码片段必须与当前项目实际运行的代码一致。