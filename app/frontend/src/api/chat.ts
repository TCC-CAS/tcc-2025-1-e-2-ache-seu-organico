import api from './axios'

interface ConversationParticipant {
  id: number
  full_name: string
  email: string
  user_type: 'CONSUMER' | 'PRODUCER'
  avatar: string | null
}

interface LastMessage {
  content: string
  created_at: string
  sender_id: number
}

export interface ConversationListItem {
  id: number
  other_participant: ConversationParticipant
  last_message: LastMessage | null
  unread_count: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation: number
  sender: number
  sender_name: string
  sender_id: number
  content: string
  is_read: boolean
  created_at: string
}

export interface ConversationDetail {
  id: number
  participants: ConversationParticipant[]
  messages: Message[]
  created_at: string
  updated_at: string
}

interface CreateConversationPayload {
  participant_id: number
}

interface CreateMessagePayload {
  conversation: number
  content: string
}

export const chatService = {
  // Conversas
  getConversations: async (): Promise<ConversationListItem[]> => {
    const response = await api.get('/chat/conversations/')
    return response.data.results || response.data
  },

  getConversation: async (id: number): Promise<ConversationDetail> => {
    const response = await api.get(`/chat/conversations/${id}/`)
    return response.data
  },

  createConversation: async (participantId: number): Promise<ConversationDetail> => {
    const payload: CreateConversationPayload = {
      participant_id: participantId
    }
    const response = await api.post('/chat/conversations/', payload)
    return response.data
  },

  markConversationAsRead: async (id: number): Promise<void> => {
    await api.post(`/chat/conversations/${id}/mark_as_read/`)
  },

  // Mensagens
  getMessages: async (conversationId: number): Promise<Message[]> => {
    const response = await api.get('/chat/messages/', {
      params: { conversation_id: conversationId }
    })
    return response.data.results || response.data
  },

  sendMessage: async (conversationId: number, content: string): Promise<Message> => {
    const payload: CreateMessagePayload = {
      conversation: conversationId,
      content
    }
    const response = await api.post('/chat/messages/', payload)
    return response.data
  },
}

// WebSocket URL base
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'

export class ChatWebSocket {
  private socket: WebSocket | null = null
  private conversationId: number
  private token: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  // Callbacks
  onMessage?: (message: Message) => void
  onTyping?: (userId: number, isTyping: boolean) => void
  onUserJoined?: (userId: number, userName: string) => void
  onError?: (error: Event) => void
  onClose?: () => void
  onOpen?: () => void

  constructor(conversationId: number, token: string) {
    this.conversationId = conversationId
    this.token = token
  }

  connect() {
    const wsUrl = `${WS_BASE_URL}/ws/chat/${this.conversationId}/?token=${this.token}`
    
    this.socket = new WebSocket(wsUrl)

    this.socket.onopen = () => {
      console.log('WebSocket conectado')
      this.reconnectAttempts = 0
      if (this.onOpen) this.onOpen()
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'message':
            if (this.onMessage) this.onMessage(data.message)
            break
          case 'typing':
            if (this.onTyping) this.onTyping(data.user_id, data.is_typing)
            break
          case 'user_joined':
            if (this.onUserJoined) this.onUserJoined(data.user_id, data.user_name)
            break
          default:
            console.log('Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (this.onError) this.onError(error)
    }

    this.socket.onclose = () => {
      console.log('WebSocket desconectado')
      if (this.onClose) this.onClose()
      
      // Tentar reconectar
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          console.log(`Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
          this.connect()
        }, this.reconnectDelay * this.reconnectAttempts)
      }
    }
  }

  sendMessage(content: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'message',
        content
      }))
    }
  }

  sendTyping(isTyping: boolean) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping
      }))
    }
  }

  markAsRead(messageIds: number[]) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'mark_read',
        message_ids: messageIds
      }))
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN
  }
}
