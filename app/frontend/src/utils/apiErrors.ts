export interface PlanLimitErrorData {
  message: string
  plan?: string
  plan_code?: string
  resource?: string
  current_count?: number
  limit?: number | null
  upgrade_url?: string
}

export const getApiErrorMessage = (error: any, fallback: string): string => {
  const payload = error?.response?.data

  if (!payload) {
    return error?.message || fallback
  }

  if (typeof payload.detail === 'string') {
    return payload.detail
  }

  if (payload.detail && typeof payload.detail === 'object' && typeof payload.detail.detail === 'string') {
    return payload.detail.detail
  }

  if (typeof payload.message === 'string') {
    return payload.message
  }

  const firstError = Object.values(payload)[0]
  if (Array.isArray(firstError) && firstError.length > 0) {
    return String(firstError[0])
  }

  if (typeof firstError === 'string') {
    return firstError
  }

  return fallback
}

export const getPlanLimitErrorData = (error: any): PlanLimitErrorData | null => {
  const payload = error?.response?.data

  if (!payload) {
    return null
  }

  const source = payload.detail && typeof payload.detail === 'object' ? payload.detail : payload

  if (source?.code !== 'plan_limit') {
    return null
  }

  return {
    message: source.detail || 'Limite do plano atingido.',
    plan: source.plan,
    plan_code: source.plan_code,
    resource: source.resource,
    current_count: source.current_count,
    limit: source.limit,
    upgrade_url: source.upgrade_url,
  }
}
