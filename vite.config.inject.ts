import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Separate config for building inject.js as IIFE bundle
export default defineConfig({
  plugins: [react()],
  define: {
    // Replace Node.js globals for browser compatibility
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
    lib: {
      entry: path.resolve(__dirname, 'src/inject/inject.tsx'),
      name: 'BotpressWebchat',
      formats: ['iife'],
      fileName: () => 'inject.js',
    },
    rollupOptions: {
      output: {
        // Ensure all dependencies are bundled
        inlineDynamicImports: true,
      },
    },
  },
})
