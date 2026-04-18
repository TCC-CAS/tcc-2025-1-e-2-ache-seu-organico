import React, { useState, useEffect } from 'react'
import { Home, Store, Heart, Info, MessageCircle, Bell, User, Settings, LogOut, PackagePlus, BarChart3, LogIn, UserPlus } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import Loading from '../Loading'
import { getRecentNotifications, markAsRead, type Notification } from '../../api/notifications'
import './Header.css'

interface HeaderProps {
  user?: {
    first_name: string
    full_name: string
    avatar?: string
    user_type?: 'CONSUMER' | 'PRODUCER'
  } | null
  onLogout?: () => void
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { isAuthenticated, isConsumer, isProducer, loading } = usePermissions()

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchNotifications = async () => {
      try {
        const data = await getRecentNotifications()
        setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
        setUnreadCount(data.unread_count || 0)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        setNotifications([])
        setUnreadCount(0)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30s

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notification-dropdown') && !target.closest('.profile-dropdown')) {
        setShowNotifications(false)
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id)
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
    setShowNotifications(false)
    
    // Navigate based on notification type
    if (notification.extra_data?.url) {
      window.location.href = notification.extra_data.url
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageCircle size={16} />
      case 'FAVORITE':
        return <Heart size={16} />
      default:
        return <Bell size={16} />
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <a href="/" className="header-logo">
          <img src="/logo.png" alt="Logo" className="logo-image" />
        </a>

        <nav className="header-nav">
          {/* Navegação sempre visível */}
          <a href="/" className="nav-link">
            <Home size={18} />
            <span>Início</span>
          </a>

          {/* Navegação condicional aparece apenas quando não está carregando */}
          {!loading && !isAuthenticated && (
            <>
              <a href="/sobre" className="nav-link">
                <Info size={18} />
                <span>Sobre nós</span>
              </a>
            </>
          )}

          {/* Navegação para consumidores */}
          {!loading && isConsumer && (
            <>
              <a href="/feiras" className="nav-link">
                <Store size={18} />
                <span>Feiras e Produtores</span>
              </a>
              <a href="/favoritos" className="nav-link">
                <Heart size={18} />
                <span>Favoritos</span>
              </a>
              <a href="/sobre" className="nav-link">
                <Info size={18} />
                <span>Sobre nós</span>
              </a>
            </>
          )}

          {/* Navegação para produtores */}
          {!loading && isProducer && (
            <>
              <a href="/minhas-feiras" className="nav-link">
                <Store size={18} />
                <span>Minhas Feiras</span>
              </a>
              <a href="/produtos" className="nav-link">
                <PackagePlus size={18} />
                <span>Produtos</span>
              </a>
              <a href="/favoritos" className="nav-link">
                <Heart size={18} />
                <span>Favoritos</span>
              </a>
              <a href="/estatisticas" className="nav-link">
                <BarChart3 size={18} />
                <span>Estatísticas</span>
              </a>
            </>
          )}
        </nav>

        <div className="header-actions">
          {loading ? (
            <>
              <Loading variant="skeleton" width="40px" height="40px" style={{ borderRadius: '50%' }} />
              <Loading variant="skeleton" width="40px" height="40px" style={{ borderRadius: '50%' }} />
              <Loading variant="skeleton" width="40px" height="40px" style={{ borderRadius: '50%' }} />
            </>
          ) : isAuthenticated ? (
            <>
              {/* Mensagens e notificações para usuários autenticados */}
              <a href="/mensagens" className="icon-button" title="Mensagens">
                <MessageCircle size={20} />
              </a>
              
              {/* Dropdown de notificações */}
              <div className="notification-dropdown">
                <button 
                  className="icon-button notification-button" 
                  title="Notificações"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="dropdown-menu notifications-menu">
                    <div className="dropdown-header">
                      <strong>Notificações</strong>
                      {unreadCount > 0 && (
                        <span className="unread-count">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="notifications-list">
                      {notifications.length === 0 ? (
                        <div className="empty-notifications">
                          <Bell size={32} />
                          <p>Nenhuma notificação</p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <button
                            key={notification.id}
                            className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notification-icon">
                              {getNotificationIcon(notification.notification_type)}
                            </div>
                            <div className="notification-content">
                              <div className="notification-title">{notification.title}</div>
                              <div className="notification-message">{notification.message}</div>
                              <div className="notification-time">{notification.time_ago}</div>
                            </div>
                            {!notification.is_read && <div className="unread-dot"></div>}
                          </button>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <a href="/notificacoes" className="dropdown-footer">
                        Ver todas as notificações
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              {/* Dropdown de perfil */}
              <div className="profile-dropdown">
                <button 
                  className="profile-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.full_name} className="profile-avatar" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <User size={20} />
                    </div>
                  )}
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <strong>{user?.full_name}</strong>
                      <span className="user-type-badge">
                        {user?.user_type === 'PRODUCER' ? 'Produtor' : 'Consumidor'}
                      </span>
                    </div>
                    <a href="/configuracoes" className="dropdown-item">
                      <Settings size={16} />
                      <span>Configurações</span>
                    </a>
                    <a href="/meu-perfil" className="dropdown-item">
                      <User size={16} />
                      <span>Meu Perfil</span>
                    </a>
                    <button onClick={onLogout} className="dropdown-item">
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Botões para usuários não autenticados */}
              <a href="/login" className="btn-login">
                <LogIn size={18} />
                Entrar
              </a>
              <a href="/register" className="btn-register">
                <UserPlus size={18} />
                Cadastrar
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
