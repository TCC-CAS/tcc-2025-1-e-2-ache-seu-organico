import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Calendar, 
  Phone, 
  CheckCircle, 
  Map,
  Leaf,
  Store,
  Tent,
  Tractor,
  Truck,
  Navigation
} from 'lucide-react'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import MapView from '../../components/MapView/MapView'
import { useToast } from '../../components/Toast'
import { locationService } from '../../api/locations'
import { favoriteService } from '../../api/favorites'
import { resolveImageUrl } from '../../utils/imageHelpers'
import type { Location } from '../../types'
import './LocationDetailPage.css'

const LocationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    loadLocation()
  }, [id])

  const loadLocation = async () => {
    try {
      setLoading(true)
      const data = await locationService.getById(Number(id))
      setLocation(data)
      
      // Verifica se está favoritado
      try {
        const favStatus = await favoriteService.check(data.id)
        setIsFavorited(favStatus.favorited)
      } catch (error) {
        setIsFavorited(false)
      }
    } catch (error) {
      console.error('Erro ao carregar localização:', error)
      showToast('error', 'Erro ao carregar localização')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!location) return
    
    try {
      setFavoriteLoading(true)
      
      const result = await favoriteService.toggle(location.id)
      setIsFavorited(result.favorited)
      
      if (result.favorited) {
        showToast('success', 'Adicionado aos favoritos')
      } else {
        showToast('success', 'Removido dos favoritos')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        showToast('error', 'Faça login para favoritar')
        navigate('/login')
      } else {
        showToast('error', 'Erro ao favoritar')
      }
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleContact = () => {
    if (!location?.whatsapp) {
      showToast('error', 'WhatsApp não disponível')
      return
    }
    
    const phone = location.whatsapp.replace(/\D/g, '')
    const message = encodeURIComponent(`Olá! Vi ${location.name} no Ache Seu Orgânico e gostaria de saber mais informações.`)
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
  }

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    )
  }

  if (!location) {
    return (
      <Layout>
        <div className="location-detail-error">
          <h2>Localização não encontrada</h2>
          <Button onClick={() => navigate('/')}>Voltar para Home</Button>
        </div>
      </Layout>
    )
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

  return (
    <Layout>
      <div className="location-detail">
        {/* Hero Section com Imagem Principal */}
        <div className="location-hero">
          {location.main_image ? (
            <img 
              src={resolveImageUrl(location.main_image) || undefined} 
              alt={location.name}
              className="location-hero-image"
            />
          ) : (
            <div className="location-hero-placeholder">
              <Leaf className="placeholder-icon" size={120} strokeWidth={1.5} />
            </div>
          )}
          
          <div className="location-hero-overlay">
            <div className="location-hero-content">
              <h1 className="location-title">{location.name}</h1>
              <p className="location-producer">por {location.producer_name}</p>
              
              <div className="location-hero-bottom">
                <div className="location-badge-group">
                  <span className="location-type-badge">
                    {getTypeIcon(location.location_type)}
                    {locationTypeLabels[location.location_type] || location.location_type}
                  </span>
                  {location.is_verified && (
                    <span className="verified-badge">
                      <CheckCircle size={14} />
                      Verificado
                    </span>
                  )}
                </div>
                
                <div className="location-hero-actions">
                  <Button
                    variant="primary"
                    onClick={handleContact}
                    disabled={!location.whatsapp}
                  >
                    <MessageCircle size={18} style={{ marginRight: '0.5rem' }} />
                    Entrar em Contato
                  </Button>
                  <Button
                    variant={isFavorited ? 'primary' : 'secondary'}
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                  >
                    <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} style={{ marginRight: '0.5rem' }} />
                    {isFavorited ? 'Favoritado' : 'Favoritar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="location-content">
          <div className="location-main">
            {/* Sobre */}
            <section className="location-section">
              <h2>Sobre</h2>
              <p className="location-description">{location.description}</p>
            </section>

            {/* Produtos */}
            {location.products && location.products.length > 0 && (
              <section className="location-section">
                <h2>Produtos Disponíveis</h2>
                <div className="products-grid">
                  {location.products.map((product) => (
                    <div key={product.id} className="product-card">
                      {product.image ? (
                        <img 
                          src={resolveImageUrl(product.image) || undefined} 
                          alt={product.name}
                          className="product-image"
                        />
                      ) : (
                        <div className="product-image-placeholder">
                          <Leaf size={48} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <span className="product-category">{product.category_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Horários de Funcionamento */}
            <section className="location-section">
              <h2>Horário de Funcionamento</h2>
              <div className="operation-info">
                <div className="info-item">
                  <Calendar size={20} className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Dias</span>
                    <span className="info-value">{location.operation_days}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Clock size={20} className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Horário</span>
                    <span className="info-value">{location.operation_hours}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Contato */}
            <section className="location-section">
              <h2>Contato</h2>
              <div className="contact-info">
                {location.phone && (
                  <div className="contact-item">
                    <Phone size={20} className="contact-icon" />
                    <span>{location.phone}</span>
                  </div>
                )}
                {location.whatsapp && (
                  <div className="contact-item">
                    <MessageCircle size={20} className="contact-icon" />
                    <span>{location.whatsapp}</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar com Mapa e Endereço */}
          <aside className="location-sidebar">
            {/* Endereço */}
            <div className="sidebar-section">
              <h3><MapPin size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Localização</h3>
              <address className="location-address">
                <p>{location.address.street}, {location.address.number}</p>
                {location.address.complement && <p>{location.address.complement}</p>}
                <p>{location.address.neighborhood}</p>
                <p>{location.address.city} - {location.address.state}</p>
                <p>CEP: {location.address.zip_code}</p>
              </address>
            </div>

            {/* Mapa */}
            {location.address.latitude && location.address.longitude && (
              <div className="sidebar-section">
                <h3><Map size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Mapa</h3>
                <div className="location-map">
                  <MapView
                    locations={[{
                      id: location.id,
                      name: location.name,
                      location_type: location.location_type,
                      producer_name: location.producer_name,
                      main_image: location.main_image,
                      latitude: location.address.latitude,
                      longitude: location.address.longitude,
                      city: location.address.city,
                      state: location.address.state,
                      product_count: location.products?.length || 0,
                      is_verified: location.is_verified
                    }]}
                    center={[location.address.latitude, location.address.longitude]}
                    zoom={15}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${location.address.latitude},${location.address.longitude}`,
                      '_blank'
                    )
                  }}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  <Navigation size={18} style={{ marginRight: '0.5rem' }} />
                  Abrir no Google Maps
                </Button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  )
}

export default LocationDetailPage
