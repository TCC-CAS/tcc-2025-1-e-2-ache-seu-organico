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
  latitude: number
  longitude: number
  location_type: string
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

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView(center, zoom)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
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
          .bindPopup(`<b>${location.name}</b><br>${location.location_type}`)

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
        .map(loc => [loc.latitude, loc.longitude] as [number, number])

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
