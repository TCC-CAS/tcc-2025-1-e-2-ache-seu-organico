import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import { locationService } from '../../api/locations'
import { favoriteService } from '../../api/favorites'
import { resolveImageUrl } from '../../utils/imageHelpers'
import { useOfflineFavorite } from '../../hooks/useOfflineFavorite'
import Header from '../../components/Header/Header'
import SearchBar from '../../components/SearchBar/SearchBar'
import LocationCard from '../../components/LocationCard/LocationCard'
import MapView from '../../components/MapView/MapView'
import { useToast } from '../../components/Toast'
import './HomePage.css'
import type { Product } from '../../types'

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
    zip_code?: string
    latitude: number
    longitude: number
  }
  main_image?: string
  is_verified: boolean
  is_favorited?: boolean
  product_count: number
  view_count: number
  favorite_count: number
  products?: Product[]
}

interface LocationFilters {
  type: string
  city: string
  certified: boolean
}

type SortOption = '' | 'name' | 'rating'

const normalizeSearchText = (value?: string | number | null) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const onlyDigits = (value?: string | number | null) => String(value ?? '').replace(/\D/g, '')

const compareByBusinessPriority = (a: Location, b: Location) => {
  const verifiedDiff = Number(b.is_verified) - Number(a.is_verified)
  if (verifiedDiff !== 0) return verifiedDiff

  const viewsDiff = b.view_count - a.view_count
  if (viewsDiff !== 0) return viewsDiff

  const favoritesDiff = b.favorite_count - a.favorite_count
  if (favoritesDiff !== 0) return favoritesDiff

  return a.name.localeCompare(b.name, 'pt-BR')
}

const sortLocations = (locations: Location[], sort: SortOption) => {
  const sorted = [...locations]

  if (sort === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }

  if (sort === 'rating') {
    return sorted.sort((a, b) => {
      const favoritesDiff = b.favorite_count - a.favorite_count
      return favoritesDiff !== 0 ? favoritesDiff : compareByBusinessPriority(a, b)
    })
  }

  return sorted.sort(compareByBusinessPriority)
}

const HomePage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { coordinates: userLocation, loading: geoLoading, error: geoError, requestLocation } = useGeolocation()
  
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<LocationFilters>({
    type: '',
    city: '',
    certified: false,
  })
  const [sortOption, setSortOption] = useState<SortOption>('')
  const locationRequestedRef = useRef(false)

  useEffect(() => {
    fetchLocations()
  }, [user])

  useEffect(() => {
    const normalizedQuery = normalizeSearchText(searchQuery)
    const queryDigits = onlyDigits(searchQuery)
    const normalizedCity = normalizeSearchText(filters.city)

    const nextLocations = locations.filter(loc => {
      if (filters.type && loc.location_type !== filters.type) {
        return false
      }

      if (filters.certified && !loc.is_verified) {
        return false
      }

      if (normalizedCity && !normalizeSearchText(loc.address.city).includes(normalizedCity)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const searchableFields = [
        loc.name,
        loc.producer.business_name,
        loc.address.city,
        loc.address.state,
        loc.address.zip_code,
        ...((loc.products || []).map(product => product.name)),
      ]

      const matchesText = searchableFields.some(field =>
        normalizeSearchText(field).includes(normalizedQuery)
      )
      const matchesZipCode = Boolean(queryDigits) && onlyDigits(loc.address.zip_code).includes(queryDigits)

      return matchesText || matchesZipCode
    })

    setFilteredLocations(sortLocations(nextLocations, sortOption))
  }, [locations, searchQuery, filters, sortOption])

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
          zip_code: loc.zip_code,
          latitude: loc.latitude ? parseFloat(loc.latitude.toString()) : 0,
          longitude: loc.longitude ? parseFloat(loc.longitude.toString()) : 0
        },
        main_image: loc.main_image || undefined,
        is_verified: loc.is_verified,
        is_favorited: loc.is_favorited || false,
        product_count: loc.product_count ?? loc.products?.length ?? 0,
        view_count: loc.view_count ?? 0,
        favorite_count: loc.favorite_count ?? 0,
        products: loc.products || []
      }))
      
      setLocations(mappedLocations)
    } catch (error) {
      console.error('Erro ao carregar locais:', error)
      // Em caso de erro, continuar sem dados
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilterChange = (nextFilters: LocationFilters) => {
    setFilters(nextFilters)
  }

  const handleSortChange = (sort: string) => {
    setSortOption(sort as SortOption)
  }

  const { toggleFavorite: toggleFavoriteOffline, isProcessing: favProcessing } = useOfflineFavorite()

  const handleFavorite = async (id: number, currentFavoriteState: boolean) => {
    if (!user) {
      toast.error('Faça login para adicionar favoritos')
      navigate('/login')
      return
    }

    // Atualizar UI otimisticamente
    const newState = !currentFavoriteState
    setLocations(prev => prev.map(loc => 
      loc.id === id
        ? {
          ...loc,
          is_favorited: newState,
          favorite_count: Math.max(0, loc.favorite_count + (newState ? 1 : -1)),
        }
        : loc
    ))
    
    // Usar hook offline
    const success = await toggleFavoriteOffline(id, currentFavoriteState)
    
    if (!success) {
      // Reverter se falhou
      setLocations(prev => prev.map(loc => 
        loc.id === id
          ? {
            ...loc,
            is_favorited: currentFavoriteState,
            favorite_count: Math.max(0, loc.favorite_count + (currentFavoriteState ? 1 : -1)),
          }
          : loc
      ))
    }
  }

  const handleCardClick = (id: number) => {
    setSelectedLocationId(id)
  }

  const handleRequestLocation = () => {
    locationRequestedRef.current = true
    requestLocation()
    
    // Check for errors after a short delay to avoid showing errors immediately
    setTimeout(() => {
      if (locationRequestedRef.current && geoError && !userLocation) {
        toast.error('Não foi possível obter sua localização. Verifique as permissões do navegador.')
        locationRequestedRef.current = false
      } else if (locationRequestedRef.current && userLocation) {
        toast.success('Localização obtida!')
        locationRequestedRef.current = false
      }
    }, 2000)
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
    product_count: loc.product_count,
    is_verified: loc.is_verified
  }))

  return (
    <div className="home-page">
      <Header user={user} onLogout={handleLogout} />
      <SearchBar
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />

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
                  products={location.products?.map(p => p.name) || []}
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
            userLocation={userLocation}
            onRequestLocation={handleRequestLocation}
          />
        </div>
      </div>
    </div>
  )
}

export default HomePage
