import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'three': 'three',
      'three/addons': 'three/examples/jsm'
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sphere: resolve(__dirname, 'sphere.html'),
        square: resolve(__dirname, 'square.html'),
        curve: resolve(__dirname, 'curve.html'),
        audio: resolve(__dirname, 'audio.html'),
        galaxy: resolve(__dirname, 'galaxy.html'),
        boids: resolve(__dirname, 'boids.html')
      }
    }
  }
});