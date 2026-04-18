import React from 'react'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  user?: {
    first_name: string
    full_name: string
  } | null
  onLogout?: () => void
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="layout">
      <Header user={user} onLogout={onLogout} />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout
