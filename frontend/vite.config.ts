import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // The 3D cost-universe implementation is reached via a bare specifier so
      // @react-three/fiber's global JSX type augmentation stays out of the main
      // tsc program (it is typed ambiently in universe3d.d.ts instead).
      'universe3d-impl': path.resolve(__dirname, 'src/components/universe/Universe3DImpl.tsx'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
