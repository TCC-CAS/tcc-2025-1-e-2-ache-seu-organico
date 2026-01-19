import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import './HomePage.css'

const HomePage: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <Layout userName={user?.first_name} onLogout={logout}>
      <div className="home-content">
        <div className="welcome-card">
          <h2>Bem-vindo ao Ache Seu Orgânico! 🌱</h2>
          
          <div className="user-info">
            <div className="info-item">
              <span className="info-label">Nome:</span>
              <span className="info-value">{user?.full_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tipo:</span>
              <span className="info-value">
                {user?.user_type === 'PRODUCER' ? '👨‍🌾 Produtor' : '👤 Consumidor'}
              </span>
            </div>
            {user?.phone && (
              <div className="info-item">
                <span className="info-label">Telefone:</span>
                <span className="info-value">{user.phone}</span>
              </div>
            )}
          </div>

          <div className="next-steps">
            <h3>Próximos passos:</h3>
            <ul>
              {user?.user_type === 'PRODUCER' ? (
                <>
                  <li>Cadastre seus pontos de venda</li>
                  <li>Adicione produtos orgânicos</li>
                  <li>Gerencie suas informações</li>
                </>
              ) : (
                <>
                  <li>Busque produtores próximos</li>
                  <li>Favorite seus locais preferidos</li>
                  <li>Descubra produtos orgânicos</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default HomePage
