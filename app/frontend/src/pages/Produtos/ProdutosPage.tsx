import { useState, useEffect } from 'react'
import { PackagePlus, Plus, Edit, Trash2, Leaf } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import './ProdutosPage.css'

interface Product {
  id: number
  name: string
  description: string
  price: number
  unit: string
  category: string
  image?: string
  is_active: boolean
}

const ProdutosPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // TODO: Implementar chamada para API
      // const data = await getProducerProducts()
      // setProducts(data)
      
      // Mock data temporário
      setTimeout(() => {
        setProducts([])
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
      setLoading(false)
    }
  }

  const handleCreateProduct = () => {
    // TODO: Implementar criação de produto
    alert('Funcionalidade em desenvolvimento')
  }

  const handleEdit = (productId: number) => {
    // TODO: Implementar edição
    console.log('Editar produto:', productId)
  }

  const handleDelete = (productId: number) => {
    // TODO: Implementar exclusão
    if (confirm('Deseja realmente excluir este produto?')) {
      console.log('Excluir produto:', productId)
    }
  }

  const handleToggleActive = (productId: number) => {
    // TODO: Implementar ativação/desativação
    console.log('Alternar status do produto:', productId)
  }

  if (loading) {
    return (
      <Layout>
        <div className="produtos-page">
          <div className="loading-container">
            <h2>Carregando seus produtos...</h2>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="produtos-page">
        <div className="page-header">
          <div className="header-title">
            <PackagePlus size={32} color="#5a724c" />
            <div>
              <h1>Meus Produtos</h1>
              <p>Gerencie seu catálogo de produtos orgânicos</p>
            </div>
          </div>
          <button className="btn-create" onClick={handleCreateProduct}>
            <Plus size={20} />
            Novo Produto
          </button>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <Leaf size={64} color="#ccc" />
            <h2>Nenhum produto cadastrado</h2>
            <p>Cadastre seus produtos orgânicos para que os consumidores saibam o que você oferece!</p>
            <button className="btn-create-large" onClick={handleCreateProduct}>
              <Plus size={24} />
              Cadastrar Primeiro Produto
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className={`product-card ${!product.is_active ? 'inactive' : ''}`}>
                {product.image && (
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    {!product.is_active && (
                      <div className="inactive-overlay">
                        <span>Inativo</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="product-content">
                  <h3>{product.name}</h3>
                  
                  <div className="product-category">
                    <Leaf size={14} />
                    <span>{product.category}</span>
                  </div>

                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}

                  <div className="product-price">
                    <span className="price">R$ {product.price.toFixed(2)}</span>
                    <span className="unit">/ {product.unit}</span>
                  </div>

                  <div className="product-actions">
                    <button
                      className={`btn-toggle ${product.is_active ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(product.id)}
                      title={product.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(product.id)}
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(product.id)}
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
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

export default ProdutosPage
