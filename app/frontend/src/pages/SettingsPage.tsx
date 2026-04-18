import React, { useState, useEffect } from 'react'
import { Settings, Bell, MessageCircle, Heart, Save } from 'lucide-react'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import { useToast } from '../components/Toast'
import { getNotificationPreferences, updateNotificationPreferences, type NotificationPreferences } from '../api/notifications'
import './SettingsPage.css'

const SettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const data = await getNotificationPreferences()
      setPreferences(data)
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
      toast.error('Erro ao carregar preferências')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [key]: !preferences[key]
    })
  }

  const handleSave = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      await updateNotificationPreferences(preferences)
      toast.success('Preferências salvas com sucesso!')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Erro ao salvar preferências')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="settings-page">
          <div className="loading-container">
            <Loading variant="spinner" size="large" />
          </div>
        </div>
      </Layout>
    )
  }

  if (!preferences) {
    return (
      <Layout>
        <div className="settings-page">
          <div className="error-state">
            <Settings size={64} />
            <h2>Erro ao carregar configurações</h2>
            <button onClick={fetchPreferences} className="retry-btn">
              Tentar novamente
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-header">
          <div className="header-title">
            <Settings size={32} />
            <h1>Configurações de Notificações</h1>
          </div>
          <p className="header-subtitle">
            Escolha quais tipos de notificações você deseja receber
          </p>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h2 className="section-title">Notificações no aplicativo</h2>
            <p className="section-description">
              Controle quais notificações aparecem no sino de notificações
            </p>

            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon message">
                    <MessageCircle size={20} />
                  </div>
                  <div className="setting-text">
                    <h3>Mensagens</h3>
                    <p>Receba notificações quando alguém lhe enviar uma mensagem</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.receive_message_notifications}
                    onChange={() => handleToggle('receive_message_notifications')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon favorite">
                    <Heart size={20} />
                  </div>
                  <div className="setting-text">
                    <h3>Favoritos</h3>
                    <p>Receba notificações quando alguém favoritar sua localização</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.receive_favorite_notifications}
                    onChange={() => handleToggle('receive_favorite_notifications')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-icon system">
                  <Bell size={20} />
                </div>
                <div className="setting-text">
                  <h3>Notificações do Sistema</h3>
                  <p>Receba atualizações importantes e avisos do sistema</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.receive_system_notifications}
                    onChange={() => handleToggle('receive_system_notifications')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-icon admin">
                  <Settings size={20} />
                </div>
                <div className="setting-text">
                  <h3>Notificações Administrativas</h3>
                  <p>Receba comunicados importantes da administração</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.receive_admin_notifications}
                    onChange={() => handleToggle('receive_admin_notifications')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Notificações por E-mail</h2>
            <p className="section-description">
              Receba também notificações no seu e-mail
            </p>

            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon email">
                    <Bell size={20} />
                  </div>
                  <div className="setting-text">
                    <h3>E-mails de notificação</h3>
                    <p>Receba um resumo diário das suas notificações por e-mail</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.email_notifications}
                    onChange={() => handleToggle('email_notifications')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Preferências'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SettingsPage
