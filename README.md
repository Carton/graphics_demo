# Graphics Lab 2D: From Pixel Manipulation to Industrial Composite Engine

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

[中文版 (Chinese Version)](./README_cn.md)

An interactive learning lab focused on the **low-level fundamentals of 2D raster graphics**. This project does not rely on high-level drawing APIs (like Canvas 2D context's `strokeRect` or `drawImage`). Instead, it implements a modern graphics pipeline from scratch by directly manipulating `Uint8ClampedArray` pixel buffers.

## 🎯 Project Goals

The core mission of this project is to serve as a **precursor bridge** for reading and understanding the source code of professional graphics libraries like **Pixman**, **Cairo**, and **Skia**. We translate abstract mathematical formulas (matrices, boolean operations, interpolation) into intuitive pixel operations, provided alongside detailed theoretical documentation and Pixman C source comparisons.

## 🚀 Core Modules

The lab consists of 7 progressive interactive demos:

1.  **Pixel Blending**: Deep dive into Premultiplied Alpha and the full suite of Porter-Duff composition rules.
2.  **Affine Transformations**: 2D transformation matrices, understanding the critical role of "Inverse Mapping" in rotation and scaling.
3.  **Rasterization & SSAA**: Hand-written Bresenham line algorithm and Supersampling Anti-Aliasing (SSAA) implementation.
4.  **Advanced Texture Mapping**: Nearest-neighbor and Bilinear interpolation sampling with various wrapping modes (Clamp/Repeat/Mirror).
5.  **Region & Clipping**: Scanline-based region boolean operations (Union/Intersect/XOR) and efficient non-rectangular clipping.
6.  **Triple-Operand Composite**: Simulating Pixman’s `(Src IN Mask) OP Dst` pipeline, the foundation for font rendering and complex masking.
7.  **Optimization & Fixed-point**: Exploring Fast Path dispatcher architectures and 16.16 fixed-point arithmetic simulation with precision error heatmaps.

## 🛠 Tech Stack

- **Core**: TypeScript + Vite (Modern dev environment)
- **UI**: Tweakpane (Real-time parameter orchestration)
- **Math**: Custom-built 2D Matrix and Fixed-point math classes
- **Testing**: Vitest (Full TDD development with 60+ core algorithm test cases)
- **Guidelines**: Strictly adhering to Google TypeScript Style Guide

## 📦 Quick Start

```bash
# Clone the repository
git clone https://github.com/carton/graphics-lab-2d.git

# Install dependencies
npm install

# Start the interactive lab
npm run dev

# Run unit tests
npm test
```

## 📖 Educational Concepts

Each module is designed with a **"Dual-Track Analysis"** approach:

- **Real-time HUD**: View the step-by-step mathematical derivation in the Pixel Inspector.
- **Source Comparison**: Theoretical panels provide snippets from `pixman-fast-path.c`, showing how TypeScript logic maps to high-performance C implementations.
- **Dispatcher Insights**: Observe the Fast Path dispatcher making real-time decisions based on transformation states.

## 📜 License

This project is licensed under the [MIT License](LICENSE).
