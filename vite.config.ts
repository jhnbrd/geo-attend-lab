import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8071,
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
