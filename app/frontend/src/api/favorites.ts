import api from './axios'
import type { Favorite } from '../types'
import { ENDPOINTS } from '../utils/constants'

export const favoriteService = {
  getAll: async (): Promise<Favorite[]> => {
    const response = await api.get<Favorite[]>(ENDPOINTS.FAVORITES)
    return response.data
  },

  toggle: async (locationId: number, note?: string): Promise<{ message: string; favorited: boolean; favorite?: Favorite }> => {
    const response = await api.post(`${ENDPOINTS.FAVORITES}toggle/`, {
      location_id: locationId,
      note: note || '',
    })
    return response.data
  },

  check: async (locationId: number): Promise<{ favorited: boolean }> => {
    const response = await api.get(`${ENDPOINTS.FAVORITES}check/`, {
      params: { location_id: locationId },
    })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINTS.FAVORITES}${id}/`)
  },
}
