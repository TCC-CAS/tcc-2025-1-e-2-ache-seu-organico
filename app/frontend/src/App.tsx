import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import HomePage from './pages/HomePage'
import FavoritosPage from './pages/Favoritos/FavoritosPage'
import MinhasFeirasPage from './pages/MinhasFeiras/MinhasFeirasPage'
import ProdutosPage from './pages/Produtos/ProdutosPage'
import EstatisticasPage from './pages/Estatisticas/EstatisticasPage'
import MensagensPage from './pages/Mensagens/MensagensPage'
import ConfiguracoesPage from './pages/Configuracoes/ConfiguracoesPage'
import MeuPerfilPage from './pages/MeuPerfil/MeuPerfilPage'
import './App.css'

// Public Route Component (redirect to home if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>Carregando...</h2>
    </div>
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Rota Home - Liberada para todos */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<Navigate to="/" />} />
      
      {/* Rotas para Consumidores */}
      <Route 
        path="/favoritos" 
        element={
          <ProtectedRoute requireAuth requireConsumer>
            <FavoritosPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Rotas para Produtores */}
      <Route 
        path="/minhas-feiras" 
        element={
          <ProtectedRoute requireAuth requireProducer>
            <MinhasFeirasPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/produtos" 
        element={
          <ProtectedRoute requireAuth requireProducer>
            <ProdutosPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/estatisticas" 
        element={
          <ProtectedRoute requireAuth requireProducer>
            <EstatisticasPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Rotas Autenticadas (qualquer tipo de usuário) */}
      <Route 
        path="/mensagens" 
        element={
          <ProtectedRoute requireAuth>
            <MensagensPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/configuracoes" 
        element={
          <ProtectedRoute requireAuth>
            <ConfiguracoesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/meu-perfil" 
        element={
          <ProtectedRoute requireAuth>
            <MeuPerfilPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
