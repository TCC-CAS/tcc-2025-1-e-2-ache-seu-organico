import { useAuth } from '../contexts/AuthContext'
import {
  isAuthenticated,
  isConsumer,
  isProducer,
  canAccessConsumerFeatures,
  canAccessProducerFeatures,
  canManageLocation,
  canSendMessages,
  canFavoriteLocations,
  getUserTypeLabel,
  needsProfileCompletion,
  getHomeRouteForUser
} from '../utils/permissions'

/**
 * Hook customizado para verificar permissões do usuário
 * Facilita o uso de verificações de permissão em qualquer componente
 */
export const usePermissions = () => {
  const { user, loading } = useAuth()

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(user),
    isConsumer: isConsumer(user),
    isProducer: isProducer(user),
    canAccessConsumerFeatures: canAccessConsumerFeatures(user),
    canAccessProducerFeatures: canAccessProducerFeatures(user),
    canManageLocation: (producerId: number) => canManageLocation(user, producerId),
    canSendMessages: canSendMessages(user),
    canFavoriteLocations: canFavoriteLocations(user),
    getUserTypeLabel: () => user ? getUserTypeLabel(user.user_type) : '',
    needsProfileCompletion: needsProfileCompletion(user),
    getHomeRoute: getHomeRouteForUser(user)
  }
}
