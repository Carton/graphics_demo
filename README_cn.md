# Graphics Lab 2D: 从像素操作到工业级合成引擎

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

这是一个专注于 **2D 光栅图形学底层原理** 的交互式学习实验室。本项目不依赖任何高级绘图库（如 Canvas 2D Context 的绘图 API），而是通过直接操作 `Uint8ClampedArray` 像素缓冲区，从零实现了一个现代图形处理器的核心管线。

## 🎯 项目目标

本项目的核心使命是作为阅读 **Pixman**, **Cairo**, **Skia** 等著名开源图形库源码的“前置桥梁”。我们将抽象的数学公式（矩阵、布尔运算、插值）转化为直观的像素操作，并提供详尽的理论文档与 Pixman C 语言源码对比。

## 🚀 核心功能 (7 大实验室模块)

项目由 7 个循序渐进的交互式 Demo 组成：

1.  **Pixel Blending**: 深入理解预乘 Alpha (Premultiplied Alpha) 与全套 Porter-Duff 合成规则。
2.  **Affine Transformations**: 2D 仿射变换矩阵运算，理解“逆向映射”在图像旋转与缩放中的重要性。
3.  **Rasterization & SSAA**: 手写 Bresenham 直线算法，并实现超采样反走样 (SSAA) 解决边缘走样问题。
4.  **Advanced Texture Mapping**: 实现最近邻与双线性插值采样，探索 Clamp/Repeat/Mirror 等多种环绕模式。
5.  **Region & Clipping**: 基于扫描线算法的区域布尔运算（Union/Intersect/XOR），实现高效的非矩形裁剪。
6.  **Triple-Operand Composite**: 模拟 Pixman 的 `(Src IN Mask) OP Dst` 三元合成管线，这是字体渲染与复杂蒙版的基础。
7.  **Optimization & Fixed-point**: 探索 Fast Path 调度架构与 16.16 定点数模拟，直观观察定点数带来的精度误差（Heatmap）。

## 🛠 技术栈

- **Core**: TypeScript + Vite (现代开发环境)
- **UI**: Tweakpane (实时参数调试面板)
- **Math**: 纯手动实现 2D 矩阵与定点数数学类
- **Testing**: Vitest (全量 TDD 开发，包含 60+ 核心算法测试用例)
- **Guidelines**: 遵循 Google TypeScript Style Guide

## 📦 快速开始

```bash
# 克隆仓库
git clone https://github.com/carton/graphics-lab-2d.git

# 安装依赖
npm install

# 启动交互式实验室
npm run dev

# 运行核心算法单元测试
npm test
```

## 📖 教学设计理念

每个实验室模块都由 **"交互演示"** 与 **"双轨解析"** 组成：

- **实时 HUD**: 在像素检查器中实时查看当前点的数学推导过程。
- **源码对照**: 理论面板中提供对应的 Pixman C 语言宏与函数片段，展示 TypeScript 逻辑如何映射到高效的 C 实现。
- **Dispatcher 决策**: 实时显示 Fast Path 调度器的路径选择，理解工业代码中的“特化优化”。

## 📜 许可证

本项目采用 [MIT License](LICENSE) 开源。
