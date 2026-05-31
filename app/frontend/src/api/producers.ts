import api from './axios'
import { ENDPOINTS } from '../utils/constants'
import type { ProducerProfile } from '../types'

export type ProducerProfileUpdatePayload = Partial<Pick<
  ProducerProfile,
  | 'business_name'
  | 'description'
  | 'has_organic_certification'
  | 'certification_details'
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'legal_name'
  | 'cnpj'
  | 'state_registration'
  | 'municipal_registration'
>>

export const producersService = {
  getMe: async (): Promise<ProducerProfile> => {
    const response = await api.get<ProducerProfile>(`${ENDPOINTS.PRODUCERS}me/`)
    return response.data
  },

  updateMe: async (data: ProducerProfileUpdatePayload): Promise<ProducerProfile> => {
    const response = await api.patch<ProducerProfile>(`${ENDPOINTS.PRODUCERS}me/`, data)
    return response.data
  },

  uploadVerificationDocuments: async (files: File[]): Promise<{
    files: Array<{
      token: string
      original_filename: string
      content_type: string
      size: number
    }>
  }> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    const response = await api.post(`${ENDPOINTS.PRODUCERS}upload_verification_document/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  submitVerification: async (documentTokens: string[] = []): Promise<{
    detail: string
    verification_status: ProducerProfile['verification_status']
    verification_submitted_at: string | null
  }> => {
    const response = await api.post(`${ENDPOINTS.PRODUCERS}submit_verification/`, {
      document_tokens: documentTokens,
    })
    return response.data
  },
}
