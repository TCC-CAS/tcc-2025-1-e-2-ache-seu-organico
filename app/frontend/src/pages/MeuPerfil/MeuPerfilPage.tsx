import { useEffect, useMemo, useState } from 'react'
import { User as UserIcon, Edit, Save, Mail, Phone, Leaf, Building2, ShieldCheck, Send } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../api/auth'
import { producersService } from '../../api/producers'
import { getUserTypeLabel } from '../../utils/permissions'
import type { ProducerProfile } from '../../types'
import { useToast } from '../../components/Toast'
import './MeuPerfilPage.css'

type VerificationBadge = {
  text: string
  className: string
}

const getVerificationBadge = (profile: ProducerProfile | null): VerificationBadge => {
  if (!profile) return { text: 'Não aplicável', className: 'verification-draft' }
  if (profile.is_verified) return { text: 'Organização verificada', className: 'verification-approved' }

  switch (profile.verification_status) {
    case 'PENDING':
      return { text: 'Em análise', className: 'verification-pending' }
    case 'REJECTED':
      return { text: 'Reprovada', className: 'verification-rejected' }
    default:
      return { text: 'Não enviada', className: 'verification-draft' }
  }
}

const MeuPerfilPage = () => {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submittingVerification, setSubmittingVerification] = useState(false)
  const [producerProfile, setProducerProfile] = useState<ProducerProfile | null>(null)
  const [convertToProducer, setConvertToProducer] = useState(false)

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    business_name: '',
    description: '',
    legal_name: '',
    cnpj: '',
    state_registration: '',
    municipal_registration: '',
    website: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    has_organic_certification: false,
    certification_details: '',
  })

  useEffect(() => {
    const loadProducerProfile = async () => {
      if (user?.user_type !== 'PRODUCER') return

      try {
        setLoading(true)
        const profile = await producersService.getMe()
        setProducerProfile(profile)
        setFormData((prev) => ({
          ...prev,
          business_name: profile.business_name || '',
          description: profile.description || '',
          legal_name: profile.legal_name || '',
          cnpj: profile.cnpj || '',
          state_registration: profile.state_registration || '',
          municipal_registration: profile.municipal_registration || '',
          website: profile.website || '',
          instagram: profile.instagram || '',
          facebook: profile.facebook || '',
          whatsapp: profile.whatsapp || '',
          has_organic_certification: profile.has_organic_certification,
          certification_details: profile.certification_details || '',
        }))
      } catch {
        toast.error('Não foi possível carregar os dados empresariais.')
      } finally {
        setLoading(false)
      }
    }

    loadProducerProfile()
  }, [toast, user?.user_type])

  useEffect(() => {
    if (!user || isEditing) return

    setFormData((prev) => ({
      ...prev,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
    }))
    setConvertToProducer(false)
  }, [isEditing, user])

  const verificationBadge = useMemo(
    () => getVerificationBadge(producerProfile),
    [producerProfile]
  )

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      await authService.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        ...(user?.user_type === 'CONSUMER' && convertToProducer ? { user_type: 'PRODUCER' as const } : {}),
      })

      const updatedUser = await refreshUser()

      if (user?.user_type === 'PRODUCER' || updatedUser?.user_type === 'PRODUCER') {
        const updatedProfile = await producersService.updateMe({
          business_name: formData.business_name || `${formData.first_name} ${formData.last_name}`.trim() || formData.email,
          description: formData.description,
          legal_name: formData.legal_name,
          cnpj: formData.cnpj,
          state_registration: formData.state_registration,
          municipal_registration: formData.municipal_registration,
          website: formData.website,
          instagram: formData.instagram,
          facebook: formData.facebook,
          whatsapp: formData.whatsapp,
          has_organic_certification: formData.has_organic_certification,
          certification_details: formData.certification_details,
        })
        setProducerProfile(updatedProfile)
      }

      setIsEditing(false)
      setConvertToProducer(false)
      toast.success(convertToProducer ? 'Conta alterada para produtor com sucesso.' : 'Perfil atualizado com sucesso.')
    } catch {
      toast.error('Não foi possível salvar as alterações.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setConvertToProducer(false)
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      business_name: producerProfile?.business_name || '',
      description: producerProfile?.description || '',
      legal_name: producerProfile?.legal_name || '',
      cnpj: producerProfile?.cnpj || '',
      state_registration: producerProfile?.state_registration || '',
      municipal_registration: producerProfile?.municipal_registration || '',
      website: producerProfile?.website || '',
      instagram: producerProfile?.instagram || '',
      facebook: producerProfile?.facebook || '',
      whatsapp: producerProfile?.whatsapp || '',
      has_organic_certification: producerProfile?.has_organic_certification || false,
      certification_details: producerProfile?.certification_details || '',
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleToggleCertification = () => {
    setFormData((prev) => ({
      ...prev,
      has_organic_certification: !prev.has_organic_certification,
    }))
  }

  const handleSubmitVerification = async () => {
    try {
      setSubmittingVerification(true)
      await producersService.submitVerification()
      const profile = await producersService.getMe()
      setProducerProfile(profile)
      toast.success('Cadastro empresarial enviado para verificação.')
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Não foi possível enviar para verificação.'
      toast.error(detail)
    } finally {
      setSubmittingVerification(false)
    }
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
            {user?.user_type === 'PRODUCER' && producerProfile && (
              <div className={`verification-badge ${verificationBadge.className}`}>
                <ShieldCheck size={16} />
                {verificationBadge.text}
              </div>
            )}
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

            {user?.user_type === 'CONSUMER' && isEditing && (
              <div className="account-conversion-panel">
                <div>
                  <strong>Mudar conta para produtor</strong>
                  <p>Ative esta opção para liberar cadastro de feiras, produtos e planos de produtor.</p>
                </div>
                <label className="producer-switch">
                  <input
                    type="checkbox"
                    checked={convertToProducer}
                    onChange={(event) => setConvertToProducer(event.target.checked)}
                  />
                  <span>{convertToProducer ? 'Produtor' : 'Consumidor'}</span>
                </label>
              </div>
            )}

            {user?.user_type === 'PRODUCER' && (
              <>
                <div className="section-title">
                  <Building2 size={18} />
                  Cadastro empresarial
                </div>

                <div className="form-group">
                  <label>Nome do negócio</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder="Nome fantasia"
                    />
                  ) : (
                    <div className="form-value">{formData.business_name || 'Não informado'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Leaf size={16} />
                    Sobre o negócio
                  </label>
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Descreva sua produção e atuação"
                      rows={4}
                    />
                  ) : (
                    <div className="form-value">{formData.description || 'Não informado'}</div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Razão social</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="legal_name"
                        value={formData.legal_name}
                        onChange={handleChange}
                        placeholder="Razão social da empresa"
                      />
                    ) : (
                      <div className="form-value">{formData.legal_name || 'Não informado'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>CNPJ</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        placeholder="00.000.000/0000-00"
                      />
                    ) : (
                      <div className="form-value">{formData.cnpj || 'Não informado'}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Inscrição estadual</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="state_registration"
                        value={formData.state_registration}
                        onChange={handleChange}
                        placeholder="Número da IE"
                      />
                    ) : (
                      <div className="form-value">{formData.state_registration || 'Não informado'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Inscrição municipal</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="municipal_registration"
                        value={formData.municipal_registration}
                        onChange={handleChange}
                        placeholder="Número da IM"
                      />
                    ) : (
                      <div className="form-value">{formData.municipal_registration || 'Não informado'}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Website</label>
                    {isEditing ? (
                      <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="https://" />
                    ) : (
                      <div className="form-value">{formData.website || 'Não informado'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>WhatsApp comercial</label>
                    {isEditing ? (
                      <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(00) 00000-0000" />
                    ) : (
                      <div className="form-value">{formData.whatsapp || 'Não informado'}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Instagram</label>
                    {isEditing ? (
                      <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@perfil" />
                    ) : (
                      <div className="form-value">{formData.instagram || 'Não informado'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Facebook</label>
                    {isEditing ? (
                      <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} placeholder="Página da empresa" />
                    ) : (
                      <div className="form-value">{formData.facebook || 'Não informado'}</div>
                    )}
                  </div>
                </div>

                <div className="certification-row">
                  {isEditing ? (
                    <button type="button" className="btn-toggle-cert" onClick={handleToggleCertification}>
                      {formData.has_organic_certification ? 'Certificação orgânica: Sim' : 'Certificação orgânica: Não'}
                    </button>
                  ) : (
                    <div className="form-value">
                      {formData.has_organic_certification ? 'Possui certificação orgânica' : 'Não possui certificação orgânica'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Detalhes da certificação</label>
                  {isEditing ? (
                    <textarea
                      name="certification_details"
                      value={formData.certification_details}
                      onChange={handleChange}
                      placeholder="Ex.: OCS, IBD, Ecovida, número e validade"
                      rows={3}
                    />
                  ) : (
                    <div className="form-value">{formData.certification_details || 'Não informado'}</div>
                  )}
                </div>

                {producerProfile && (
                  <div className="verification-panel">
                    <div className="verification-panel-header">
                      <h3>Verificação empresarial</h3>
                      <span className={`verification-badge ${verificationBadge.className}`}>
                        <ShieldCheck size={14} />
                        {verificationBadge.text}
                      </span>
                    </div>
                    <p>
                      Após aprovação, seu produtor recebe o selo de verificado e suas feiras passam a ter
                      prioridade na listagem pública.
                    </p>
                    {producerProfile.verification_submitted_at && (
                      <small>
                        Enviado em {new Date(producerProfile.verification_submitted_at).toLocaleDateString('pt-BR')}.
                      </small>
                    )}
                    {!producerProfile.is_verified && producerProfile.verification_status !== 'PENDING' && (
                      <button
                        type="button"
                        className="btn-submit-verification"
                        onClick={handleSubmitVerification}
                        disabled={submittingVerification || isEditing || loading}
                      >
                        <Send size={16} />
                        {submittingVerification ? 'Enviando...' : 'Enviar para verificação'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {isEditing && (
              <div className="form-actions">
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancelar
                </button>
                <button className="btn-save" onClick={handleSave} disabled={loading}>
                  <Save size={18} />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
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
