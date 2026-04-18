/**
 * Componente que mostra status de sincronização offline
 */

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { syncService } from '../../utils/syncService'
import './SyncStatus.css'

const SyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Atualizar status online/offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Monitorar mudanças na fila
    const unsubscribe = syncService.onQueueChange((count) => {
      setPendingCount(count)
    })

    // Carregar contagem inicial
    syncService.getPendingCount().then(setPendingCount)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncService.syncAll()
    } finally {
      setIsSyncing(false)
    }
  }

  // Não mostrar se online e sem ações pendentes
  if (isOnline && pendingCount === 0) {
    return null
  }

  return (
    <div className={`sync-status ${!isOnline ? 'offline' : 'pending'}`}>
      <div className="sync-status-content">
        <div className="sync-status-icon">
          {!isOnline ? (
            <WifiOff size={18} />
          ) : (
            <Wifi size={18} />
          )}
        </div>

        <div className="sync-status-text">
          {!isOnline ? (
            <>
              <strong>Você está offline</strong>
              {pendingCount > 0 && (
                <span>{pendingCount} ação(ões) aguardando sincronização</span>
              )}
            </>
          ) : pendingCount > 0 ? (
            <>
              <strong>Sincronizando...</strong>
              <span>{pendingCount} ação(ões) pendente(s)</span>
            </>
          ) : null}
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            className="sync-button"
            onClick={handleSync}
            disabled={isSyncing}
            title="Sincronizar agora"
          >
            <RefreshCw size={16} className={isSyncing ? 'spinning' : ''} />
          </button>
        )}
      </div>
    </div>
  )
}

export default SyncStatus
