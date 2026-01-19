import React, { useState } from 'react'
import { Home, Store, Heart, Info, MessageCircle, Bell, User, Settings, LogOut, PackagePlus, BarChart3, LogIn, UserPlus } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import Loading from '../Loading'
import './Header.css'

interface HeaderProps {
  user?: {
    first_name: string
    full_name: string
    avatar?: string
    user_type?: 'CONSUMER' | 'PRODUCER'
  } | null
  onLogout?: () => void
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const { isAuthenticated, isConsumer, isProducer, loading } = usePermissions()

  return (
    <header className="header">
      <div className="header-content">
        <a href="/" className="header-logo">
          <img src="/logo.png" alt="Logo" className="logo-image" />
        </a>

        <nav className="header-nav">
          {/* Navegação sempre visível */}
          <a href="/" className="nav-link">
            <Home size={18} />
            <span>Início</span>
          </a>

          {/* Navegação condicional aparece apenas quando não está carregando */}
          {!loading && !isAuthenticated && (
            <>
              <a href="/sobre" className="nav-link">
                <Info size={18} />
                <span>Sobre nós</span>
              </a>
            </>
          )}

          {/* Navegação para consumidores */}
          {!loading && isConsumer && (
            <>
              <a href="/feiras" className="nav-link">
                <Store size={18} />
                <span>Feiras e Produtores</span>
              </a>
              <a href="/favoritos" className="nav-link">
                <Heart size={18} />
                <span>Favoritos</span>
              </a>
              <a href="/sobre" className="nav-link">
                <Info size={18} />
                <span>Sobre nós</span>
              </a>
            </>
          )}

          {/* Navegação para produtores */}
          {!loading && isProducer && (
            <>
              <a href="/minhas-feiras" className="nav-link">
                <Store size={18} />
                <span>Minhas Feiras</span>
              </a>
              <a href="/meus-produtos" className="nav-link">
                <PackagePlus size={18} />
                <span>Produtos</span>
              </a>
              <a href="/estatisticas" className="nav-link">
                <BarChart3 size={18} />
                <span>Estatísticas</span>
              </a>
            </>
          )}
        </nav>

        <div className="header-actions">
          {loading ? (
            <>
              <Loading variant="skeleton" width="40px" height="40px" style={{ borderRadius: '50%' }} />
              <Loading variant="skeleton" width="40px" height="40px" style={{ borderRadius: '50%' }} />
              <Loading variant="skeleton" width="40px" height="40px" style={{ borderRadius: '50%' }} />
            </>
          ) : isAuthenticated ? (
            <>
              {/* Mensagens e notificações para usuários autenticados */}
              <a href="/mensagens" className="icon-button" title="Mensagens">
                <MessageCircle size={20} />
              </a>
              <button className="icon-button" title="Notificações">
                <Bell size={20} />
              </button>
              
              {/* Dropdown de perfil */}
              <div className="profile-dropdown">
                <button 
                  className="profile-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.full_name} className="profile-avatar" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <User size={20} />
                    </div>
                  )}
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <strong>{user?.full_name}</strong>
                      <span className="user-type-badge">
                        {user?.user_type === 'PRODUCER' ? 'Produtor' : 'Consumidor'}
                      </span>
                    </div>
                    <a href="/configuracoes" className="dropdown-item">
                      <Settings size={16} />
                      <span>Configurações</span>
                    </a>
                    <a href="/meu-perfil" className="dropdown-item">
                      <User size={16} />
                      <span>Meu Perfil</span>
                    </a>
                    <button onClick={onLogout} className="dropdown-item">
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Botões para usuários não autenticados */}
              <a href="/login" className="btn-login">
                <LogIn size={18} />
                Entrar
              </a>
              <a href="/register" className="btn-register">
                <UserPlus size={18} />
                Cadastrar
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
