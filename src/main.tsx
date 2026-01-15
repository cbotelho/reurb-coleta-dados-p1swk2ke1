/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
// @ts-ignore
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível! Atualizar agora?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App pronto para trabalhar offline!')
  },
})

// Verificação de Versão de Segurança (Trava Offline)
async function checkVersionGuard() {
  if (!navigator.onLine) return

  try {
    // 1. Pega versão do manifesto oficial do servidor
    const response = await fetch('/version.json?t=' + Date.now(), { 
       cache: 'no-store',
       headers: { 'Cache-Control': 'no-cache' } 
    })
    
    if (!response.ok) return

    const serverData = await response.json()
    const serverVersion = serverData.version
    
    // 2. Compara com armazenamento local
    const localVersion = localStorage.getItem('APP_VERSION')
    
    console.log(`[Version Guard] Server: ${serverVersion} | Local: ${localVersion}`)
    
    if (localVersion && serverVersion !== localVersion) {
      if (confirm(`Versão crítica encontrada (${serverVersion}). Atualizar sistema?`)) {
        localStorage.setItem('APP_VERSION', serverVersion)
        // Força atualização agressiva
        if ('serviceWorker' in navigator) {
           const registrations = await navigator.serviceWorker.getRegistrations()
           for(let registration of registrations) {
              await registration.update()
           }
        }
        window.location.reload()
      }
    } else if (!localVersion) {
       // Primeiro acesso
       localStorage.setItem('APP_VERSION', serverVersion)
    }
    
  } catch (e) {
    console.error('[Version Guard] Falha na verificação:', e)
  }
}

// Executa verificação ao iniciar e quando volta a ficar online
checkVersionGuard()
window.addEventListener('online', checkVersionGuard)

createRoot(document.getElementById('root')!).render(<App />)
