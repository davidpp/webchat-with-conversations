import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plugin to serve static HTML pages before SPA fallback
function staticHtmlPlugin(): Plugin {
  return {
    name: 'static-html-fallback',
    configureServer(server) {
      // This runs BEFORE Vite's internal middlewares
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0] // Remove query string
        const query = req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''

        // Serve /ledvance as static HTML
        if (url === '/ledvance' || url === '/ledvance/') {
          req.url = '/ledvance/index.html' + query
        }
        // Serve /embed via React app (SPA route)
        if (url === '/embed') {
          req.url = '/index.html' + query
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [staticHtmlPlugin(), react()],
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
        inject: path.resolve(__dirname, 'src/inject/inject.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Output inject.js without hash for easy embedding
          if (chunkInfo.name === 'inject') {
            return 'inject.js'
          }
          return 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
