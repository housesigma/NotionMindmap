import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths for assets in any deployment
  base: './',
  define: {
    // Disable Vite client script injection in production-like environments
    __VITE_IS_MODERN__: 'false'
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces
    port: 5174,
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      'localhost',
      'tools.fangintel.com'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    },
    // Completely disable HMR and client scripts for subpath compatibility
    hmr: false,
    // Disable client script injection
    middlewareMode: false
  },
  build: {
    // Ensure clean builds without dev artifacts
    minify: true,
    rollupOptions: {
      output: {
        // Clean asset names
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
})
