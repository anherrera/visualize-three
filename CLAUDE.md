# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start the Vite development server to run the visualizations locally
- `npm install` - Install dependencies (three.js and development tools)

### Deployment
- `npx gh-pages -d .` - Deploy to GitHub Pages (assumes gh-pages package is installed)

## Architecture

This is a Three.js visualization project showcasing various animated geometric patterns. The codebase consists of standalone visualization modules:

### Core Structure
- **Entry Point**: `index.html` loads individual visualization scripts as ES modules
- **Visualizations**: Each `.js` file (main, square, sphere, curve) is an independent Three.js scene
- **Import Strategy**: Uses import maps in `index.html` to load Three.js from CDN

### Key Patterns
- Each visualization creates its own scene, camera, and renderer
- Animation loops use `requestAnimationFrame` for smooth rendering
- Geometry manipulation happens in real-time within animation loops
- Line art effects are created by connecting vertices between geometric shapes

### Routing
The project supports multiple routes for different visualizations:
- `/` - Main visualization (rotating circles with connecting lines)
- `/square` - Rotating cube with decorative line patterns
- `/sphere` - Nested wireframe spheres with connecting lines
- `/curve` - Basic wireframe cube demo
- `/audio` - Audio-reactive visualization with microphone input
- `/galaxy` - Spiral galaxy with pulsing star that reacts to audio

In development, access these routes at:
- `localhost:5173/`
- `localhost:5173/square.html`
- `localhost:5173/sphere.html`
- `localhost:5173/curve.html`
- `localhost:5173/audio.html`
- `localhost:5173/galaxy.html`

### Three.js Usage
- Uses Three.js v0.161.0
- Employs basic materials with wireframe rendering for line art effects
- `square.js` includes MapControls for user interaction (note: import path has a typo that needs fixing)