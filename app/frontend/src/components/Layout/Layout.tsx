import React from 'react'
import Header from '../Header'
import Footer from '../Footer'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  userName?: string
  onLogout?: () => void
}

const Layout: React.FC<LayoutProps> = ({ children, userName, onLogout }) => {
  return (
    <div className="layout">
      <Header userName={userName} onLogout={onLogout} />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout
