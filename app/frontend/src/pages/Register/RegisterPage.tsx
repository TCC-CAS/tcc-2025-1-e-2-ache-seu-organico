import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Tractor } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../../components/Input'
import Button from '../../components/Button'
import './RegisterPage.css'

const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    user_type: 'CONSUMER' as 'CONSUMER' | 'PRODUCER',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.password_confirm) {
      setError('As senhas não coincidem.')
      return
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)

    try {
      await register(formData)
    } catch (err: any) {
      const errorData = err.response?.data
      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
        setError(errorMessages || 'Erro ao cadastrar.')
      } else {
        setError('Erro ao cadastrar. Tente novamente.')
      }
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
        <h2>Criar nova conta</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <Input
              label="Nome"
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="João"
              required
              disabled={loading}
            />

            <Input
              label="Sobrenome"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Silva"
              required
              disabled={loading}
            />
          </div>

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="seu@email.com"
            required
            disabled={loading}
          />

          <Input
            label="Telefone (opcional)"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
            disabled={loading}
          />

          <div className="form-group">
            <label htmlFor="user_type">Tipo de Usuário</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              disabled={loading}
              className="input-field"
            >
              <option value="CONSUMER">Consumidor</option>
              <option value="PRODUCER">Produtor</option>
            </select>
            <small className="form-hint">
              {formData.user_type === 'PRODUCER' 
                ? 'Poderá cadastrar pontos de venda e produtos'
                : 'Poderá buscar e favoritar produtores'}
            </small>
          </div>

          <div className="form-row">
            <Input
              label="Senha"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />

            <Input
              label="Confirmar Senha"
              name="password_confirm"
              type="password"
              value={formData.password_confirm}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Cadastrar
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
