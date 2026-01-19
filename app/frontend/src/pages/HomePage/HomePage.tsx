import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { locationService } from '../../api/locations'
import { resolveImageUrl } from '../../utils/imageHelpers'
import Header from '../../components/Header/Header'
import SearchBar from '../../components/SearchBar/SearchBar'
import LocationCard from '../../components/LocationCard/LocationCard'
import MapView from '../../components/MapView/MapView'
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
}

const HomePage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>()
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchLocations()
  }, [])

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
        is_verified: loc.is_verified
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

  const handleFavorite = (id: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      return newFavorites
    })
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
              <span className="empty-icon">🔍</span>
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
                  isFavorited={favorites.has(location.id)}
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
