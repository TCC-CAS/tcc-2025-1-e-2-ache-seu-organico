import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Eye, Heart, MapPin } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Loading from '../../components/Loading'
import './EstatisticasPage.css'

interface Statistics {
  totalViews: number
  totalFavorites: number
  totalLocations: number
  totalProducts: number
  viewsGrowth: number
  favoritesGrowth: number
}

const EstatisticasPage = () => {
  const [stats, setStats] = useState<Statistics>({
    totalViews: 0,
    totalFavorites: 0,
    totalLocations: 0,
    totalProducts: 0,
    viewsGrowth: 0,
    favoritesGrowth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      // TODO: Implementar chamada para API
      // const data = await getProducerStatistics()
      // setStats(data)
      
      // Mock data temporário
      setTimeout(() => {
        setStats({
          totalViews: 1234,
          totalFavorites: 89,
          totalLocations: 3,
          totalProducts: 25,
          viewsGrowth: 15.5,
          favoritesGrowth: 8.2,
        })
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading variant="fullpage" text="Carregando estatísticas..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="estatisticas-page">
        <div className="page-header">
          <div className="header-title">
            <BarChart3 size={32} color="#5a724c" />
            <div>
              <h1>Estatísticas</h1>
              <p>Acompanhe o desempenho das suas feiras e produtos</p>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon views">
              <Eye size={28} />
            </div>
            <div className="stat-content">
              <h3>Visualizações</h3>
              <div className="stat-value">{stats.totalViews.toLocaleString()}</div>
              <div className="stat-growth positive">
                <TrendingUp size={16} />
                +{stats.viewsGrowth}% este mês
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon favorites">
              <Heart size={28} />
            </div>
            <div className="stat-content">
              <h3>Favoritos</h3>
              <div className="stat-value">{stats.totalFavorites}</div>
              <div className="stat-growth positive">
                <TrendingUp size={16} />
                +{stats.favoritesGrowth}% este mês
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon locations">
              <MapPin size={28} />
            </div>
            <div className="stat-content">
              <h3>Feiras Ativas</h3>
              <div className="stat-value">{stats.totalLocations}</div>
              <div className="stat-info">Pontos de venda cadastrados</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <BarChart3 size={28} />
            </div>
            <div className="stat-content">
              <h3>Produtos</h3>
              <div className="stat-value">{stats.totalProducts}</div>
              <div className="stat-info">Itens no catálogo</div>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-placeholder">
            <BarChart3 size={48} color="#ccc" />
            <h3>Gráficos em Desenvolvimento</h3>
            <p>Em breve você terá acesso a gráficos detalhados de desempenho</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default EstatisticasPage
