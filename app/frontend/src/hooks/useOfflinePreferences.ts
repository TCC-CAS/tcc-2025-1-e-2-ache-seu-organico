/**
 * Hook para atualizar preferências de notificação com suporte offline
 */

import { useState } from 'react'
import { syncService } from '../utils/syncService'
import { useToast } from '../components/Toast'
import type { NotificationPreferences } from '../api/notifications'

export const useOfflinePreferences = () => {
  const [isUpdating, setIsUpdating] = useState(false)
  const toast = useToast()

  const updatePreferences = async (
    preferenceId: number,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    setIsUpdating(true)

    try {
      const endpoint = `/notifications/preferences/${preferenceId}/`
      
      // Se estiver offline, enfileirar
      if (!navigator.onLine) {
        await syncService.queueAction(
          'notification-preference',
          endpoint,
          'PATCH',
          preferences
        )

        toast.info('Preferências salvas! Serão sincronizadas quando voltar online')
        return true
      }

      // Se estiver online, atualizar normalmente
      const { default: api } = await import('../api/axios')
      await api.patch(endpoint, preferences)
      
      toast.success('Preferências atualizadas!')
      return true

    } catch (error: any) {
      // Se falhar mas estiver offline, enfileirar
      if (!navigator.onLine) {
        await syncService.queueAction(
          'notification-preference',
          `/notifications/preferences/${preferenceId}/`,
          'PATCH',
          preferences
        )

        toast.info('Preferências salvas! Serão sincronizadas quando voltar online')
        return true
      }

      toast.error('Erro ao atualizar preferências')
      console.error('Erro ao atualizar preferências:', error)
      return false

    } finally {
      setIsUpdating(false)
    }
  }

  return {
    updatePreferences,
    isUpdating
  }
}
