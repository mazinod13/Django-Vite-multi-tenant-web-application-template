import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    base: '/static/',
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
                public: 'src/apps/public/main.js',
                tenant: 'src/apps/tenant/main.js',
            },
        },
    },
})