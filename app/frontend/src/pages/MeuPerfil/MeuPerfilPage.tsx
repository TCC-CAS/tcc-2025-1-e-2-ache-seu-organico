import { useState } from 'react'
import { User as UserIcon, Edit, Save, MapPin, Mail, Phone, Leaf } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { useAuth } from '../../contexts/AuthContext'
import { getUserTypeLabel } from '../../utils/permissions'
import './MeuPerfilPage.css'

const MeuPerfilPage = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: '',
    state: '',
    bio: '',
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    // TODO: Implementar salvamento do perfil
    setIsEditing(false)
    alert('Perfil atualizado!')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      city: '',
      state: '',
      bio: '',
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <Layout>
      <div className="perfil-page">
        <div className="page-header">
          <div className="header-title">
            <UserIcon size={32} color="#5a724c" />
            <div>
              <h1>Meu Perfil</h1>
              <p>Gerencie suas informações pessoais</p>
            </div>
          </div>
          {!isEditing && (
            <button className="btn-edit" onClick={handleEdit}>
              <Edit size={18} />
              Editar Perfil
            </button>
          )}
        </div>

        <div className="profile-container">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <UserIcon size={64} />
            </div>
            <div className="profile-type-badge">
              {user?.user_type && getUserTypeLabel(user.user_type)}
            </div>
          </div>

          <div className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <UserIcon size={16} />
                  Nome
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Seu nome"
                  />
                ) : (
                  <div className="form-value">{user?.first_name || 'Não informado'}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <UserIcon size={16} />
                  Sobrenome
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Seu sobrenome"
                  />
                ) : (
                  <div className="form-value">{user?.last_name || 'Não informado'}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>
                <Mail size={16} />
                E-mail
              </label>
              <div className="form-value">{user?.email}</div>
              {isEditing && <small>O e-mail não pode ser alterado</small>}
            </div>

            <div className="form-group">
              <label>
                <Phone size={16} />
                Telefone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
              ) : (
                <div className="form-value">{formData.phone || 'Não informado'}</div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  Cidade
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Sua cidade"
                  />
                ) : (
                  <div className="form-value">{formData.city || 'Não informado'}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  Estado
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="UF"
                    maxLength={2}
                  />
                ) : (
                  <div className="form-value">{formData.state || 'Não informado'}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>
                <Leaf size={16} />
                Sobre você
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                />
              ) : (
                <div className="form-value">{formData.bio || 'Não informado'}</div>
              )}
            </div>

            {isEditing && (
              <div className="form-actions">
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancelar
                </button>
                <button className="btn-save" onClick={handleSave}>
                  <Save size={18} />
                  Salvar Alterações
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default MeuPerfilPage
