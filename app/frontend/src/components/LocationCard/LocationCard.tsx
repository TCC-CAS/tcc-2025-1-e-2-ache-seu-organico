import React from 'react'
import { MapPin, Heart, Store, Tent, Tractor, Truck, Navigation, CheckCircle, Leaf } from 'lucide-react'
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
  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      FAIR: <Tent size={16} />,
      STORE: <Store size={16} />,
      FARM: <Tractor size={16} />,
      DELIVERY: <Truck size={16} />,
      OTHER: <MapPin size={16} />,
    }
    return icons[type] || icons.OTHER
  }

  const typeLabels: Record<string, string> = {
    FAIR: 'Feira',
    STORE: 'Loja',
    FARM: 'Propriedade',
    DELIVERY: 'Delivery',
    OTHER: 'Outro',
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
            <Leaf className="placeholder-icon" size={48} strokeWidth={1.5} />
          </div>
        )}
        <button 
          className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
          onClick={handleFavorite}
        >
          <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
        {is_verified && (
          <span className="verified-badge">
            <CheckCircle size={14} />
            Verificado
          </span>
        )}
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{name}</h3>
          <span className="card-type">
            {getTypeIcon(location_type)}
            {typeLabels[location_type] || location_type}
          </span>
        </div>

        <p className="card-producer">por {producer_name}</p>

        <div className="card-location">
          <MapPin size={14} className="location-icon" />
          <span>{city}, {state}</span>
          {distance && (
            <span className="distance">
              <Navigation size={12} />
              {distance.toFixed(1)} km
            </span>
          )}
        </div>

        {products.length > 0 && (
          <div className="card-tags">
            {products.slice(0, 3).map((product, idx) => (
              <span key={idx} className="tag tag-product">{product}</span>
            ))}
            {products.length > 3 && (
              <span className="tag tag-more">+{products.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationCard
