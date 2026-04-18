import api from './axios'

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  category: number | null
  category_name: string
  description: string
  image: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductListItem {
  id: number
  name: string
  category_name: string
  image: string | null
}

export interface ProductCreateUpdatePayload {
  name: string
  category: number | null
  description: string
  image?: File | null
  is_active: boolean
}

export interface CategoryCreateUpdatePayload {
  name: string
  description: string
  icon: string
}

export const productService = {
  // Products
  getAll: async (): Promise<ProductListItem[]> => {
    const response = await api.get('/products/')
    // DRF retorna formato paginado: {count, next, previous, results}
    return response.data.results || response.data
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}/`)
    return response.data
  },

  create: async (data: ProductCreateUpdatePayload | FormData): Promise<Product> => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {}
    
    const response = await api.post('/products/', data, config)
    return response.data
  },

  update: async (id: number, data: ProductCreateUpdatePayload | FormData): Promise<Product> => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {}
    
    const response = await api.put(`/products/${id}/`, data, config)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}/`)
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/products/categories/')
    // DRF retorna formato paginado: {count, next, previous, results}
    return response.data.results || response.data
  },

  getCategoryById: async (id: number): Promise<Category> => {
    const response = await api.get(`/products/categories/${id}/`)
    return response.data
  },

  createCategory: async (data: CategoryCreateUpdatePayload): Promise<Category> => {
    const response = await api.post('/products/categories/', data)
    return response.data
  },

  updateCategory: async (id: number, data: CategoryCreateUpdatePayload): Promise<Category> => {
    const response = await api.put(`/products/categories/${id}/`, data)
    return response.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/products/categories/${id}/`)
  }
}
