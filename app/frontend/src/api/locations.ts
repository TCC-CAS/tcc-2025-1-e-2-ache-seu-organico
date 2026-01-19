import api from './axios'
import type { LocationListItem, Location } from '../types'
import { ENDPOINTS, MAP_ENDPOINTS } from '../utils/constants'

// Interface para criação/atualização de location (formato da API)
export interface LocationCreateUpdatePayload {
  name: string
  location_type: 'FAIR' | 'STORE' | 'FARM' | 'DELIVERY' | 'OTHER'
  description: string
  address: {
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
    latitude?: number
    longitude?: number
  }
  operation_days: string
  operation_hours: string
  phone: string
  whatsapp: string
}

export const locationService = {
  getAll: async (): Promise<LocationListItem[]> => {
    const response = await api.get<LocationListItem[]>(ENDPOINTS.LOCATIONS)
    return response.data
  },

  getById: async (id: number): Promise<Location> => {
    const response = await api.get<Location>(`${ENDPOINTS.LOCATIONS}${id}/`)
    return response.data
  },

  getMapData: async (): Promise<LocationListItem[]> => {
    const response = await api.get<LocationListItem[]>(MAP_ENDPOINTS.MAP_DATA)
    return response.data
  },

  getMyLocations: async (): Promise<LocationListItem[]> => {
    const response = await api.get<LocationListItem[]>(`${ENDPOINTS.LOCATIONS}my_locations/`)
    return response.data
  },

  create: async (data: LocationCreateUpdatePayload | FormData): Promise<Location> => {
    const response = await api.post<Location>(ENDPOINTS.LOCATIONS, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    })
    return response.data
  },

  update: async (id: number, data: LocationCreateUpdatePayload | FormData): Promise<Location> => {
    const response = await api.patch<Location>(`${ENDPOINTS.LOCATIONS}${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINTS.LOCATIONS}${id}/`)
  },
}

