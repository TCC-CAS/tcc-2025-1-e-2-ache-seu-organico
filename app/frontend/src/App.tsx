import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import PWAPrompt from './components/PWAPrompt'
import SyncStatus from './components/SyncStatus'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import { syncService } from './utils/syncService'
import { offlineQueue } from './utils/offlineQueue'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import HomePage from './pages/HomePage'
import LocationDetailPage from './pages/LocationDetail'
import FavoritosPage from './pages/Favoritos/FavoritosPage'
import MinhasFeirasPage from './pages/MinhasFeiras/MinhasFeirasPage'
import ProdutosPage from './pages/Produtos/ProdutosPage'
import EstatisticasPage from './pages/Estatisticas/EstatisticasPage'
import MensagensPage from './pages/Mensagens/MensagensPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import ConfiguracoesPage from './pages/Configuracoes/ConfiguracoesPage'
import MeuPerfilPage from './pages/MeuPerfil/MeuPerfilPage'
import PlanosPage from './pages/Planos'
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
      <Route path="/planos" element={<PlanosPage />} />
      <Route path="/localizacao/:id" element={<LocationDetailPage />} />
      
      {/* Rotas Autenticadas */}
      <Route 
        path="/favoritos" 
        element={
          <ProtectedRoute requireAuth>
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
        path="/notificacoes" 
        element={
          <ProtectedRoute requireAuth>
            <NotificationsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/configuracoes/notificacoes" 
        element={
          <ProtectedRoute requireAuth>
            <SettingsPage />
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
  // Inicializar sistema de sincronização offline
  useEffect(() => {
    const initOfflineSync = async () => {
      try {
        await offlineQueue.init()
        syncService.startListeners()
        console.log('🔄 Sistema de sincronização offline iniciado')
      } catch (error) {
        console.error('Erro ao inicializar sincronização offline:', error)
      }
    }

    initOfflineSync()
  }, [])

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <SyncStatus />
          <AppRoutes />
          <PWAPrompt />
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
