import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const packageChunkMap = [
  ['@ant-design', 'vendor-antd'],
  ['antd', 'vendor-antd'],
  ['@rc-component', 'vendor-antd'],
  ['rc-', 'vendor-antd'],
  ['react-router', 'vendor-react'],
  ['react-dom', 'vendor-react'],
  ['react', 'vendor-react'],
  ['swiper', 'vendor-swiper'],
  ['axios', 'vendor-http'],
]

function getVendorChunk(id) {
  if (!id.includes('node_modules')) return undefined

  const normalizedId = id.replace(/\\/g, '/')
  const packageName = normalizedId.split('/node_modules/')[1]

  if (!packageName) return undefined

  const match = packageChunkMap.find(([name]) => packageName.startsWith(name))
  return match?.[1] ?? 'vendor'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: getVendorChunk,
      },
    },
  },
})
