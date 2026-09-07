import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8071,
    https: false, // Set to true with certs for real-device WakeLock/Camera testing
    host: true,   // Expose to LAN for mobile device testing
    allowedHosts: ['geotest.jhnbrd.com', '.jhnbrd.com'],
  },
  preview: {
    port: 8071,
    host: true,
    allowedHosts: ['geotest.jhnbrd.com', '.jhnbrd.com'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet'],
          dexie: ['dexie'],
        },
      },
    },
  },
});
