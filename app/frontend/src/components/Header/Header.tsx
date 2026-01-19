import React, { useState } from 'react'
import { Home, Store, Heart, Info, MessageCircle, Bell, User, Settings, LogOut } from 'lucide-react'
import './Header.css'

interface HeaderProps {
  user?: {
    first_name: string
    full_name: string
    avatar?: string
  } | null
  onLogout?: () => void
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <img src="/logo.png" alt="Logo" className="logo-image" />
          <span className="logo-text">Ache Seu Orgânico</span>
        </div>

        <nav className="header-nav">
          <a href="/" className="nav-link">
            <Home size={18} />
            <span>Início</span>
          </a>
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
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <button className="icon-button" title="Mensagens">
                <MessageCircle size={20} />
              </button>
              <button className="icon-button" title="Notificações">
                <Bell size={20} />
              </button>
              <div className="profile-dropdown">
                <button 
                  className="profile-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user.avatar ? (
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
                      <strong>{user.full_name}</strong>
                    </div>
                    <a href="/configuracoes" className="dropdown-item">
                      <Settings size={16} />
                      <span>Configurações</span>
                    </a>
                    <a href="/minha-pagina" className="dropdown-item">
                      <User size={16} />
                      <span>Minha Página</span>
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
              <a href="/login" className="btn-login">Entrar</a>
              <a href="/register" className="btn-register">Cadastrar</a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
