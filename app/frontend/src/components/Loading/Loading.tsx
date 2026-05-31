import React from 'react'
import { Loader2 } from 'lucide-react'
import './Loading.css'

interface LoadingProps {
  /**
   * Tipo de loading a ser exibido
   * - fullpage: Tela inteira com spinner
   * - spinner: Apenas o spinner (para usar inline)
   * - skeleton: Efeito de carregamento piscante para elementos
   */
  variant?: 'fullpage' | 'spinner' | 'skeleton'
  /**
   * Tamanho do loading
   */
  size?: 'small' | 'medium' | 'large'
  /**
   * Texto a ser exibido (apenas para fullpage)
   */
  text?: string
  /**
   * Altura do skeleton (apenas para skeleton)
   */
  height?: string
  /**
   * Largura do skeleton (apenas para skeleton)
   */
  width?: string
  /**
   * Estilo customizado
   */
  style?: React.CSSProperties
}

const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'medium',
  text = 'Carregando...',
  height,
  width,
  style
}) => {
  if (variant === 'fullpage') {
    return (
      <div className="loading-fullpage">
        <div className="loading-content">
          <Loader2 size={48} className="loading-spinner-icon" />
          <p className="loading-text">{text}</p>
        </div>
      </div>
    )
  }

  if (variant === 'skeleton') {
    return (
      <div 
        className="loading-skeleton"
        style={{
          height: height || '20px',
          width: width || '100%',
          ...style
        }}
      />
    )
  }

  // spinner variant
  const spinnerSize = size === 'small' ? 20 : size === 'large' ? 40 : 28
  
  return (
    <div className="loading-spinner" style={style}>
      <Loader2 size={spinnerSize} className="loading-spinner-icon" />
    </div>
  )
}

export default Loading
