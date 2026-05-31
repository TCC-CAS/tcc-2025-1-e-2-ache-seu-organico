/**
 * Sistema de fila offline usando IndexedDB
 * Armazena ações pendentes quando o usuário está offline
 */

const DB_NAME = 'ache-organico-offline'
const DB_VERSION = 1
const STORE_NAME = 'offline-queue'

export interface OfflineAction {
  id: string
  type: 'favorite' | 'unfavorite' | 'message' | 'notification-preference' | 'profile-update'
  data: any
  endpoint: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  timestamp: number
  retries: number
}

class OfflineQueue {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  /**
   * Adiciona uma ação à fila offline
   */
  async addAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const db = await this.ensureDB()
    const id = `${action.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const completeAction: OfflineAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(completeAction)

      request.onsuccess = () => {
        console.log('📥 Ação offline adicionada:', action.type, id)
        resolve(id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Busca todas as ações pendentes
   */
  async getAllActions(): Promise<OfflineAction[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Busca ações de um tipo específico
   */
  async getActionsByType(type: OfflineAction['type']): Promise<OfflineAction[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('type')
      const request = index.getAll(type)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove uma ação da fila
   */
  async removeAction(id: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        console.log('✅ Ação offline removida:', id)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Incrementa contador de tentativas
   */
  async incrementRetries(id: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const action = getRequest.result
        if (action) {
          action.retries += 1
          const putRequest = store.put(action)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * Limpa todas as ações
   */
  async clear(): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('🗑️ Fila offline limpa')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Conta ações pendentes
   */
  async count(): Promise<number> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineQueue = new OfflineQueue()
