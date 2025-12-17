import fs from 'fs'
import path from 'path'

export default function spaFallback() {
  return {
    name: 'spa-fallback',
    apply: 'serve',
    configureServer(server) {
      // Add a custom middleware AFTER all others
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0]
        
        // Skip non-GET requests
        if (req.method !== 'GET') {
          return next()
        }
        
        // Skip API calls
        if (url.startsWith('/api')) {
          return next()
        }
        
        // Skip Vite internal routes
        if (url.startsWith('/@')) {
          return next()
        }
        
        // Skip files with extensions (images, css, js, etc)
        if (/\.[^\/]+$/.test(url)) {
          return next()
        }
        
        // For all other routes, serve index.html
        const indexPath = path.join(process.cwd(), 'index.html')
        const indexContent = fs.readFileSync(indexPath, 'utf-8')
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(indexContent)
      })
    }
  }
}


