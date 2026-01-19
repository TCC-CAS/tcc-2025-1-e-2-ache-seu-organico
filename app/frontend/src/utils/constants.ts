// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Auth endpoints
export const AUTH_ENDPOINTS = {
  TOKEN: '/token/',
  REFRESH: '/token/refresh/',
  REGISTER: '/users/register/',
  ME: '/users/me/',
}

// Resource endpoints
export const ENDPOINTS = {
  USERS: '/users/',
  PRODUCERS: '/producers/',
  LOCATIONS: '/locations/',
  PRODUCTS: '/products/',
  FAVORITES: '/favorites/',
  CATEGORIES: '/products/categories/',
}

// Map endpoints
export const MAP_ENDPOINTS = {
  MAP_DATA: '/locations/map_data/',
}

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
}
