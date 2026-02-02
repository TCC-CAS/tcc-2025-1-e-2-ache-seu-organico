import { useState } from 'react'
import { Settings, Save, Bell, Lock, Trash2 } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import './ConfiguracoesPage.css'

const ConfiguracoesPage = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    messages: true,
    favorites: true,
  })
  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showPhone: true,
    showLocation: true,
  })

  const handleSaveNotifications = () => {
    // TODO: Implementar salvamento de configurações
    alert('Configurações de notificações salvas!')
  }

  const handleSavePrivacy = () => {
    // TODO: Implementar salvamento de privacidade
    alert('Configurações de privacidade salvas!')
  }

  const handleChangePassword = () => {
    // TODO: Implementar mudança de senha
    alert('Funcionalidade em desenvolvimento')
  }

  const handleDeleteAccount = () => {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      // TODO: Implementar exclusão de conta
      console.log('Excluir conta')
    }
  }

  return (
    <Layout>
      <div className="configuracoes-page">
        <div className="page-header">
          <div className="header-title">
            <Settings size={32} color="#5a724c" />
            <div>
              <h1>Configurações</h1>
              <p>Gerencie suas preferências e privacidade</p>
            </div>
          </div>
        </div>

        <div className="settings-sections">
          {/* Notificações */}
          <div className="settings-section">
            <div className="section-header">
              <Bell size={24} color="#5a724c" />
              <h2>Notificações</h2>
            </div>
            <div className="section-content">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Notificações por E-mail</h4>
                  <p>Receba atualizações por e-mail</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Notificações Push</h4>
                  <p>Receba notificações no navegador</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Mensagens</h4>
                  <p>Notificar sobre novas mensagens</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.messages}
                    onChange={(e) => setNotifications({ ...notifications, messages: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Favoritos</h4>
                  <p>Notificar sobre atualizações de favoritos</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.favorites}
                    onChange={(e) => setNotifications({ ...notifications, favorites: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <button className="btn-save" onClick={handleSaveNotifications}>
                <Save size={18} />
                Salvar Notificações
              </button>
            </div>
          </div>

          {/* Privacidade */}
          <div className="settings-section">
            <div className="section-header">
              <Lock size={24} color="#5a724c" />
              <h2>Privacidade</h2>
            </div>
            <div className="section-content">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Mostrar E-mail</h4>
                  <p>Tornar seu e-mail visível no perfil</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={privacy.showEmail}
                    onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Mostrar Telefone</h4>
                  <p>Tornar seu telefone visível no perfil</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={privacy.showPhone}
                    onChange={(e) => setPrivacy({ ...privacy, showPhone: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Mostrar Localização</h4>
                  <p>Mostrar sua cidade e estado</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={privacy.showLocation}
                    onChange={(e) => setPrivacy({ ...privacy, showLocation: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <button className="btn-save" onClick={handleSavePrivacy}>
                <Save size={18} />
                Salvar Privacidade
              </button>
            </div>
          </div>

          {/* Segurança */}
          <div className="settings-section">
            <div className="section-header">
              <Lock size={24} color="#5a724c" />
              <h2>Segurança</h2>
            </div>
            <div className="section-content">
              <button className="btn-secondary" onClick={handleChangePassword}>
                <Lock size={18} />
                Alterar Senha
              </button>
            </div>
          </div>

          {/* Zona de Perigo */}
          <div className="settings-section danger-zone">
            <div className="section-header">
              <Trash2 size={24} color="#e74c3c" />
              <h2>Zona de Perigo</h2>
            </div>
            <div className="section-content">
              <div className="danger-info">
                <h4>Excluir Conta</h4>
                <p>Uma vez excluída, sua conta não pode ser recuperada.</p>
              </div>
              <button className="btn-danger" onClick={handleDeleteAccount}>
                <Trash2 size={18} />
                Excluir Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ConfiguracoesPage
