import { useState, useEffect } from 'react'
import { Heart, MapPin, Store, Navigation } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Loading from '../../components/Loading'
import { getFavorites, removeFavorite } from '../../api/favorites'
import type { Favorite } from '../../types'
import './FavoritosPage.css'

const FavoritosPage = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const data = await getFavorites()
      setFavorites(data)
    } catch (err) {
      setError('Erro ao carregar favoritos')
      console.error('Erro ao carregar favoritos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      await removeFavorite(favoriteId)
      setFavorites(favorites.filter(fav => fav.id !== favoriteId))
    } catch (err) {
      console.error('Erro ao remover favorito:', err)
      alert('Erro ao remover favorito')
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

  if (loading) {
    return (
      <Layout>
        <Loading variant="fullpage" text="Carregando favoritos..." />
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

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="favoritos-empty">
            <Heart size={64} color="#ccc" />
            <h2>Nenhum favorito ainda</h2>
            <p>Explore o mapa e adicione locais aos seus favoritos!</p>
          </div>
        ) : (
          <div className="favoritos-grid">
            {favorites.map((favorite) => {
              const location = favorite.location_details
              return (
                <div key={favorite.id} className="favorito-card">
                  {location.main_image && (
                    <div className="favorito-image">
                      <img src={location.main_image} alt={location.name} />
                    </div>
                  )}
                  
                  <div className="favorito-content">
                    <div className="favorito-header-content">
                      <h3>{location.name}</h3>
                      <button
                        className="btn-remove-favorite"
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        title="Remover dos favoritos"
                      >
                        <Heart size={20} fill="#5a724c" color="#5a724c" />
                      </button>
                    </div>

                    <div className="favorito-info">
                      <div className="info-item">
                        <MapPin size={16} />
                        <span>{location.city} - {location.state}</span>
                      </div>
                      <div className="info-item">
                        <Store size={16} />
                        <span>{location.producer_name}</span>
                      </div>
                    </div>

                    {favorite.note && (
                      <p className="favorito-description">{favorite.note}</p>
                    )}

                    <div className="favorito-actions">
                      <button
                        className="btn-navigate"
                        onClick={() => handleNavigate(favorite)}
                      >
                        <Navigation size={18} />
                        Como Chegar
                      </button>
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
