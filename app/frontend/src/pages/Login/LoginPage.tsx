import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../../components/Input'
import Button from '../../components/Button'
import './LoginPage.css'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedPolicies, setAcceptedPolicies] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!acceptedPolicies) {
      setError('Você precisa aceitar os termos de uso e as políticas de privacidade.')
      return
    }

    setLoading(true)

    try {
      await login({ email, password })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <img src="/logo.png" alt="Logo" className="logo-img" />
          <h1>Ache Seu Orgânico</h1>
        </div>
        <h2>Bem-vindo de volta</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            disabled={loading}
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />

          <label className="auth-consent">
            <input
              type="checkbox"
              checked={acceptedPolicies}
              onChange={(e) => setAcceptedPolicies(e.target.checked)}
              disabled={loading}
            />
            <span>
              Li e aceito os <Link to="/termos-de-uso">termos de uso</Link> e as{' '}
              <Link to="/politicas-de-privacidade">políticas de privacidade</Link>.
            </span>
          </label>

          <Button type="submit" fullWidth loading={loading}>
            Entrar
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Não tem uma conta? <Link to="/register">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
