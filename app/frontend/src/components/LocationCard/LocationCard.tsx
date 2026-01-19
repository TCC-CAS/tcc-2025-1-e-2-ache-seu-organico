import React from 'react'
import './LocationCard.css'

interface LocationCardProps {
  id: number
  name: string
  location_type: string
  producer_name: string
  main_image?: string
  city: string
  state: string
  distance?: number
  is_verified: boolean
  products?: string[]
  onFavorite?: (id: number) => void
  isFavorited?: boolean
  onClick?: () => void
}

const LocationCard: React.FC<LocationCardProps> = ({
  id,
  name,
  location_type,
  producer_name,
  main_image,
  city,
  state,
  distance,
  is_verified,
  products = [],
  onFavorite,
  isFavorited = false,
  onClick,
}) => {
  const typeLabels: Record<string, string> = {
    FAIR: '🎪 Feira',
    STORE: '🏪 Loja',
    FARM: '🌾 Propriedade',
    DELIVERY: '🚚 Delivery',
    OTHER: '📍 Outro',
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavorite?.(id)
  }

  return (
    <div className="location-card" onClick={onClick}>
      <div className="card-image">
        {main_image ? (
          <img src={main_image} alt={name} />
        ) : (
          <div className="card-image-placeholder">
            <span className="placeholder-icon">🥬</span>
          </div>
        )}
        <button 
          className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
          onClick={handleFavorite}
        >
          {isFavorited ? '❤️' : '🤍'}
        </button>
        {is_verified && (
          <span className="verified-badge">✓ Verificado</span>
        )}
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{name}</h3>
          <span className="card-type">{typeLabels[location_type] || location_type}</span>
        </div>

        <p className="card-producer">por {producer_name}</p>

        <div className="card-location">
          <span className="location-icon">📍</span>
          <span>{city}, {state}</span>
          {distance && <span className="distance">{distance.toFixed(1)} km</span>}
        </div>

        {products.length > 0 && (
          <div className="card-tags">
            <span className="tag tag-type">{typeLabels[location_type] || location_type}</span>
            {products.slice(0, 2).map((product, idx) => (
              <span key={idx} className="tag tag-product">{product}</span>
            ))}
            {products.length > 2 && (
              <span className="tag tag-product">+{products.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationCard
