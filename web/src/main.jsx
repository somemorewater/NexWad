import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.css'
import './styles/components.css'
import App from './App.jsx'
import { setInstallPrompt, clearInstallPrompt } from './utils/pwaInstall'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const preAppLoader = document.getElementById('pre-app-loader')
if (preAppLoader) {
  preAppLoader.classList.add('hidden')
  window.setTimeout(() => preAppLoader.remove(), 240)
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  setInstallPrompt(e)
})

window.addEventListener('appinstalled', () => {
  clearInstallPrompt()
})
