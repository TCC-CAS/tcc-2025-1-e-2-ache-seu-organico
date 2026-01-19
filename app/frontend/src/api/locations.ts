import api from './axios'
import type { LocationListItem, Location } from '../types'
import { ENDPOINTS, MAP_ENDPOINTS } from '../utils/constants'

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

  create: async (data: Partial<Location>): Promise<Location> => {
    const response = await api.post<Location>(ENDPOINTS.LOCATIONS, data)
    return response.data
  },

  update: async (id: number, data: Partial<Location>): Promise<Location> => {
    const response = await api.patch<Location>(`${ENDPOINTS.LOCATIONS}${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINTS.LOCATIONS}${id}/`)
  },
}
