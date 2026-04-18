import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './PWAPrompt.css'

const PWAPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('Service Worker registrado:', r)
    },
    onRegisterError(error: any) {
      console.error('Erro ao registrar Service Worker:', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // Detectar quando o app pode ser instalado
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setShowInstallPrompt(true)
      
      // Guardar o evento para usar depois
      ;(window as any).deferredPrompt = e
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    const deferredPrompt = (window as any).deferredPrompt

    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} instalar o app`)

    ;(window as any).deferredPrompt = null
    setShowInstallPrompt(false)
  }

  return (
    <>
      {/* Prompt de instalação */}
      {showInstallPrompt && (
        <div className="pwa-toast pwa-install">
          <div className="pwa-message">
            <strong>Instalar Ache Seu Orgânico</strong>
            <p>Acesse mais rápido com nosso app!</p>
          </div>
          <div className="pwa-actions">
            <button className="pwa-btn pwa-btn-primary" onClick={handleInstallClick}>
              Instalar
            </button>
            <button className="pwa-btn pwa-btn-secondary" onClick={() => setShowInstallPrompt(false)}>
              Agora não
            </button>
          </div>
        </div>
      )}

      {/* Notificação de offline ready */}
      {offlineReady && (
        <div className="pwa-toast pwa-success" role="alert">
          <div className="pwa-message">
            <strong>App pronto para uso offline!</strong>
            <p>Agora você pode usar o app sem internet</p>
          </div>
          <button className="pwa-btn pwa-btn-secondary" onClick={close}>
            OK
          </button>
        </div>
      )}

      {/* Notificação de atualização disponível */}
      {needRefresh && (
        <div className="pwa-toast pwa-update" role="alert">
          <div className="pwa-message">
            <strong>Nova versão disponível!</strong>
            <p>Clique em atualizar para ver as novidades</p>
          </div>
          <div className="pwa-actions">
            <button className="pwa-btn pwa-btn-primary" onClick={() => updateServiceWorker(true)}>
              Atualizar
            </button>
            <button className="pwa-btn pwa-btn-secondary" onClick={close}>
              Depois
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default PWAPrompt
