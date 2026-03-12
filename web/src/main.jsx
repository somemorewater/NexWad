import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.css'
import './styles/components.css'
import App from './App.jsx'

async function loadRuntimeConfig() {
  try {
    const res = await fetch('/api/runtime-config', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    if (data?.apiUrl) window.__RUNTIME_API_URL__ = data.apiUrl
  } catch {
    // Ignore runtime config failures; fallback to build-time env.
  }
}

async function bootstrap() {
  await loadRuntimeConfig()
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
}

bootstrap()
