import React, { type InputHTMLAttributes } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input: React.FC<InputProps> = ({ label, error, id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input id={inputId} className="input-field" {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}

export default Input
