import React, { type ButtonHTMLAttributes } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  fullWidth?: boolean
  loading?: boolean
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const classNames = [
    'button',
    `button-${variant}`,
    fullWidth && 'button-full-width',
    loading && 'button-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classNames} disabled={disabled || loading} {...props}>
      {loading ? 'Carregando...' : children}
    </button>
  )
}

export default Button
