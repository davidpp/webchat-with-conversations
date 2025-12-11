import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import path from 'path'

// Config for building inject.js as single IIFE bundle (matches official Botpress pattern)
// Produces: inject.js (single file with CSS injected)
export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(), // Injects CSS into JS, no separate CSS file
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({}),
  },
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear dist, main build runs first
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/inject/inject.tsx'),
      name: 'BotpressWebchat',
      formats: ['iife'],
      fileName: () => 'inject.js',
    },
    rollupOptions: {
      output: {
        // Bundle everything into single file
        inlineDynamicImports: true,
      },
    },
  },
  esbuild: {
    supported: {
      'top-level-await': true,
    },
    platform: 'browser',
  },
})
