import { type ChangeEvent, type FormEvent, useState } from 'react'
import { AlertTriangle, Settings, Save, Bell, Lock, Trash2, ChevronRight } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Modal from '../../components/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../api/auth'
import { getApiErrorMessage } from '../../utils/apiErrors'
import './ConfiguracoesPage.css'

const ConfiguracoesPage = () => {
  const { deleteAccount } = useAuth()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  })
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

  const handlePasswordFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [event.target.name]: event.target.value,
    })
  }

  const getPasswordErrorMessage = (error: unknown) => {
    const data = (error as any)?.response?.data
    return (
      data?.current_password?.[0] ||
      data?.new_password?.[0] ||
      data?.new_password_confirm?.[0] ||
      data?.non_field_errors?.[0] ||
      getApiErrorMessage(error, 'Não foi possível alterar a senha. Tente novamente.')
    )
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    setPasswordLoading(true)

    try {
      const response = await authService.changePassword(passwordForm)
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      })
      setPasswordMessage(response.message)
    } catch (error) {
      setPasswordError(getPasswordErrorMessage(error))
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteLoading) {
      return
    }

    setDeleteLoading(true)
    setDeleteError('')

    try {
      await deleteAccount()
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Não foi possível excluir sua conta. Tente novamente.'))
      setDeleteLoading(false)
    }
  }

  const openDeleteModal = () => {
    setDeleteError('')
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    if (deleteLoading) {
      return
    }

    setDeleteModalOpen(false)
    setDeleteError('')
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
              <div className="quick-settings-info">
                <p>Configure quais tipos de notificações você deseja receber e como prefere ser notificado.</p>
                <a href="/configuracoes/notificacoes" className="btn-link">
                  <Bell size={18} />
                  Gerenciar Notificações
                  <ChevronRight size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="settings-section">
            <div className="section-header">
              <Lock size={24} color="#5a724c" />
              <h2>Segurança</h2>
            </div>
            <div className="section-content">
              <form className="password-settings-form" onSubmit={handleChangePassword}>
                <div className="setting-info">
                  <h4>Alterar Senha</h4>
                  <p>Atualize sua senha usando a senha atual da conta.</p>
                </div>

                {passwordMessage && <p className="settings-success">{passwordMessage}</p>}
                {passwordError && <p className="settings-error">{passwordError}</p>}

                <div className="password-fields">
                  <div className="settings-field">
                    <label htmlFor="current_password">Senha atual</label>
                    <input
                      id="current_password"
                      type="password"
                      name="current_password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordFormChange}
                      placeholder="Senha atual"
                      required
                      disabled={passwordLoading}
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="new_password">Nova senha</label>
                    <input
                      id="new_password"
                      type="password"
                      name="new_password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordFormChange}
                      placeholder="Nova senha"
                      required
                      disabled={passwordLoading}
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="new_password_confirm">Confirmar nova senha</label>
                    <input
                      id="new_password_confirm"
                      type="password"
                      name="new_password_confirm"
                      value={passwordForm.new_password_confirm}
                      onChange={handlePasswordFormChange}
                      placeholder="Confirme a nova senha"
                      required
                      disabled={passwordLoading}
                    />
                  </div>
                </div>

                <button className="btn-secondary" type="submit" disabled={passwordLoading}>
                  <Lock size={18} />
                  {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </form>
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
              {deleteError && <p className="danger-error">{deleteError}</p>}
              <button className="btn-danger" onClick={openDeleteModal} disabled={deleteLoading}>
                <Trash2 size={18} />
                {deleteLoading ? 'Excluindo...' : 'Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Excluir conta"
        size="small"
        showCloseButton={!deleteLoading}
      >
        <div className="delete-account-modal">
          <div className="delete-modal-icon">
            <AlertTriangle size={28} />
          </div>

          <div className="delete-modal-copy">
            <h3>Tem certeza?</h3>
            <p>
              Sua conta, perfil, favoritos e dados vinculados serão excluídos permanentemente.
              Esta ação não pode ser desfeita.
            </p>
          </div>

          {deleteError && <p className="danger-error delete-modal-error">{deleteError}</p>}

          <div className="delete-modal-actions">
            <button className="btn-secondary" onClick={closeDeleteModal} disabled={deleteLoading}>
              Cancelar
            </button>
            <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
              <Trash2 size={18} />
              {deleteLoading ? 'Excluindo...' : 'Excluir conta'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default ConfiguracoesPage
