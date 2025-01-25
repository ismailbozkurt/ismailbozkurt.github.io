import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ismailbozkurt.github.io/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
  },
})
