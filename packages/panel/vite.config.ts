import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'client'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'),
      '@fxmanager/types': resolve(__dirname, '../../shared/types/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/ws':  { target: 'ws://localhost:4000', ws: true },
    },
  },
  build: {
    outDir: resolve(__dirname, 'client/dist'),
    emptyOutDir: true,
  },
})
