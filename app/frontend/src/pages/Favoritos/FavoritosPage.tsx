import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, Store, Tent, Tractor, Truck, Navigation, CheckCircle, Leaf, ExternalLink } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Loading from '../../components/Loading'
import Button from '../../components/Button'
import { useToast } from '../../components/Toast'
import { favoriteService } from '../../api/favorites'
import { resolveImageUrl } from '../../utils/imageHelpers'
import type { Favorite } from '../../types'
import './FavoritosPage.css'

const FavoritosPage = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const data = await favoriteService.getAll()
      // A API retorna um objeto com paginação: { count, next, previous, results }
      const favoritesArray = Array.isArray(data) ? data : (data.results || [])
      setFavorites(favoritesArray)
    } catch (err) {
      showToast('error', 'Erro ao carregar favoritos')
      console.error('Erro ao carregar favoritos:', err)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      await favoriteService.delete(favoriteId)
      setFavorites(favorites.filter(fav => fav.id !== favoriteId))
      showToast('success', 'Removido dos favoritos')
    } catch (err) {
      console.error('Erro ao remover favorito:', err)
      showToast('error', 'Erro ao remover favorito')
    }
  }

  const handleNavigate = (favorite: Favorite) => {
    const location = favorite.location_details
    if (location.latitude && location.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
        '_blank'
      )
    }
  }

  const handleVisit = (locationId: number) => {
    navigate(`/localizacao/${locationId}`)
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      FAIR: <Tent size={16} />,
      STORE: <Store size={16} />,
      FARM: <Tractor size={16} />,
      DELIVERY: <Truck size={16} />,
      OTHER: <Navigation size={16} />,
    }
    return icons[type] || icons.OTHER
  }

  const locationTypeLabels: Record<string, string> = {
    FAIR: 'Feira',
    STORE: 'Loja',
    FARM: 'Propriedade',
    DELIVERY: 'Delivery',
    OTHER: 'Outro'
  }

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="favoritos-page">
        <div className="favoritos-header">
          <h1>
            <Heart size={32} fill="#5a724c" color="#5a724c" />
            Meus Favoritos
          </h1>
          <p>Locais que você salvou para visitar depois</p>
        </div>


        {favorites.length === 0 ? (
          <div className="favoritos-empty">
            <Heart size={64} color="#cbd5e0" />
            <h2>Nenhum favorito ainda</h2>
            <p>Explore locais e adicione aos seus favoritos para acessá-los rapidamente!</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Explorar Locais
            </Button>
          </div>
        ) : (
          <div className="favoritos-grid">
            {Array.isArray(favorites) && favorites.map((favorite) => {
              const location = favorite.location_details
              return (
                <div key={favorite.id} className="favorito-card">
                  <div className="favorito-image-container">
                    {location.main_image ? (
                      <img 
                        src={resolveImageUrl(location.main_image) || undefined} 
                        alt={location.name}
                        className="favorito-image"
                      />
                    ) : (
                      <div className="card-image-placeholder">
                        <Leaf size={48} strokeWidth={1.5} />
                      </div>
                    )}
                    <button
                      className="favorite-btn favorited"
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      title="Remover dos favoritos"
                    >
                      <Heart size={20} fill="#e53e3e" />
                    </button>
                    {location.is_verified && (
                      <span className="verified-badge">
                        <CheckCircle size={14} />
                        Verificado
                      </span>
                    )}
                  </div>
                  
                  <div className="favorito-content">
                    <div className="favorito-header-content">
                      <h3>{location.name}</h3>
                      <span className="location-type-badge">
                        {getTypeIcon(location.location_type)}
                        {locationTypeLabels[location.location_type] || location.location_type}
                      </span>
                    </div>

                    <p className="favorito-producer">por {location.producer_name}</p>

                    <div className="favorito-info">
                      <div className="info-item">
                        <MapPin size={16} />
                        <span>{location.city}, {location.state}</span>
                      </div>
                    </div>

                    {favorite.note && (
                      <p className="favorito-note">{favorite.note}</p>
                    )}

                    <div className="favorito-actions">
                      <Button
                        variant="primary"
                        onClick={() => handleVisit(location.id)}
                      >
                        <ExternalLink size={16} style={{ marginRight: '0.5rem' }} />
                        Visitar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleNavigate(favorite)}
                      >
                        <Navigation size={16} style={{ marginRight: '0.5rem' }} />
                        Como Chegar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default FavoritosPage
