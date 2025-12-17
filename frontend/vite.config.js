import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite config for a React (ESM) app
export default defineConfig({
    base: '/',
    plugins: [react()],
    server: {
        port: 5173,
        hmr: { overlay: false },
        proxy: { '/api': 'http://localhost:5001' }
    },
    preview: {
        port: 4173
    },
    build: { outDir: 'dist' },
    resolve: { alias: { '@': '/src' } },
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react'
    }
})