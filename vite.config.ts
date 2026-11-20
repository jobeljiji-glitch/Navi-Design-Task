import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Copy reference screens to public/reference at build / dev start
function copyReferenceScreens() {
  return {
    name: 'copy-reference-screens',
    buildStart() {
      const src = path.resolve(__dirname, 'reference/screens')
      const dest = path.resolve(__dirname, 'public/reference')
      if (fs.existsSync(src)) {
        fs.mkdirSync(dest, { recursive: true })
        for (const file of fs.readdirSync(src)) {
          fs.copyFileSync(path.join(src, file), path.join(dest, file))
        }
      }
    },
  }
}

export default defineConfig({
  base: '/Navi-Design-Task/',
  plugins: [react(), copyReferenceScreens()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
})
