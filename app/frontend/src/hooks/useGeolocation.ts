import { useState, useEffect, useCallback } from 'react'

export interface GeolocationCoordinates {
  latitude: number
  longitude: number
  accuracy: number
}

export interface GeolocationState {
  loading: boolean
  error: string | null
  coordinates: GeolocationCoordinates | null
}

export interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => void
  clearError: () => void
}

/**
 * Custom hook to get user's geolocation
 * Requests permission and tracks the user's current position
 */
export const useGeolocation = (requestOnMount = false): UseGeolocationReturn => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    coordinates: null,
  })

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: 'Geolocalização não é suportada pelo seu navegador',
        coordinates: null,
      })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        })
      },
      (error) => {
        let errorMessage = 'Erro ao obter localização'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão negada. Habilite a localização nas configurações.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível no momento'
            break
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao tentar obter localização'
            break
        }

        setState({
          loading: false,
          error: errorMessage,
          coordinates: null,
        })
      },
      {
        enableHighAccuracy: false, // Changed to false for better compatibility
        timeout: 5000, // Reduced timeout
        maximumAge: 300000, // Accept cached position up to 5 minutes old
      }
    )
  }, [])

  useEffect(() => {
    if (requestOnMount) {
      requestLocation()
    }
  }, [requestOnMount, requestLocation])

  return {
    ...state,
    requestLocation,
    clearError,
  }
}
