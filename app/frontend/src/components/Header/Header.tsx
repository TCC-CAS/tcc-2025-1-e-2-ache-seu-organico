import React from 'react'
import './Header.css'

interface HeaderProps {
  userName?: string
  onLogout?: () => void
}

const Header: React.FC<HeaderProps> = ({ userName, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <h1>🥬 Ache Seu Orgânico</h1>
        </div>
        {userName && (
          <div className="header-user">
            <span className="header-username">Olá, {userName}!</span>
            {onLogout && (
              <button onClick={onLogout} className="header-logout-btn">
                Sair
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
