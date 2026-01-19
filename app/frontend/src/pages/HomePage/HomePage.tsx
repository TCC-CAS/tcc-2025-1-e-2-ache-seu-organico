import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
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
      // Mock data for now - replace with actual API call
      const mockLocations: Location[] = [
        {
          id: 1,
          name: 'Feira Orgânica Vila Madalena',
          location_type: 'FAIR',
          producer: {
            id: 1,
            business_name: 'Sítio Verde'
          },
          address: {
            city: 'São Paulo',
            state: 'SP',
            latitude: -23.5505,
            longitude: -46.6333
          },
          is_verified: true
        },
        {
          id: 2,
          name: 'Mercado Orgânico Pinheiros',
          location_type: 'STORE',
          producer: {
            id: 2,
            business_name: 'Fazenda Boa Terra'
          },
          address: {
            city: 'São Paulo',
            state: 'SP',
            latitude: -23.5629,
            longitude: -46.6824
          },
          is_verified: true
        },
        {
          id: 3,
          name: 'Sítio da Família Silva',
          location_type: 'FARM',
          producer: {
            id: 3,
            business_name: 'Orgânicos Silva'
          },
          address: {
            city: 'São Paulo',
            state: 'SP',
            latitude: -23.5489,
            longitude: -46.6388
          },
          is_verified: false
        },
        {
          id: 4,
          name: 'Feira Livre Jardins',
          location_type: 'FAIR',
          producer: {
            id: 4,
            business_name: 'Horta do Seu João'
          },
          address: {
            city: 'São Paulo',
            state: 'SP',
            latitude: -23.5645,
            longitude: -46.6553
          },
          is_verified: true
        },
        {
          id: 5,
          name: 'Delivery Orgânico Express',
          location_type: 'DELIVERY',
          producer: {
            id: 5,
            business_name: 'Verde Delivery'
          },
          address: {
            city: 'São Paulo',
            state: 'SP',
            latitude: -23.5475,
            longitude: -46.6361
          },
          is_verified: true
        },
        {
          id: 6,
          name: 'Loja Natural Life',
          location_type: 'STORE',
          producer: {
            id: 6,
            business_name: 'Natural Life Produtos'
          },
          address: {
            city: 'São Paulo',
            state: 'SP',
            latitude: -23.5588,
            longitude: -46.6584
          },
          is_verified: false
        }
      ]
      
      setLocations(mockLocations)
      setFilteredLocations(mockLocations)
    } catch (error) {
      console.error('Erro ao carregar locais:', error)
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
    main_image: loc.main_image,
    product_count: 4, // TODO: get from actual data
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
                  main_image={location.main_image}
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
