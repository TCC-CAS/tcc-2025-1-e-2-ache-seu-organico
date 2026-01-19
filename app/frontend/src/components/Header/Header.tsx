import React from 'react'
import './Header.css'

interface HeaderProps {
  user?: {
    first_name: string
    full_name: string
  } | null
  onLogout?: () => void
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <span className="logo-icon">🥬</span>
          <span className="logo-text">Ache Seu Orgânico</span>
        </div>

        <nav className="header-nav">
          {user ? (
            <>
              <span className="header-user">Olá, {user.first_name}!</span>
              <button onClick={onLogout} className="btn-logout">
                Sair
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="btn-login">Entrar</a>
              <a href="/register" className="btn-register">Cadastrar</a>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
