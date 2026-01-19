import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireConsumer?: boolean
  requireProducer?: boolean
  redirectTo?: string
}

/**
 * Componente para proteger rotas que precisam de autenticação
 * ou permissões específicas
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireConsumer = false,
  requireProducer = false,
  redirectTo = '/login'
}) => {
  const location = useLocation()
  const { isAuthenticated, isConsumer, isProducer, loading } = usePermissions()

  // Aguarda o carregamento do usuário antes de verificar permissões
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Carregando...</h2>
      </div>
    )
  }

  // Se precisa estar autenticado mas não está
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Se precisa ser consumidor mas não é
  if (requireConsumer && !isConsumer) {
    return <Navigate to="/" replace />
  }

  // Se precisa ser produtor mas não é
  if (requireProducer && !isProducer) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
