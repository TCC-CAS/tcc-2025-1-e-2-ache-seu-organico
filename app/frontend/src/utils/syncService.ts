/**
 * Serviço de sincronização de ações offline
 * Processa a fila quando a conexão volta
 */

import api from '../api/axios'
import { offlineQueue, type OfflineAction } from './offlineQueue'

const MAX_RETRIES = 3

class SyncService {
  private isSyncing = false
  private listeners: Set<(count: number) => void> = new Set()

  /**
   * Registra listener para mudanças na fila
   */
  onQueueChange(callback: (count: number) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(count: number): void {
    this.listeners.forEach(listener => listener(count))
  }

  /**
   * Sincroniza todas as ações pendentes
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('⏳ Sincronização já em andamento')
      return { success: 0, failed: 0 }
    }

    // Verificar se está online
    if (!navigator.onLine) {
      console.log('📵 Offline - sincronização adiada')
      return { success: 0, failed: 0 }
    }

    this.isSyncing = true
    console.log('🔄 Iniciando sincronização...')

    let success = 0
    let failed = 0

    try {
      const actions = await offlineQueue.getAllActions()
      
      if (actions.length === 0) {
        console.log('✨ Nenhuma ação pendente')
        return { success: 0, failed: 0 }
      }

      console.log(`📦 ${actions.length} ação(ões) pendente(s)`)

      // Ordenar por timestamp (mais antigas primeiro)
      actions.sort((a, b) => a.timestamp - b.timestamp)

      // Processar cada ação
      for (const action of actions) {
        try {
          await this.syncAction(action)
          await offlineQueue.removeAction(action.id)
          success++
          console.log(`✅ Sincronizado: ${action.type}`)
        } catch (error) {
          console.error(`❌ Falha ao sincronizar ${action.type}:`, error)
          
          // Incrementar tentativas
          await offlineQueue.incrementRetries(action.id)
          
          // Remover se excedeu tentativas
          if (action.retries >= MAX_RETRIES) {
            console.log(`🗑️ Removendo ação após ${MAX_RETRIES} tentativas: ${action.id}`)
            await offlineQueue.removeAction(action.id)
          }
          
          failed++
        }
      }

      // Notificar listeners
      const remaining = await offlineQueue.count()
      this.notifyListeners(remaining)

      console.log(`✨ Sincronização concluída: ${success} sucesso, ${failed} falhas`)
      
    } finally {
      this.isSyncing = false
    }

    return { success, failed }
  }

  /**
   * Sincroniza uma ação específica
   */
  private async syncAction(action: OfflineAction): Promise<void> {
    const config = {
      method: action.method,
      url: action.endpoint,
      data: action.data
    }

    await api.request(config)
  }

  /**
   * Adiciona uma ação à fila e tenta sincronizar se online
   */
  async queueAction(
    type: OfflineAction['type'],
    endpoint: string,
    method: OfflineAction['method'],
    data?: any
  ): Promise<string> {
    const actionId = await offlineQueue.addAction({
      type,
      endpoint,
      method,
      data
    })

    // Notificar listeners
    const count = await offlineQueue.count()
    this.notifyListeners(count)

    // Se estiver online, tentar sincronizar imediatamente
    if (navigator.onLine) {
      setTimeout(() => this.syncAll(), 100)
    }

    return actionId
  }

  /**
   * Inicia listeners para eventos de rede
   */
  startListeners(): void {
    // Quando voltar online
    window.addEventListener('online', async () => {
      console.log('🌐 Conexão restaurada - iniciando sincronização')
      await this.syncAll()
    })

    // Quando ficar offline
    window.addEventListener('offline', () => {
      console.log('📵 Conexão perdida - ações serão enfileiradas')
    })

    // Sincronizar quando a aba ganhar foco
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden && navigator.onLine) {
        const count = await offlineQueue.count()
        if (count > 0) {
          console.log('👀 Aba ativa - verificando sincronização')
          await this.syncAll()
        }
      }
    })

    // Sincronizar periodicamente (a cada 30s)
    setInterval(async () => {
      if (navigator.onLine && !this.isSyncing) {
        const count = await offlineQueue.count()
        if (count > 0) {
          await this.syncAll()
        }
      }
    }, 30000)

    console.log('👂 Listeners de sincronização iniciados')
  }

  /**
   * Retorna o número de ações pendentes
   */
  async getPendingCount(): Promise<number> {
    return offlineQueue.count()
  }
}

export const syncService = new SyncService()
