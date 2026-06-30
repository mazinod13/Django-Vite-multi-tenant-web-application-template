import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/static/',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5173',
  },
  build: {
    manifest: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        public: 'src/apps/public/main.tsx',
        school: 'src/apps/tenant/school/main.tsx',
        restaurant: 'src/apps/tenant/restaurant/main.tsx',
        reset:'src/apps/tenant/reset/main.tsx',
      },
    },
  },
})
