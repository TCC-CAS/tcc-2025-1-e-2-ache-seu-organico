import api from './axios'

export interface Notification {
  id: number
  notification_type: string
  title: string
  message: string
  author: number | null
  author_name: string
  author_avatar: string | null
  extra_data: Record<string, any>
  action_url: string
  is_read: boolean
  read_at: string | null
  created_at: string
  time_ago: string
}

export interface NotificationPreferences {
  id: number
  receive_message_notifications: boolean
  receive_favorite_notifications: boolean
  receive_system_notifications: boolean
  receive_admin_notifications: boolean
  email_notifications: boolean
}

export const notificationService = {
  /**
   * Get all notifications
   */
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications/notifications/')
    return response.data
  },

  /**
   * Get recent notifications (for dropdown)
   */
  getRecent: async (): Promise<{ notifications: Notification[]; unread_count: number }> => {
    const response = await api.get('/notifications/notifications/recent/')
    return response.data
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/notifications/notifications/unread_count/')
    return response.data.count
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.post<Notification>(`/notifications/notifications/${id}/mark_as_read/`)
    return response.data
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ status: string; marked_as_read: number }> => {
    const response = await api.post('/notifications/notifications/mark_all_as_read/')
    return response.data
  },

  /**
   * Get user notification preferences
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<NotificationPreferences>('/notifications/preferences/my_preferences/')
    return response.data
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    // Get the current preferences first to get the ID
    const current = await api.get<NotificationPreferences>('/notifications/preferences/my_preferences/')
    const response = await api.patch<NotificationPreferences>(
      `/notifications/preferences/${current.data.id}/`,
      preferences
    )
    return response.data
  },
}

// Export individual functions for convenience
export const getRecentNotifications = notificationService.getRecent
export const getAllNotifications = notificationService.getAll
export const getUnreadCount = notificationService.getUnreadCount
export const markAsRead = notificationService.markAsRead
export const markAllAsRead = notificationService.markAllAsRead
export const getNotificationPreferences = notificationService.getPreferences
export const updateNotificationPreferences = notificationService.updatePreferences
