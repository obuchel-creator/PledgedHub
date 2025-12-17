import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default function htmlFallback() {
  return {
    name: 'html-fallback',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0]
        
        // Skip non-GET
        if (req.method.toUpperCase() !== 'GET') {
          return next()
        }
        
        // Skip /api
        if (url.startsWith('/api')) {
          return next()
        }
        
        // Skip /@
        if (url.startsWith('/@')) {
          return next()
        }
        
        // Skip files with extensions
        const parts = url.split('/')
        const last = parts[parts.length - 1]
        if (last.includes('.')) {
          return next()
        }
        
        // Serve index.html
        try {
          const indexPath = path.join(__dirname, 'index.html')
          const content = fs.readFileSync(indexPath, 'utf-8')
          res.setHeader('Content-Type', 'text/html')
          res.end(content)
        } catch (e) {
          next()
        }
      })
    }
  }
}

