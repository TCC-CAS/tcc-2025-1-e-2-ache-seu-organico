import { useState, useEffect } from 'react'
import { Package, Plus, Edit, Trash2, Search } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import ProductForm, { type ProductFormData } from './ProductForm'
import { useToast } from '../../components/Toast'
import { productService, type ProductListItem, type Product } from '../../api/products'
import { resolveImageUrl } from '../../utils/imageHelpers'
import './ProdutosPage.css'

const ProdutosPage = () => {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const toast = useToast()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getAll()
      // Garantir que data é um array
      if (Array.isArray(data)) {
        setProducts(data)
        setFilteredProducts(data)
      } else {
        console.error('API retornou formato inválido:', data)
        setProducts([])
        setFilteredProducts([])
      }
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err)
      toast.error('Erro ao carregar produtos. Tente novamente.')
      setProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar produtos quando search mudar
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = products.filter(prod => 
        prod.name.toLowerCase().includes(term) ||
        (prod.category_name && prod.category_name.toLowerCase().includes(term))
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [products, searchTerm])

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const handleEdit = async (productId: number) => {
    try {
      const product = await productService.getById(productId)
      setEditingProduct(product)
      setShowModal(true)
    } catch (err: any) {
      console.error('Erro ao carregar dados do produto:', err)
      toast.error('Erro ao carregar dados do produto.')
    }
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Deseja realmente excluir este produto?')) {
      return
    }

    try {
      await productService.delete(productId)
      setProducts(prev => prev.filter(prod => prod.id !== productId))
      toast.success('Produto excluído com sucesso!')
    } catch (err: any) {
      console.error('Erro ao excluir produto:', err)
      if (err.response?.status === 403) {
        toast.error('Você não tem permissão para excluir este produto.')
      } else {
        toast.error('Erro ao excluir produto. Tente novamente.')
      }
    }
  }

  const handleSubmitForm = async (data: ProductFormData) => {
    setSubmitting(true)
    try {
      // Se há uma imagem, enviar como FormData
      if (data.image) {
        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('is_active', String(data.is_active))
        
        if (data.category) {
          formData.append('category', String(data.category))
        }
        
        formData.append('image', data.image)
        
        if (editingProduct) {
          await productService.update(editingProduct.id, formData)
          toast.success('Produto atualizado com sucesso!')
        } else {
          await productService.create(formData)
          toast.success('Produto cadastrado com sucesso!')
        }
      } else {
        // Sem imagem, enviar como JSON normal
        const payload = {
          name: data.name,
          category: data.category || null,
          description: data.description,
          is_active: data.is_active
        }

        if (editingProduct) {
          await productService.update(editingProduct.id, payload)
          toast.success('Produto atualizado com sucesso!')
        } else {
          await productService.create(payload)
          toast.success('Produto cadastrado com sucesso!')
        }
      }
      
      setShowModal(false)
      setEditingProduct(null)
      await loadProducts()
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err)
      
      if (err.response?.status === 400) {
        const errors = err.response.data
        if (typeof errors === 'object') {
          const firstError = Object.values(errors)[0]
          if (Array.isArray(firstError)) {
            toast.error(firstError[0])
          } else {
            toast.error(String(firstError))
          }
        } else {
          toast.error('Dados inválidos. Verifique os campos.')
        }
      } else if (err.response?.status === 403) {
        toast.error('Você não tem permissão para realizar esta ação.')
      } else {
        toast.error('Erro ao salvar produto. Tente novamente.')
      }
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    if (!submitting) {
      setShowModal(false)
      setEditingProduct(null)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading variant="fullpage" text="Carregando produtos..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="produtos-page">
        <div className="page-header">
          <div className="header-title">
            <Package size={32} color="#5a724c" />
            <div>
              <h1>Produtos</h1>
              <p>Gerencie o catálogo de produtos orgânicos</p>
            </div>
          </div>
          <button className="btn-create" onClick={handleCreateProduct}>
            <Plus size={20} />
            Novo Produto
          </button>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <Package size={64} color="#ccc" />
            <h2>Nenhum produto cadastrado</h2>
            <p>Cadastre produtos para associar às suas feiras!</p>
            <button className="btn-create-large" onClick={handleCreateProduct}>
              <Plus size={24} />
              Cadastrar Primeiro Produto
            </button>
          </div>
        ) : (
          <>
            {/* Busca */}
            <div className="search-container">
              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="results-count">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="no-results">
                <p>Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="products-grid">
                {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      {product.image ? (
                        <img 
                          src={resolveImageUrl(product.image) || ''}
                          alt={product.name}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16"%3ESem imagem%3C/text%3E%3C/svg%3E'
                          }}
                        />
                      ) : (
                        <div className="product-placeholder">
                          <Package size={40} color="#ccc" />
                        </div>
                      )}
                    </div>
                    
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      {product.category_name && (
                        <span className="product-category">{product.category_name}</span>
                      )}
                    </div>
                    
                    <div className="product-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(product.id)}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(product.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title={editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
          size="medium"
        >
          <ProductForm
            initialData={editingProduct ? {
              name: editingProduct.name,
              category: editingProduct.category,
              description: editingProduct.description,
              is_active: editingProduct.is_active,
              image_url: editingProduct.image || undefined
            } : undefined}
            onSubmit={handleSubmitForm}
            onCancel={handleCloseModal}
            isLoading={submitting}
          />
        </Modal>
      </div>
    </Layout>
  )
}

export default ProdutosPage
