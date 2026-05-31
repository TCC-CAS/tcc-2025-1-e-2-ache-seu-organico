import React from 'react'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import { useAuth } from '../../contexts/AuthContext'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  user?: {
    first_name: string
    full_name: string
    avatar?: string
    user_type?: 'CONSUMER' | 'PRODUCER'
  } | null
  onLogout?: () => void
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const { user: authUser, logout } = useAuth()
  const headerUser = user ?? authUser
  const handleLogout = onLogout ?? logout

  return (
    <div className="layout">
      <Header user={headerUser} onLogout={handleLogout} />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout
