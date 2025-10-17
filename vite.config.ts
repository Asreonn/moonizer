import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/state': path.resolve(__dirname, './src/state'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/locales': path.resolve(__dirname, './src/locales')
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
