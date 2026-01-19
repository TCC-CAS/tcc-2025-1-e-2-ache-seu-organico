import React, { useState, useEffect } from 'react'
import { MapPin, Store, Calendar, Clock, Upload, X } from 'lucide-react'
import { resolveImageUrl } from '../../utils/imageHelpers'
import Input from '../Input'
import Button from '../Button'
import './FairForm.css'

export interface FairFormData {
  name: string
  location_type: 'FAIR' | 'STORE' | 'FARM' | 'DELIVERY' | 'OTHER'
  description: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  operation_days: string
  operation_hours: string
  phone: string
  whatsapp: string
  main_image?: File | null
  main_image_url?: string
}

interface FairFormProps {
  initialData?: Partial<FairFormData>
  onSubmit: (data: FairFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const LOCATION_TYPES = [
  { value: 'FAIR', label: 'Feira' },
  { value: 'STORE', label: 'Loja' },
  { value: 'FARM', label: 'Fazenda/Sítio' },
  { value: 'DELIVERY', label: 'Apenas Delivery' },
  { value: 'OTHER', label: 'Outro' }
]

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const FairForm: React.FC<FairFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<FairFormData>({
    name: initialData?.name || '',
    location_type: initialData?.location_type || 'FAIR',
    description: initialData?.description || '',
    street: initialData?.street || '',
    number: initialData?.number || '',
    complement: initialData?.complement || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip_code: initialData?.zip_code || '',
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
    operation_days: initialData?.operation_days || '',
    operation_hours: initialData?.operation_hours || '',
    phone: initialData?.phone || '',
    whatsapp: initialData?.whatsapp || ''
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FairFormData, string>>>({})
  const [loadingCep, setLoadingCep] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(
    resolveImageUrl(initialData?.main_image_url) || null
  )

  // Buscar CEP e geolocalização
  const fetchAddressByCep = async (cep: string) => {
    // Remover caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      return
    }

    setLoadingCep(true)
    try {
      const response = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`)
      
      if (!response.ok) {
        throw new Error('CEP não encontrado')
      }

      const data = await response.json()

      // Atualizar campos do formulário com os dados do CEP
      setFormData(prev => ({
        ...prev,
        street: data.address || prev.street,
        neighborhood: data.district || prev.neighborhood,
        city: data.city || prev.city,
        state: data.state || prev.state,
        latitude: data.lat ? parseFloat(data.lat) : prev.latitude,
        longitude: data.lng ? parseFloat(data.lng) : prev.longitude
      }))

      // Limpar erros dos campos preenchidos
      setErrors(prev => ({
        ...prev,
        street: undefined,
        neighborhood: undefined,
        city: undefined,
        state: undefined,
        zip_code: undefined
      }))
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
      setErrors(prev => ({
        ...prev,
        zip_code: 'CEP não encontrado'
      }))
    } finally {
      setLoadingCep(false)
    }
  }

  // Buscar CEP quando o usuário terminar de digitar
  useEffect(() => {
    const cleanCep = formData.zip_code.replace(/\D/g, '')
    
    if (cleanCep.length === 8) {
      const timer = setTimeout(() => {
        fetchAddressByCep(cleanCep)
      }, 500) // Debounce de 500ms

      return () => clearTimeout(timer)
    }
  }, [formData.zip_code])

  const handleChange = (field: keyof FairFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, main_image: 'Por favor, selecione uma imagem válida' }))
        return
      }
      
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, main_image: 'A imagem deve ter no máximo 5MB' }))
        return
      }

      setFormData(prev => ({ ...prev, main_image: file }))
      
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Limpar erro
      if (errors.main_image) {
        setErrors(prev => ({ ...prev, main_image: undefined }))
      }
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, main_image: null, main_image_url: undefined }))
    setImagePreview(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FairFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }
    if (!formData.street.trim()) {
      newErrors.street = 'Rua é obrigatória'
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório'
    }
    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória'
    }
    if (!formData.state) {
      newErrors.state = 'Estado é obrigatório'
    }
    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'CEP é obrigatório'
    } else if (!/^\d{5}-?\d{3}$/.test(formData.zip_code)) {
      newErrors.zip_code = 'CEP inválido (formato: 00000-000)'
    }
    if (!formData.operation_days.trim()) {
      newErrors.operation_days = 'Dias de funcionamento são obrigatórios'
    }
    if (!formData.operation_hours.trim()) {
      newErrors.operation_hours = 'Horário de funcionamento é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      // Erros gerais serão tratados pelo Toast no componente pai
      console.error('Erro ao submeter formulário:', error)
    }
  }

  return (
    <form className="fair-form" onSubmit={handleSubmit}>
      {/* Informações Básicas */}
      <div className="form-section">
        <h3 className="section-title">
          <Store size={20} />
          Informações Básicas
        </h3>
        
        <Input
          label="Nome da Feira/Local *"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ex: Feira Orgânica do Parque"
          error={errors.name}
          disabled={isLoading}
        />

        <div className="form-group">
          <label className="form-label">Tipo de Local *</label>
          <select
            className="form-select"
            value={formData.location_type}
            onChange={(e) => handleChange('location_type', e.target.value as FairFormData['location_type'])}
            disabled={isLoading}
          >
            {LOCATION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Descrição *</label>
          <textarea
            className="form-textarea"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descreva o local, produtos disponíveis, diferenciais..."
            rows={4}
            disabled={isLoading}
          />
          {errors.description && <span className="form-error">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Imagem Principal</label>
          <div className="image-upload-container">
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="image-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isLoading}
                  style={{ display: 'none' }}
                />
                <Upload size={32} />
                <span>Clique para adicionar uma imagem</span>
                <small>PNG, JPG ou WEBP (máx. 5MB)</small>
              </label>
            )}
          </div>
          {errors.main_image && <span className="form-error">{errors.main_image}</span>}
        </div>
      </div>

      {/* Endereço */}
      <div className="form-section">
        <h3 className="section-title">
          <MapPin size={20} />
          Endereço
        </h3>

        <div className="form-row">
          <Input
            label="CEP *"
            value={formData.zip_code}
            onChange={(e) => handleChange('zip_code', e.target.value)}
            placeholder="00000-000"
            error={errors.zip_code}
            disabled={isLoading || loadingCep}
            style={{ flex: '0 0 200px' }}
          />
          {loadingCep && (
            <div className="cep-loading">
              Buscando endereço...
            </div>
          )}
        </div>

        <div className="form-row">
          <Input
            label="Rua *"
            value={formData.street}
            onChange={(e) => handleChange('street', e.target.value)}
            placeholder="Nome da rua"
            error={errors.street}
            disabled={isLoading || loadingCep}
            style={{ flex: 2 }}
          />
          <Input
            label="Número *"
            value={formData.number}
            onChange={(e) => handleChange('number', e.target.value)}
            placeholder="123"
            error={errors.number}
            disabled={isLoading}
            style={{ flex: '0 0 120px' }}
          />
        </div>

        <div className="form-row">
          <Input
            label="Complemento"
            value={formData.complement}
            onChange={(e) => handleChange('complement', e.target.value)}
            placeholder="Apto, sala, etc"
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <Input
            label="Bairro *"
            value={formData.neighborhood}
            onChange={(e) => handleChange('neighborhood', e.target.value)}
            placeholder="Nome do bairro"
            error={errors.neighborhood}
            disabled={isLoading || loadingCep}
            style={{ flex: 1 }}
          />
        </div>

        <div className="form-row">
          <Input
            label="Cidade *"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Nome da cidade"
            error={errors.city}
            disabled={isLoading || loadingCep}
            style={{ flex: 2 }}
          />
          <div className="form-group" style={{ flex: '0 0 100px' }}>
            <label className="form-label">Estado *</label>
            <select
              className="form-select"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              disabled={isLoading || loadingCep}
            >
              <option value="">UF</option>
              {STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && <span className="form-error">{errors.state}</span>}
          </div>
        </div>

        {formData.latitude && formData.longitude && (
          <div className="geo-info">
            <MapPin size={16} />
            <span>
              Localização: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </span>
          </div>
        )}
      </div>

      {/* Horário de Funcionamento */}
      <div className="form-section">
        <h3 className="section-title">
          <Clock size={20} />
          Funcionamento
        </h3>

        <Input
          label="Dias de Funcionamento *"
          value={formData.operation_days}
          onChange={(e) => handleChange('operation_days', e.target.value)}
          placeholder="Ex: Sábados e Domingos"
          error={errors.operation_days}
          disabled={isLoading}
        />

        <Input
          label="Horário *"
          value={formData.operation_hours}
          onChange={(e) => handleChange('operation_hours', e.target.value)}
          placeholder="Ex: 7h às 13h"
          error={errors.operation_hours}
          disabled={isLoading}
        />
      </div>

      {/* Contato */}
      <div className="form-section">
        <h3 className="section-title">
          <Calendar size={20} />
          Contato
        </h3>

        <Input
          label="Telefone"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(00) 0000-0000"
          disabled={isLoading}
        />

        <Input
          label="WhatsApp"
          value={formData.whatsapp}
          onChange={(e) => handleChange('whatsapp', e.target.value)}
          placeholder="(00) 00000-0000"
          disabled={isLoading}
        />
      </div>

      {/* Botões */}
      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}

export default FairForm
