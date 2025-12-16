import { defineConfig } from 'vite'

// Minimal Vite config for a React (ESM) app
export default defineConfig({
    base: '/',
    plugins: [],
    server: {
        port: 5173,
        hmr: { overlay: false },
        proxy: { '/api': 'http://localhost:5001' }
    },
    build: { outDir: 'dist' },
    resolve: { alias: { '@': '/src' } },
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react'
    }
})