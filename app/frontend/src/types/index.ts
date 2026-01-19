export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  user_type: 'CONSUMER' | 'PRODUCER'
  phone: string
  avatar?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface ProducerProfile {
  id: number
  user: User
  user_id: number
  business_name: string
  description: string
  cover_image?: string
  has_organic_certification: boolean
  certification_details: string
  website: string
  instagram: string
  facebook: string
  whatsapp: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Address {
  id: number
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

export interface Product {
  id: number
  name: string
  category: number
  category_name: string
  description: string
  image?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  created_at: string
  updated_at: string
}

export interface Location {
  id: number
  producer: number
  producer_name: string
  name: string
  location_type: 'FAIR' | 'STORE' | 'FARM' | 'DELIVERY' | 'OTHER'
  description: string
  address: Address
  products: Product[]
  main_image?: string
  images: LocationImage[]
  operation_days: string
  operation_hours: string
  phone: string
  whatsapp: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface LocationImage {
  id: number
  image: string
  caption: string
  order: number
}

export interface LocationListItem {
  id: number
  name: string
  location_type: string
  producer_name: string
  main_image?: string
  latitude?: number
  longitude?: number
  city: string
  state: string
  product_count: number
  is_verified: boolean
  is_favorited?: boolean
}

export interface Favorite {
  id: number
  user: number
  location: number
  location_details: LocationListItem
  note: string
  created_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  user_type: 'CONSUMER' | 'PRODUCER'
  phone?: string
}
