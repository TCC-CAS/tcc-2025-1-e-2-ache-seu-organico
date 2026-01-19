import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface Location {
  id: number
  name: string
  latitude?: number
  longitude?: number
  location_type: string
  producer_name: string
  main_image?: string
  city: string
  state: string
  product_count: number
  is_verified: boolean
}

interface MapViewProps {
  locations: Location[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (locationId: number) => void
  selectedLocationId?: number
}

const MapView: React.FC<MapViewProps> = ({
  locations,
  center = [-23.5505, -46.6333], // São Paulo default
  zoom = 13,
  onMarkerClick,
  selectedLocationId,
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<{ [key: number]: L.Marker }>({})

  const getLocationTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'FAIR': 'Feira',
      'STORE': 'Loja',
      'FARM': 'Fazenda',
      'DELIVERY': 'Delivery',
      'OTHER': 'Outro'
    }
    return types[type] || type
  }

  const createPopupContent = (location: Location) => {
    const imageHtml = location.main_image 
      ? `<img src="${location.main_image}" alt="${location.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -12px -16px 12px;" />`
      : ''
    
    return `
      <div class="map-popup-content">
        ${imageHtml}
        <h3 style="margin: 0 0 8px; color: #395628; font-size: 1rem; font-weight: 600;">${location.name}</h3>
        <div style="display: flex; align-items: center; gap: 4px; color: #5a724c; font-size: 0.85rem; margin-bottom: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${location.city}, ${location.state}</span>
        </div>
        <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
          <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: rgba(90, 114, 76, 0.1); border-radius: 4px; font-size: 0.8rem; color: #5a724c;">
            ${getLocationTypeLabel(location.location_type)}
          </span>
          ${location.is_verified ? '<span style="display: inline-flex; align-items: center; padding: 4px 8px; background: rgba(34, 139, 34, 0.1); border-radius: 4px; font-size: 0.8rem; color: #228b22;">✓ Verificado</span>' : ''}
        </div>
        <div style="margin-bottom: 8px; color: #666; font-size: 0.85rem;">
          <strong>${location.product_count}</strong> produtos disponíveis
        </div>
        <button 
          onclick="window.dispatchEvent(new CustomEvent('visitLocation', { detail: ${location.id} }))"
          style="
            width: 100%;
            padding: 8px 16px;
            background: linear-gradient(135deg, #5a724c 0%, #395628 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          "
        >
          Visitar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
      </div>
    `
  }

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView(center, zoom)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current)

    // Listen for visit location events
    const handleVisitLocation = (e: any) => {
      const locationId = e.detail
      window.location.href = `/localizacao/${locationId}`
    }
    window.addEventListener('visitLocation', handleVisitLocation)

    return () => {
      mapRef.current?.remove()
      window.removeEventListener('visitLocation', handleVisitLocation)
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    // Add markers for locations
    locations.forEach(location => {
      if (location.latitude && location.longitude) {
        const marker = L.marker([location.latitude, location.longitude])
          .addTo(mapRef.current!)
          .bindPopup(createPopupContent(location), {
            maxWidth: 300,
            className: 'custom-popup'
          })

        marker.on('click', () => {
          onMarkerClick?.(location.id)
        })

        markersRef.current[location.id] = marker
      }
    })

    // Fit bounds if we have locations
    if (locations.length > 0) {
      const bounds = locations
        .filter(loc => loc.latitude && loc.longitude)
        .map(loc => [loc.latitude!, loc.longitude!] as [number, number])

      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [locations, onMarkerClick])

  useEffect(() => {
    if (!mapRef.current || !selectedLocationId) return

    const marker = markersRef.current[selectedLocationId]
    if (marker) {
      marker.openPopup()
      mapRef.current.panTo(marker.getLatLng())
    }
  }, [selectedLocationId])

  return (
    <div className="map-view-container">
      <div ref={mapContainerRef} className="map-view" />
    </div>
  )
}

export default MapView
