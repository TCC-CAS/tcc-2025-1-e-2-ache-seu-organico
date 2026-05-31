/**
 * Hook para favoritar/desfavoritar com suporte offline
 */

import { useState } from 'react'
import { syncService } from '../utils/syncService'
import { useToast } from '../components/Toast'

export const useOfflineFavorite = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const toast = useToast()

  const toggleFavorite = async (
    locationId: number,
    isFavorited: boolean
  ): Promise<boolean> => {
    setIsProcessing(true)

    try {
      // API usa o mesmo endpoint /favorites/toggle/ para favoritar e desfavoritar
      const endpoint = '/favorites/toggle/'
      const method = 'POST'
      const data = { location_id: locationId }

      // Se estiver offline, enfileirar
      if (!navigator.onLine) {
        await syncService.queueAction(
          isFavorited ? 'unfavorite' : 'favorite',
          endpoint,
          method,
          data
        )

        toast.info(
          isFavorited
            ? 'Desfavoritado! Será sincronizado quando voltar online'
            : 'Favoritado! Será sincronizado quando voltar online',
          5000
        )

        return true
      }

      // Se estiver online, fazer requisição normal
      const { default: api } = await import('../api/axios')
      const response = await api.post(endpoint, data)
      
      // A API retorna { message, favorited, favorite? }
      if (response.data.favorited) {
        toast.success('Adicionado aos favoritos!')
      } else {
        toast.success('Removido dos favoritos!')
      }

      return true

    } catch (error: any) {
      // Se falhar mas estiver offline, enfileirar mesmo assim
      if (!navigator.onLine) {
        await syncService.queueAction(
          isFavorited ? 'unfavorite' : 'favorite',
          '/favorites/toggle/',
          'POST',
          { location_id: locationId }
        )

        toast.info('Ação salva! Será sincronizada quando voltar online', 5000)
        return true
      }

      toast.error('Erro ao atualizar favorito')
      console.error('Erro ao favoritar:', error)
      return false

    } finally {
      setIsProcessing(false)
    }
  }

  return {
    toggleFavorite,
    isProcessing
  }
}
