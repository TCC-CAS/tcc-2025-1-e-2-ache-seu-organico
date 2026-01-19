import { useState, useEffect } from 'react'
import { MessageCircle, Send, User } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import './MensagensPage.css'

interface Message {
  id: number
  sender_name: string
  content: string
  timestamp: string
  is_read: boolean
}

interface Conversation {
  id: number
  user_name: string
  last_message: string
  last_message_time: string
  unread_count: number
}

const MensagensPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      // TODO: Implementar chamada para API
      // const data = await getConversations()
      // setConversations(data)
      
      // Mock data temporário
      setTimeout(() => {
        setConversations([])
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error('Erro ao carregar conversas:', err)
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: number) => {
    try {
      // TODO: Implementar chamada para API
      // const data = await getMessages(conversationId)
      // setMessages(data)
      console.log('Carregando mensagens da conversa:', conversationId)
      setMessages([])
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err)
    }
  }

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      // TODO: Implementar envio de mensagem
      // await sendMessage(selectedConversation, newMessage)
      setNewMessage('')
      console.log('Enviar mensagem:', newMessage)
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="mensagens-page">
          <div className="loading-container">
            <h2>Carregando mensagens...</h2>
          </div>
        </div>
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
                    <User size={24} />
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h4>{conversation.user_name}</h4>
                      {conversation.unread_count > 0 && (
                        <span className="unread-badge">{conversation.unread_count}</span>
                      )}
                    </div>
                    <p className="last-message">{conversation.last_message}</p>
                    <span className="message-time">{conversation.last_message_time}</span>
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
                        <div key={message.id} className="message-bubble">
                          <div className="message-sender">{message.sender_name}</div>
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">{message.timestamp}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="message-input-container">
                    <input
                      type="text"
                      className="message-input"
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      className="btn-send"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
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
      </div>
    </Layout>
  )
}

export default MensagensPage
