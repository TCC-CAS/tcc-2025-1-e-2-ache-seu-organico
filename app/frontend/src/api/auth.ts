import api from './axios'
import type { 
  AuthTokens, 
  LoginCredentials, 
  RegisterData, 
  User 
} from '../types'
import { AUTH_ENDPOINTS, STORAGE_KEYS } from '../utils/constants'

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await api.post<AuthTokens>(AUTH_ENDPOINTS.TOKEN, credentials)
    const { access, refresh } = response.data

    // Store tokens
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh)

    return response.data
  },

  register: async (data: RegisterData): Promise<{ message: string; user: User }> => {
    const response = await api.post(AUTH_ENDPOINTS.REGISTER, data)
    return response.data
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>(AUTH_ENDPOINTS.ME)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data))
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch<User>(AUTH_ENDPOINTS.ME, data)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data))
    return response.data
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  },
}
