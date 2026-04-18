import React, { useState, useEffect } from 'react'
import { Bell, MessageCircle, Heart, CheckCheck } from 'lucide-react'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import { getAllNotifications, markAsRead, markAllAsRead, type Notification } from '../api/notifications'
import './NotificationsPage.css'

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await getAllNotifications()
      // Ensure data is an array
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id)
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }

    // Navigate based on notification type
    if (notification.extra_data?.url) {
      window.location.href = notification.extra_data.url
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true)
      await markAllAsRead()
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setMarkingAll(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageCircle size={20} className="icon-message" />
      case 'FAVORITE':
        return <Heart size={20} className="icon-favorite" />
      default:
        return <Bell size={20} className="icon-default" />
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.is_read
    return n.notification_type === filter
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <Layout>
      <div className="notifications-page">
        <div className="notifications-header">
          <div className="header-title">
            <Bell size={32} />
            <h1>Notificações</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="mark-all-btn"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
            >
              <CheckCheck size={18} />
              {markingAll ? 'Marcando...' : 'Marcar todas como lidas'}
            </button>
          )}
        </div>

        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Não lidas
          </button>
          <button
            className={`filter-btn ${filter === 'MESSAGE' ? 'active' : ''}`}
            onClick={() => setFilter('MESSAGE')}
          >
            <MessageCircle size={16} />
            Mensagens
          </button>
          <button
            className={`filter-btn ${filter === 'FAVORITE' ? 'active' : ''}`}
            onClick={() => setFilter('FAVORITE')}
          >
            <Heart size={16} />
            Favoritos
          </button>
          <button
            className={`filter-btn ${filter === 'SYSTEM' ? 'active' : ''}`}
            onClick={() => setFilter('SYSTEM')}
          >
            <Bell size={16} />
            Sistema
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loading variant="spinner" size="large" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={64} />
            <h2>Nenhuma notificação</h2>
            <p>
              {filter === 'unread'
                ? 'Você está em dia! Não há notificações não lidas.'
                : filter === 'all'
                ? 'Você ainda não tem notificações.'
                : 'Não há notificações deste tipo.'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon-wrapper">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="notification-body">
                  <div className="notification-header-row">
                    <h3 className="notification-title">{notification.title}</h3>
                    {!notification.is_read && (
                      <span className="unread-indicator">
                        <span className="unread-dot"></span>
                        Nova
                      </span>
                    )}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-author">{notification.author_name}</span>
                    <span className="notification-separator">•</span>
                    <span className="notification-time">{notification.time_ago}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default NotificationsPage
