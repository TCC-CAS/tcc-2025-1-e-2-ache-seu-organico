import { useState, useEffect } from 'react'
import { Store, Plus, MapPin, Edit, Trash2, Eye } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import type { LocationListItem } from '../../types'
import './MinhasFeirasPage.css'

const MinhasFeirasPage = () => {
  const [locations, setLocations] = useState<LocationListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      // TODO: Implementar chamada para API
      // const data = await getProducerLocations(user?.id)
      // setLocations(data)
      
      // Mock data temporário
      setTimeout(() => {
        setLocations([])
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error('Erro ao carregar feiras:', err)
      setLoading(false)
    }
  }

  const handleCreateLocation = () => {
    // TODO: Implementar criação de feira
    alert('Funcionalidade em desenvolvimento')
  }

  const handleEdit = (locationId: number) => {
    // TODO: Implementar edição
    console.log('Editar feira:', locationId)
  }

  const handleDelete = (locationId: number) => {
    // TODO: Implementar exclusão
    if (confirm('Deseja realmente excluir esta feira?')) {
      console.log('Excluir feira:', locationId)
    }
  }

  const handleView = (locationId: number) => {
    // TODO: Implementar visualização
    console.log('Ver feira:', locationId)
  }

  if (loading) {
    return (
      <Layout>
        <div className="minhas-feiras-page">
          <div className="loading-container">
            <h2>Carregando suas feiras...</h2>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="minhas-feiras-page">
        <div className="page-header">
          <div className="header-title">
            <Store size={32} color="#5a724c" />
            <div>
              <h1>Minhas Feiras</h1>
              <p>Gerencie suas feiras e pontos de venda</p>
            </div>
          </div>
          <button className="btn-create" onClick={handleCreateLocation}>
            <Plus size={20} />
            Nova Feira
          </button>
        </div>

        {locations.length === 0 ? (
          <div className="empty-state">
            <Store size={64} color="#ccc" />
            <h2>Nenhuma feira cadastrada</h2>
            <p>Cadastre sua primeira feira para começar a vender seus produtos orgânicos!</p>
            <button className="btn-create-large" onClick={handleCreateLocation}>
              <Plus size={24} />
              Cadastrar Primeira Feira
            </button>
          </div>
        ) : (
          <div className="locations-grid">
            {locations.map((location) => (
              <div key={location.id} className="location-card">
                {location.main_image && (
                  <div className="location-image">
                    <img src={location.main_image} alt={location.name} />
                  </div>
                )}
                
                <div className="location-content">
                  <h3>{location.name}</h3>
                  
                  <div className="location-info">
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>{location.city} - {location.state}</span>
                    </div>
                  </div>

                  <div className="location-actions">
                    <button
                      className="btn-action btn-view"
                      onClick={() => handleView(location.id)}
                      title="Visualizar"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(location.id)}
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(location.id)}
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

export default MinhasFeirasPage
