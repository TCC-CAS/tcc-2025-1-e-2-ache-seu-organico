import React, { useState, useEffect } from 'react'
import { Package, Upload, X } from 'lucide-react'
import { resolveImageUrl } from '../../utils/imageHelpers'
import { productService, type Category } from '../../api/products'
import Input from '../../components/Input'
import Button from '../../components/Button'
import './ProductForm.css'

export interface ProductFormData {
  name: string
  category: number | null
  description: string
  is_active: boolean
  image?: File | null
  image_url?: string
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    category: initialData?.category || null,
    description: initialData?.description || '',
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [imagePreview, setImagePreview] = useState<string | null>(
    resolveImageUrl(initialData?.image_url) || null
  )
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const data = await productService.getCategories()
      // Garantir que data é um array
      if (Array.isArray(data)) {
        setCategories(data)
      } else {
        console.error('API retornou formato inválido:', data)
        setCategories([])
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleChange = (field: keyof ProductFormData, value: any) => {
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
        setErrors(prev => ({ ...prev, image: 'Por favor, selecione uma imagem válida' }))
        return
      }
      
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'A imagem deve ter no máximo 5MB' }))
        return
      }

      setFormData(prev => ({ ...prev, image: file }))
      
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Limpar erro
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }))
      }
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: null, image_url: undefined }))
    setImagePreview(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
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
    } catch (err) {
      // Erros já são tratados no componente pai
      console.error('Erro no formulário:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="product-form">
      {/* Imagem */}
      <div className="form-section">
        <label className="section-label">
          <Upload size={20} />
          Imagem do Produto
        </label>
        
        <div className="image-upload-container">
          {imagePreview ? (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={handleRemoveImage}
                disabled={isLoading}
              >
                <X size={20} />
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
              <Package size={40} />
              <span>Clique para selecionar uma imagem</span>
              <small>PNG, JPG ou JPEG (máx. 5MB)</small>
            </label>
          )}
        </div>
        {errors.image && <span className="error-message">{errors.image}</span>}
      </div>

      {/* Informações Básicas */}
      <div className="form-section">
        <label className="section-label">
          <Package size={20} />
          Informações Básicas
        </label>
        
        <Input
          label="Nome do Produto"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          disabled={isLoading}
          required
          placeholder="Ex: Alface Orgânica"
        />

        <div className="form-group">
          <label>Categoria</label>
          <select
            value={formData.category || ''}
            onChange={(e) => handleChange('category', e.target.value ? Number(e.target.value) : null)}
            disabled={isLoading || loadingCategories}
            className="form-select"
          >
            <option value="">Sem categoria</option>
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon && `${cat.icon} `}{cat.name}
              </option>
            ))}
          </select>
          {loadingCategories && <small>Carregando categorias...</small>}
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={isLoading}
            rows={4}
            placeholder="Descreva o produto, suas características, benefícios..."
            className={`form-textarea ${errors.description ? 'error' : ''}`}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              disabled={isLoading}
            />
            <span>Produto ativo (visível no catálogo)</span>
          </label>
        </div>
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
          loading={isLoading}
          disabled={isLoading}
        >
          {initialData ? 'Atualizar Produto' : 'Cadastrar Produto'}
        </Button>
      </div>
    </form>
  )
}

export default ProductForm
