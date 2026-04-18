import type { User } from '../types'

export type UserType = 'CONSUMER' | 'PRODUCER'

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = (user: User | null | undefined): boolean => {
  // Se o usuário existe, ele está autenticado
  // O campo is_active é opcional - se não estiver presente, assume-se true
  return !!user && (user.is_active !== false)
}

/**
 * Verifica se o usuário é um consumidor
 */
export const isConsumer = (user: User | null | undefined): boolean => {
  return isAuthenticated(user) && user?.user_type === 'CONSUMER'
}

/**
 * Verifica se o usuário é um produtor
 */
export const isProducer = (user: User | null | undefined): boolean => {
  return isAuthenticated(user) && user?.user_type === 'PRODUCER'
}

/**
 * Verifica se o usuário pode acessar áreas de consumidor
 * (funcionalidades como favoritos, buscar feiras, etc)
 */
export const canAccessConsumerFeatures = (user: User | null | undefined): boolean => {
  return isConsumer(user)
}

/**
 * Verifica se o usuário pode acessar áreas de produtor
 * (funcionalidades como gerenciar feiras, produtos, etc)
 */
export const canAccessProducerFeatures = (user: User | null | undefined): boolean => {
  return isProducer(user)
}

/**
 * Verifica se o usuário pode gerenciar uma feira/localização específica
 */
export const canManageLocation = (user: User | null | undefined, producerId: number): boolean => {
  return isProducer(user) && user?.id === producerId
}

/**
 * Verifica se o usuário pode enviar mensagens
 */
export const canSendMessages = (user: User | null | undefined): boolean => {
  return isAuthenticated(user)
}

/**
 * Verifica se o usuário pode favoritar locais
 */
export const canFavoriteLocations = (user: User | null | undefined): boolean => {
  return isConsumer(user)
}

/**
 * Retorna o tipo de usuário de forma legível
 */
export const getUserTypeLabel = (userType: UserType): string => {
  const labels: Record<UserType, string> = {
    CONSUMER: 'Consumidor',
    PRODUCER: 'Produtor'
  }
  return labels[userType]
}

/**
 * Verifica se o usuário precisa completar o perfil
 */
export const needsProfileCompletion = (user: User | null | undefined): boolean => {
  if (!isAuthenticated(user)) return false
  
  // Produtor precisa ter nome do negócio
  if (isProducer(user)) {
    return !user?.first_name || !user?.last_name
  }
  
  // Consumidor precisa ter nome completo
  return !user?.first_name || !user?.last_name
}

/**
 * Retorna a rota inicial baseada no tipo de usuário
 */
export const getHomeRouteForUser = (user: User | null | undefined): string => {
  if (!isAuthenticated(user)) return '/'
  
  if (isProducer(user)) {
    return '/minhas-feiras'
  }
  
  return '/'
}
