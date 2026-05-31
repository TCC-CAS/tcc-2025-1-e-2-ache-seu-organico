/**
 * Hook para enviar mensagens com suporte offline
 */

import { useState } from 'react'
import { syncService } from '../utils/syncService'
import { useToast } from '../components/Toast'

export const useOfflineMessage = () => {
  const [isSending, setIsSending] = useState(false)
  const toast = useToast()

  const sendMessage = async (
    conversationId: number,
    content: string
  ): Promise<boolean> => {
    if (!content.trim()) {
      toast.error('Mensagem vazia')
      return false
    }

    setIsSending(true)

    try {
      const endpoint = '/chat/messages/'
      const data = {
        conversation: conversationId,
        content: content.trim()
      }

      // Se estiver offline, enfileirar
      if (!navigator.onLine) {
        await syncService.queueAction(
          'message',
          endpoint,
          'POST',
          data
        )

        toast.info('Mensagem salva! Será enviada quando voltar online', 5000)
        return true
      }

      // Se estiver online, enviar normalmente
      const { default: api } = await import('../api/axios')
      await api.post(endpoint, data)

      return true

    } catch (error: any) {
      // Se falhar mas estiver offline, enfileirar
      if (!navigator.onLine) {
        await syncService.queueAction(
          'message',
          '/chat/messages/',
          'POST',
          {
            conversation: conversationId,
            content: content.trim()
          }
        )

        toast.info('Mensagem salva! Será enviada quando voltar online', 5000)
        return true
      }

      toast.error('Erro ao enviar mensagem')
      console.error('Erro ao enviar mensagem:', error)
      return false

    } finally {
      setIsSending(false)
    }
  }

  return {
    sendMessage,
    isSending
  }
}
