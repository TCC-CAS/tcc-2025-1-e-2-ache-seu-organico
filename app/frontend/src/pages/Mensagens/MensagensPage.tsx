import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle, Send, User, Plus, Heart, X } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Loading from '../../components/Loading'
import Button from '../../components/Button'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { chatService, ChatWebSocket, type ConversationListItem, type Message as ChatMessage } from '../../api/chat'
import { favoriteService } from '../../api/favorites'
import type { Favorite } from '../../types'
import { STORAGE_KEYS } from '../../utils/constants'
import './MensagensPage.css'

const MensagensPage = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const wsRef = useRef<ChatWebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadConversations()
    
    // Cleanup ao desmontar
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    // Abrir conversa se veio por query parameter
    const conversationId = searchParams.get('conversation')
    if (conversationId && conversations.length > 0) {
      handleSelectConversation(Number(conversationId))
      // Remover o parâmetro da URL
      setSearchParams({})
    }
  }, [conversations, searchParams])

  useEffect(() => {
    // Scroll to bottom quando novas mensagens chegam
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await chatService.getConversations()
      setConversations(data)
    } catch (err) {
      console.error('Erro ao carregar conversas:', err)
      showToast('error', 'Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async () => {
    try {
      setLoadingFavorites(true)
      const data = await favoriteService.getAll()
      const favoritesArray = Array.isArray(data) ? data : ('results' in data ? data.results : [])
      console.log('Favoritos carregados:', favoritesArray)
      setFavorites(favoritesArray)
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err)
      showToast('error', 'Erro ao carregar favoritos')
      setFavorites([])
    } finally {
      setLoadingFavorites(false)
    }
  }

  const handleOpenNewConversation = () => {
    loadFavorites()
    setShowNewConversationModal(true)
  }

  const handleStartConversationWithProducer = async (producerId: number) => {
    try {
      const conversation = await chatService.createConversation(producerId)
      setShowNewConversationModal(false)
      
      // Recarregar conversas para mostrar a nova
      await loadConversations()
      
      // Selecionar a nova conversa
      handleSelectConversation(conversation.id)
      
      showToast('success', 'Conversa iniciada!')
    } catch (err: any) {
      console.error('Erro ao iniciar conversa:', err)
      if (err.response?.data?.participant_id) {
        showToast('error', err.response.data.participant_id[0])
      } else {
        showToast('error', 'Erro ao iniciar conversa')
      }
    }
  }

  const loadMessages = async (conversationId: number) => {
    try {
      const data = await chatService.getMessages(conversationId)
      setMessages(data)
      
      // Marcar conversa como lida
      await chatService.markConversationAsRead(conversationId)
      
      // Atualizar contador de não lidas
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ))
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err)
      showToast('error', 'Erro ao carregar mensagens')
    }
  }

  const connectWebSocket = (conversationId: number) => {
    // Desconectar WebSocket anterior se existir
    if (wsRef.current) {
      wsRef.current.disconnect()
    }

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) {
      showToast('error', 'Token de autenticação não encontrado')
      return
    }

    const ws = new ChatWebSocket(conversationId, token)

    // Callback quando recebe mensagem
    ws.onMessage = (message: ChatMessage) => {
      setMessages(prev => {
        // Evitar duplicatas
        const exists = prev.some(m => m.id === message.id)
        if (exists) return prev
        return [...prev, message]
      })

      // Atualizar última mensagem na lista de conversas
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            last_message: {
              content: message.content,
              created_at: message.created_at,
              sender_id: message.sender_id
            },
            unread_count: message.sender_id === user?.id ? 0 : conv.unread_count
          }
        }
        return conv
      }))
    }

    ws.onError = (error) => {
      console.error('WebSocket error:', error)
      showToast('error', 'Erro na conexão em tempo real')
    }

    ws.onOpen = () => {
      console.log('Conectado ao chat em tempo real')
    }

    ws.connect()
    wsRef.current = ws
  }

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
    connectWebSocket(conversationId)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      setSending(true)
      
      // Enviar via WebSocket para entrega imediata
      if (wsRef.current && wsRef.current.isConnected()) {
        wsRef.current.sendMessage(messageContent)
      } else {
        // Fallback para API REST se WebSocket não estiver conectado
        const message = await chatService.sendMessage(selectedConversation, messageContent)
        setMessages(prev => [...prev, message])
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      showToast('error', 'Erro ao enviar mensagem')
      // Restaurar mensagem em caso de erro
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)

    // Enviar indicador de digitação
    if (wsRef.current && wsRef.current.isConnected()) {
      // Limpar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Enviar "está digitando"
      wsRef.current.sendTyping(true)

      // Após 2 segundos sem digitar, enviar "parou de digitar"
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.sendTyping(false)
        }
      }, 2000)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return formatMessageTime(timestamp)
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      })
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading variant="fullpage" text="Carregando mensagens..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mensagens-page">
        <div className="page-header">
          <div className="header-title">
            <MessageCircle size={32} color="#5a724c" />
            <div>
              <h1>Mensagens</h1>
              <p>Converse com produtores e consumidores</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleOpenNewConversation}
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Nova Conversa
          </Button>
        </div>

        {conversations.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={64} color="#ccc" />
            <h2>Nenhuma conversa ainda</h2>
            <p>Suas conversas aparecerão aqui quando você começar a interagir</p>
          </div>
        ) : (
          <div className="messages-container">
            <div className="conversations-list">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${selectedConversation === conversation.id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="conversation-avatar">
                    {conversation.other_participant?.avatar ? (
                      <img src={conversation.other_participant.avatar} alt="" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h4>{conversation.other_participant?.full_name || 'Usuário'}</h4>
                      {conversation.unread_count > 0 && (
                        <span className="unread-badge">{conversation.unread_count}</span>
                      )}
                    </div>
                    <p className="last-message">
                      {conversation.last_message?.content || 'Nenhuma mensagem ainda'}
                    </p>
                    {conversation.last_message && (
                      <span className="message-time">
                        {formatConversationTime(conversation.last_message.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="messages-panel">
              {selectedConversation ? (
                <>
                  <div className="messages-list">
                    {messages.length === 0 ? (
                      <div className="no-messages">
                        <p>Nenhuma mensagem ainda. Comece a conversa!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`message-bubble ${message.sender_id === user?.id ? 'own-message' : ''}`}
                        >
                          <div className="message-sender">{message.sender_name}</div>
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">{formatMessageTime(message.created_at)}</div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="message-input-container">
                    <input
                      type="text"
                      className="message-input"
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                      disabled={sending}
                    />
                    <button
                      className="btn-send"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-conversation-selected">
                  <MessageCircle size={64} color="#ccc" />
                  <p>Selecione uma conversa para começar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Nova Conversa */}
        {showNewConversationModal && (
          <div className="modal-overlay" onClick={() => setShowNewConversationModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Iniciar Nova Conversa</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowNewConversationModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="modal-body">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Heart size={20} />
                  Seus Favoritos
                </h3>
                
                {loadingFavorites ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Loading />
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="empty-favorites">
                    <p>Você ainda não tem favoritos.</p>
                    <p>Explore localizações e adicione aos favoritos para conversar com os produtores!</p>
                  </div>
                ) : (
                  <div className="favorites-list">
                    {favorites.map((favorite) => {
                      const location = favorite?.location_details
                      const producer = location?.producer_details
                      
                      console.log('Processando favorito:', {
                        id: favorite?.id,
                        location: location?.name,
                        producer: producer?.name,
                        userId: producer?.user
                      })
                      
                      // Pular se não tiver produtor ou usuário
                      if (!location || !producer || !producer.user) {
                        console.warn('Favorito sem dados completos:', favorite)
                        return null
                      }
                      
                      return (
                        <div 
                          key={favorite.id} 
                          className="favorite-item"
                          onClick={() => handleStartConversationWithProducer(producer.user)}
                        >
                          <div className="favorite-avatar">
                            <User size={24} />
                          </div>
                          <div className="favorite-info">
                            <h4>{location.name}</h4>
                            <p>{producer.name || 'Produtor'}</p>
                          </div>
                          <button className="btn-start-chat">
                            <MessageCircle size={18} />
                          </button>
                        </div>
                      )
                    }).filter(Boolean)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MensagensPage

 