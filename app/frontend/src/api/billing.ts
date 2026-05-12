import api from './axios'
import type { BillingSummaryResponse, SubscriptionPlan } from '../types'

export const billingService = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get('/billing/plans/')
    return response.data.results || response.data
  },

  getMe: async (): Promise<BillingSummaryResponse> => {
    const response = await api.get('/billing/me/')
    return response.data
  },

  createCheckoutSession: async (planId: number): Promise<{ checkout_url: string; session_id: string }> => {
    const response = await api.post('/billing/checkout/', { plan_id: planId })
    return response.data
  },
}
