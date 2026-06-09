import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts';
            }
            if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
              return 'editor';
            }
            if (id.includes('react-router') || id.includes('react-router-dom')) {
              return 'router';
            }
            return 'vendor-libs';
          }
        }
      }
    }
  }
})
