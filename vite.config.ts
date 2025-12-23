import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Middleware to handle /ledvance and /ledvance-dev routes
function ledvanceMiddleware(req: { url?: string }, _res: unknown, next: () => void) {
  const url = req.url?.split('?')[0]
  const query = req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''

  // Serve /ledvance as static HTML
  if (url === '/ledvance' || url === '/ledvance/') {
    req.url = '/ledvance/index.html' + query
  }
  // Serve /ledvance-dev as static HTML
  if (url === '/ledvance-dev' || url === '/ledvance-dev/') {
    req.url = '/ledvance-dev/index.html' + query
  }
  // Serve /ledvance-prod as static HTML
  if (url === '/ledvance-prod' || url === '/ledvance-prod/') {
    req.url = '/ledvance-prod/index.html' + query
  }
  next()
}

// Plugin to serve static HTML pages and inject.js
function staticHtmlPlugin(): Plugin {
  return {
    name: 'static-html-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0]
        const query = req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''

        // Serve /ledvance as static HTML
        if (url === '/ledvance' || url === '/ledvance/') {
          req.url = '/ledvance/index.html' + query
        }
        // Serve /ledvance-dev as static HTML
        if (url === '/ledvance-dev' || url === '/ledvance-dev/') {
          req.url = '/ledvance-dev/index.html' + query
        }
        // Serve /ledvance-prod as static HTML
        if (url === '/ledvance-prod' || url === '/ledvance-prod/') {
          req.url = '/ledvance-prod/index.html' + query
        }
        // Serve inject.tsx as /inject.js in dev mode
        if (url === '/inject.js') {
          req.url = '/src/inject/inject.tsx' + query
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(ledvanceMiddleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    staticHtmlPlugin(),
    react(),
  ],
  appType: 'mpa', // Multi-page app - don't do SPA fallback
  resolve: {
    alias: {
      // Force all React imports to use the same instance
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: ['@botpress/webchat', '@botpress/webchat-client'],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})
