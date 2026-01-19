import { useState, useEffect } from 'react'
import { Store, Plus, MapPin, Edit, Trash2, Eye } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import FairForm, { type FairFormData } from '../../components/FairForm'
import { useToast } from '../../components/Toast'
import { locationService, type LocationCreateUpdatePayload } from '../../api/locations'
import type { LocationListItem, Location } from '../../types'
import './MinhasFeirasPage.css'

const MinhasFeirasPage = () => {
  const [locations, setLocations] = useState<LocationListItem[]>([])
  const [filteredLocations, setFilteredLocations] = useState<LocationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const toast = useToast()

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      const data = await locationService.getMyLocations()
      setLocations(data)
      setFilteredLocations(data)
    } catch (err: any) {
      console.error('Erro ao carregar feiras:', err)
      toast.error('Erro ao carregar suas feiras. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar localizações quando search ou filter mudar
  useEffect(() => {
    let filtered = [...locations]

    // Filtrar por tipo
    if (filterType !== 'ALL') {
      filtered = filtered.filter(loc => loc.location_type === filterType)
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(loc => 
        loc.name.toLowerCase().includes(term) ||
        loc.city.toLowerCase().includes(term) ||
        loc.state.toLowerCase().includes(term)
      )
    }

    setFilteredLocations(filtered)
  }, [locations, searchTerm, filterType])

  const handleCreateLocation = () => {
    setEditingLocation(null)
    setShowModal(true)
  }

  const handleEdit = async (locationId: number) => {
    try {
      // Buscar dados completos da localização
      const location = await locationService.getById(locationId)
      setEditingLocation(location)
      setShowModal(true)
    } catch (err: any) {
      console.error('Erro ao carregar dados da feira:', err)
      toast.error('Erro ao carregar dados da feira.')
    }
  }

  const handleDelete = async (locationId: number) => {
    if (!confirm('Deseja realmente excluir esta feira?')) {
      return
    }

    try {
      await locationService.delete(locationId)
      setLocations(prev => prev.filter(loc => loc.id !== locationId))
      toast.success('Feira excluída com sucesso!')
    } catch (err: any) {
      console.error('Erro ao excluir feira:', err)
      if (err.response?.status === 403) {
        toast.error('Você não tem permissão para excluir esta feira.')
      } else {
        toast.error('Erro ao excluir feira. Tente novamente.')
      }
    }
  }

  const handleView = (locationId: number) => {
    console.log('Ver feira:', locationId)
  }

  const handleSubmitForm = async (data: FairFormData) => {
    setSubmitting(true)
    try {
      // Se há uma imagem, enviar como FormData
      if (data.main_image) {
        const formData = new FormData()
        
        // Dados básicos
        formData.append('name', data.name)
        formData.append('location_type', data.location_type)
        formData.append('description', data.description)
        
        // Endereço (enviado como JSON string)
        formData.append('address', JSON.stringify({
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          latitude: data.latitude,
          longitude: data.longitude
        }))
        
        // Horários
        formData.append('operation_days', data.operation_days)
        formData.append('operation_hours', data.operation_hours)
        
        // Contatos
        formData.append('phone', data.phone)
        formData.append('whatsapp', data.whatsapp)
        
        // Produtos
        if (data.product_ids && data.product_ids.length > 0) {
          formData.append('product_ids', JSON.stringify(data.product_ids))
        }
        
        // Imagem
        formData.append('main_image', data.main_image)
        
        if (editingLocation) {
          await locationService.update(editingLocation.id, formData)
          toast.success('Feira atualizada com sucesso!')
        } else {
          await locationService.create(formData)
          toast.success('Feira cadastrada com sucesso!')
        }
      } else {
        // Sem imagem, enviar como JSON normal
        const payload: LocationCreateUpdatePayload = {
          name: data.name,
          location_type: data.location_type,
          description: data.description,
          address: {
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            latitude: data.latitude,
            longitude: data.longitude
          },
          operation_days: data.operation_days,
          operation_hours: data.operation_hours,
          phone: data.phone,
          whatsapp: data.whatsapp,
          product_ids: data.product_ids
        }

        if (editingLocation) {
          await locationService.update(editingLocation.id, payload)
          toast.success('Feira atualizada com sucesso!')
        } else {
          await locationService.create(payload)
          toast.success('Feira cadastrada com sucesso!')
        }
      }
      
      setShowModal(false)
      setEditingLocation(null)
      await loadLocations()
    } catch (err: any) {
      console.error('Erro ao salvar feira:', err)
      
      // Verificar erros específicos
      if (err.response?.status === 400) {
        // Erros de validação do backend
        const errors = err.response.data
        if (typeof errors === 'object') {
          // Mostrar primeiro erro encontrado
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
      } else if (err.response?.status === 500) {
        toast.error('Erro no servidor. Tente novamente mais tarde.')
      } else if (err.message?.includes('limite')) {
        toast.error('Você atingiu o limite de feiras cadastradas.')
      } else {
        toast.error('Erro ao salvar feira. Tente novamente.')
      }
      
      // Re-throw para que o formulário saiba que falhou
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    if (!submitting) {
      setShowModal(false)
      setEditingLocation(null)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading variant="fullpage" text="Carregando suas feiras..." />
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
          <>
            {/* Filtros */}
            <div className="filters-container">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar por nome ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-group">
                <label>Tipo:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="ALL">Todos</option>
                  <option value="FAIR">Feira</option>
                  <option value="STORE">Loja</option>
                  <option value="FARM">Fazenda/Sítio</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              <div className="results-count">
                {filteredLocations.length} {filteredLocations.length === 1 ? 'resultado' : 'resultados'}
              </div>
            </div>

            {filteredLocations.length === 0 ? (
              <div className="no-results">
                <p>Nenhuma feira encontrada com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="locations-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Localização</th>
                      <th>Produtos</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map((location) => (
                      <tr key={location.id}>
                        <td className="location-name">
                          <strong>{location.name}</strong>
                        </td>
                        <td>
                          <span className={`badge badge-${location.location_type.toLowerCase()}`}>
                            {location.location_type === 'FAIR' && 'Feira'}
                            {location.location_type === 'STORE' && 'Loja'}
                            {location.location_type === 'FARM' && 'Fazenda'}
                            {location.location_type === 'DELIVERY' && 'Delivery'}
                            {location.location_type === 'OTHER' && 'Outro'}
                          </span>
                        </td>
                        <td>
                          <div className="location-info">
                            <MapPin size={14} />
                            <span>{location.city} - {location.state}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          {location.product_count || 0}
                        </td>
                        <td>
                          {location.is_verified ? (
                            <span className="status-badge verified">Verificado</span>
                          ) : (
                            <span className="status-badge pending">Pendente</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-view"
                              onClick={() => handleView(location.id)}
                              title="Visualizar"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => handleEdit(location.id)}
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => handleDelete(location.id)}
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title={editingLocation ? 'Editar Feira' : 'Cadastrar Nova Feira'}
          size="large"
        >
          <FairForm
            initialData={editingLocation ? {
              name: editingLocation.name,
              location_type: editingLocation.location_type as any,
              description: editingLocation.description,
              street: editingLocation.address.street,
              number: editingLocation.address.number,
              complement: editingLocation.address.complement,
              neighborhood: editingLocation.address.neighborhood,
              city: editingLocation.address.city,
              state: editingLocation.address.state,
              zip_code: editingLocation.address.zip_code,
              operation_days: editingLocation.operation_days,
              operation_hours: editingLocation.operation_hours,
              phone: editingLocation.phone,
              whatsapp: editingLocation.whatsapp,
              product_ids: editingLocation.products?.map(p => p.id) || [],
              main_image_url: editingLocation.main_image || undefined
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

export default MinhasFeirasPage
