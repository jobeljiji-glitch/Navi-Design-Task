import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 07c: home-screen app (iOS navigator.standalone, or display-mode standalone elsewhere)
const nav = navigator as Navigator & { standalone?: boolean }
if (nav.standalone || window.matchMedia('(display-mode: standalone)').matches) {
  document.documentElement.dataset.standalone = '1'
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
