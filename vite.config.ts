import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 自定义域名配置 - 不需要base路径
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0'
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    'process.env': {}
  }
}) 