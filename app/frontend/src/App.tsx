import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import HomePage from './pages/HomePage'
import LocationDetailPage from './pages/LocationDetail'
import FavoritosPage from './pages/Favoritos/FavoritosPage'
import MinhasFeirasPage from './pages/MinhasFeiras/MinhasFeirasPage'
import ProdutosPage from './pages/Produtos/ProdutosPage'
import EstatisticasPage from './pages/Estatisticas/EstatisticasPage'
import MensagensPage from './pages/Mensagens/MensagensPage'
import ConfiguracoesPage from './pages/Configuracoes/ConfiguracoesPage'
import MeuPerfilPage from './pages/MeuPerfil/MeuPerfilPage'
import './App.css'

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Rota Home - Liberada para todos */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<Navigate to="/" />} />
      <Route path="/localizacao/:id" element={<LocationDetailPage />} />
      
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
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
