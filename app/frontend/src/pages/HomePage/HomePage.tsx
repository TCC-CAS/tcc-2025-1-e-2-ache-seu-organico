import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { locationService } from '../../api/locations'
import { favoriteService } from '../../api/favorites'
import { resolveImageUrl } from '../../utils/imageHelpers'
import Header from '../../components/Header/Header'
import SearchBar from '../../components/SearchBar/SearchBar'
import LocationCard from '../../components/LocationCard/LocationCard'
import MapView from '../../components/MapView/MapView'
import { useToast } from '../../components/Toast'
import './HomePage.css'

interface Location {
  id: number
  name: string
  location_type: string
  producer: {
    id: number
    business_name: string
  }
  address: {
    city: string
    state: string
    latitude: number
    longitude: number
  }
  main_image?: string
  is_verified: boolean
  is_favorited?: boolean
}

const HomePage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>()

  useEffect(() => {
    fetchLocations()
  }, [user])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      // Buscar dados reais da API
      const data = await locationService.getMapData()
      
      // Mapear para o formato esperado pelo componente
      const mappedLocations: Location[] = data.map(loc => ({
        id: loc.id,
        name: loc.name,
        location_type: loc.location_type,
        producer: {
          id: 0, // Não disponível na resposta do map_data
          business_name: loc.producer_name
        },
        address: {
          city: loc.city,
          state: loc.state,
          latitude: loc.latitude ? parseFloat(loc.latitude.toString()) : 0,
          longitude: loc.longitude ? parseFloat(loc.longitude.toString()) : 0
        },
        main_image: loc.main_image || undefined,
        is_verified: loc.is_verified,
        is_favorited: loc.is_favorited || false
      }))
      
      setLocations(mappedLocations)
      setFilteredLocations(mappedLocations)
    } catch (error) {
      console.error('Erro ao carregar locais:', error)
      // Em caso de erro, continuar sem dados
      setLocations([])
      setFilteredLocations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredLocations(locations)
      return
    }

    const filtered = locations.filter(loc =>
      loc.name.toLowerCase().includes(query.toLowerCase()) ||
      loc.producer.business_name.toLowerCase().includes(query.toLowerCase()) ||
      loc.address.city.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredLocations(filtered)
  }

  const handleFilterChange = (filters: any) => {
    let filtered = [...locations]

    if (filters.type) {
      filtered = filtered.filter(loc => loc.location_type === filters.type)
    }

    if (filters.city) {
      filtered = filtered.filter(loc =>
        loc.address.city.toLowerCase().includes(filters.city.toLowerCase())
      )
    }

    if (filters.certified) {
      filtered = filtered.filter(loc => loc.is_verified)
    }

    setFilteredLocations(filtered)
  }

  const handleFavorite = async (id: number) => {
    if (!user) {
      toast.error('Faça login para adicionar favoritos')
      navigate('/login')
      return
    }

    try {
      const result = await favoriteService.toggle(id)
      
      // Atualizar o estado local da location
      setLocations(prev => prev.map(loc => 
        loc.id === id ? { ...loc, is_favorited: result.favorited } : loc
      ))
      setFilteredLocations(prev => prev.map(loc => 
        loc.id === id ? { ...loc, is_favorited: result.favorited } : loc
      ))
      
      if (result.favorited) {
        toast.success('Adicionado aos favoritos!')
      } else {
        toast.success('Removido dos favoritos')
      }
    } catch (error: any) {
      console.error('Erro ao favoritar:', error)
      toast.error('Erro ao atualizar favorito')
    }
  }

  const handleCardClick = (id: number) => {
    setSelectedLocationId(id)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const mapLocations = filteredLocations.map(loc => ({
    id: loc.id,
    name: loc.name,
    latitude: loc.address.latitude,
    longitude: loc.address.longitude,
    location_type: loc.location_type,
    producer_name: loc.producer.business_name,
    city: loc.address.city,
    state: loc.address.state,
    main_image: resolveImageUrl(loc.main_image) || undefined,
    product_count: 0, // Não disponível no map_data
    is_verified: loc.is_verified
  }))

  return (
    <div className="home-page">
      <Header user={user} onLogout={handleLogout} />
      <SearchBar onSearch={handleSearch} onFilterChange={handleFilterChange} />

      <div className="home-content">
        <div className="locations-list">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Carregando locais...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="empty-state">
              <SearchX size={64} strokeWidth={1.5} color="#999" />
              <h3>Nenhum local encontrado</h3>
              <p>Tente ajustar os filtros ou buscar por outro termo</p>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredLocations.map(location => (
                <LocationCard
                  key={location.id}
                  id={location.id}
                  name={location.name}
                  location_type={location.location_type}
                  producer_name={location.producer.business_name}
                  main_image={resolveImageUrl(location.main_image) || undefined}
                  city={location.address.city}
                  state={location.address.state}
                  is_verified={location.is_verified}
                  products={['Alface', 'Tomate', 'Cenoura', 'Beterraba']}
                  onFavorite={handleFavorite}
                  isFavorited={location.is_favorited || false}
                  onClick={() => handleCardClick(location.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="map-container">
          <MapView
            locations={mapLocations}
            onMarkerClick={setSelectedLocationId}
            selectedLocationId={selectedLocationId}
          />
        </div>
      </div>
    </div>
  )
}

export default HomePage
