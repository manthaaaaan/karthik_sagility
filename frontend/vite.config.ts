import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/catalog': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catalog/, ''),
      },
      '/api/orders': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/orders/, ''),
      },
      '/api/payments': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payments/, ''),
      },
      '/gateway/health': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
      }
    }
  }
})
