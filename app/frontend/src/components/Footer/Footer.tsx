import React from 'react'
import './Footer.css'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© 2025 Ache Seu Orgânico - TCC Senac</p>
        <div className="footer-links">
          <a href="/sobre-nós">
            Sobre nós
          </a>
          <span className="footer-separator">•</span>
          <a href="/politicas-de-privacidade">
            Privacidade
          </a>
          <span className="footer-separator">•</span>
          <a href="/termos-de-uso">
            Termos
          </a>
          <span className="footer-separator">•</span>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <span className="footer-separator">•</span>
          <a href="/api/docs/" target="_blank" rel="noopener noreferrer">
            API Docs
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
