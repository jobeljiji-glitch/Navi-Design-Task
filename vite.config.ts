import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Dev only (08): serve reference/screens at <base>reference/* for the reference overlay.
// Nothing is copied into public/, so production builds ship no reference screenshots (D-002 superseded).
function serveReferenceScreens(): Plugin {
  return {
    name: 'serve-reference-screens',
    apply: 'serve',
    configureServer(server) {
      const dir = path.resolve(__dirname, 'reference/screens')
      server.middlewares.use((req, res, next) => {
        const m = req.url?.match(/\/reference\/([\w.-]+\.(?:jpg|png))$/)
        const file = m && path.join(dir, m[1])
        if (!file || !fs.existsSync(file)) return next()
        res.setHeader('Content-Type', file.endsWith('.png') ? 'image/png' : 'image/jpeg')
        res.end(fs.readFileSync(file))
      })
    },
  }
}

export default defineConfig({
  base: '/Navi-Design-Task/',
  plugins: [react(), serveReferenceScreens()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
})
