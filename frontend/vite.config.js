import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'

// Minimal Vite config for a React (ESM) app with Edge compatibility
export default defineConfig({
    base: process.env.VITE_BASE || '/',
    plugins: [react()],
    css: {
        postcss: {
            plugins: [
                autoprefixer({
                    overrideBrowserslist: [
                        'last 2 versions',
                        'Edge >= 12',
                        'Chrome >= 60',
                        'Safari >= 12',
                        'Firefox >= 60'
                    ]
                })
            ]
        }
    },
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