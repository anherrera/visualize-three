# Visualize Three

A collection of interactive Three.js visualizations featuring animated geometric patterns and line art effects.

## Features

- **Multiple Visualizations**: Six distinct animated scenes showcasing different geometric patterns
- **Audio Reactivity**: Galaxy and audio visualizations respond to microphone input
- **Real-time Animation**: Smooth animations using `requestAnimationFrame`
- **Interactive Controls**: MapControls for user interaction in select visualizations
- **Line Art Effects**: Dynamic line connections between geometric shapes

## Available Visualizations

| Route | File | Description |
|-------|------|-------------|
| `/` | `main.js` | Rotating circles with connecting lines |
| `/square.html` | `square.js` | Rotating cube with decorative line patterns |
| `/sphere.html` | `sphere.js` | Nested wireframe spheres with connecting lines |
| `/curve.html` | `curve.js` | Basic wireframe cube demo |
| `/audio.html` | `audio.js` | Audio-reactive visualization with microphone input |
| `/galaxy.html` | `galaxy.js` | Spiral galaxy with pulsing star that reacts to audio |
| `/boids.html` | `boids.js` | Flocking simulation (boids algorithm) |

## Quick Start

### Prerequisites
- Node.js (for development server)
- Modern web browser with WebGL support

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the main visualization, or navigate to specific routes like `http://localhost:5173/square.html`.

### Deployment
```bash
# Deploy to GitHub Pages
npx gh-pages -d .
```

## Technical Details

### Architecture
- **Framework**: Three.js v0.161.0
- **Build Tool**: Vite
- **Module System**: ES modules with import maps
- **Rendering**: WebGL with wireframe materials for line art effects

### Project Structure
- Each visualization is a standalone module with its own HTML entry point
- Import maps in HTML files load Three.js from CDN
- Independent scene, camera, and renderer for each visualization
- Real-time geometry manipulation within animation loops

### Browser Compatibility
- Requires WebGL support
- Audio visualizations require microphone permissions
- Tested on modern browsers (Chrome, Firefox, Safari, Edge)

## License

This project is open source and available under the MIT License.