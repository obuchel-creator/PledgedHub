import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite config for a React (ESM) app
export default defineConfig({
    base: '/',
    plugins: [react()],
    server: {
        port: 5173,
        hmr: { overlay: false },
        proxy: { '/api': 'http://localhost:5001' },
        historyApiFallback: true
    },
    preview: {
        port: 4173
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    charts: ['recharts']
                }
            }
        }
    },
    resolve: { alias: { '@': '/src' } },
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react'
    }
})