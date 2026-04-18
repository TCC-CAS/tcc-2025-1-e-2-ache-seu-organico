import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Eye, Heart, MapPin, Phone, MessageCircle, Navigation, RefreshCw } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Loading from '../../components/Loading'
import { getAnalyticsSummary, AnalyticsSummary, recalculateStatistics } from '../../api/analytics'
import { useToast } from '../../components/Toast/ToastContext'
import './EstatisticasPage.css'

const EstatisticasPage = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const data = await getAnalyticsSummary()
      setSummary(data)
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err)
      showToast('Erro ao carregar estatísticas. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculate = async () => {
    try {
      setRefreshing(true)
      await recalculateStatistics()
      await loadStatistics()
      showToast('Estatísticas atualizadas com sucesso!', 'success')
    } catch (err) {
      console.error('Erro ao recalcular estatísticas:', err)
      showToast('Erro ao atualizar estatísticas.', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading variant="fullpage" text="Carregando estatísticas..." />
      </Layout>
    )
  }

  if (!summary) {
    return (
      <Layout>
        <div className="estatisticas-page">
          <div className="page-header">
            <h1>Estatísticas</h1>
            <p>Não foi possível carregar as estatísticas.</p>
          </div>
        </div>
      </Layout>
    )
  }

  const stats = summary.producer_stats

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
          <button 
            className="refresh-button" 
            onClick={handleRecalculate}
            disabled={refreshing}
            title="Atualizar estatísticas"
          >
            <RefreshCw size={20} className={refreshing ? 'spinning' : ''} />
            Atualizar
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon views">
              <Eye size={28} />
            </div>
            <div className="stat-content">
              <h3>Visualizações</h3>
              <div className="stat-value">{stats.total_views.toLocaleString()}</div>
              <div className={`stat-growth ${stats.views_growth >= 0 ? 'positive' : 'negative'}`}>
                {stats.views_growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {stats.views_growth >= 0 ? '+' : ''}{stats.views_growth.toFixed(1)}% este mês
              </div>
              <div className="stat-detail">
                {stats.monthly_views} visualizações este mês
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon favorites">
              <Heart size={28} />
            </div>
            <div className="stat-content">
              <h3>Favoritos</h3>
              <div className="stat-value">{stats.total_favorites}</div>
              <div className={`stat-growth ${stats.favorites_growth >= 0 ? 'positive' : 'negative'}`}>
                {stats.favorites_growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {stats.favorites_growth >= 0 ? '+' : ''}{stats.favorites_growth.toFixed(1)}% este mês
              </div>
              <div className="stat-detail">
                {stats.monthly_favorites} novos este mês
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon locations">
              <MapPin size={28} />
            </div>
            <div className="stat-content">
              <h3>Feiras Ativas</h3>
              <div className="stat-value">{stats.total_locations}</div>
              <div className="stat-info">Pontos de venda cadastrados</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <BarChart3 size={28} />
            </div>
            <div className="stat-content">
              <h3>Produtos</h3>
              <div className="stat-value">{stats.total_products}</div>
              <div className="stat-info">Itens no catálogo</div>
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="section-title">
          <h2>Métricas de Engajamento</h2>
        </div>

        <div className="engagement-grid">
          <div className="engagement-card">
            <div className="engagement-icon">
              <Phone size={24} />
            </div>
            <div className="engagement-content">
              <div className="engagement-label">Cliques no Telefone</div>
              <div className="engagement-value">{stats.total_phone_clicks}</div>
            </div>
          </div>

          <div className="engagement-card">
            <div className="engagement-icon">
              <MessageCircle size={24} />
            </div>
            <div className="engagement-content">
              <div className="engagement-label">Cliques no WhatsApp</div>
              <div className="engagement-value">{stats.total_whatsapp_clicks}</div>
            </div>
          </div>

          <div className="engagement-card">
            <div className="engagement-icon">
              <Navigation size={24} />
            </div>
            <div className="engagement-content">
              <div className="engagement-label">Rotas Solicitadas</div>
              <div className="engagement-value">{stats.total_directions_clicks}</div>
            </div>
          </div>

          <div className="engagement-card">
            <div className="engagement-icon">
              <Heart size={24} />
            </div>
            <div className="engagement-content">
              <div className="engagement-label">Taxa de Conversão</div>
              <div className="engagement-value">{summary.engagement_rate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Top Locations */}
        {summary.top_locations && summary.top_locations.length > 0 && (
          <>
            <div className="section-title">
              <h2>Feiras Mais Visualizadas</h2>
            </div>

            <div className="top-locations">
              {summary.top_locations.map((location, index) => (
                <div key={location.location__id} className="top-location-item">
                  <div className="location-rank">#{index + 1}</div>
                  <div className="location-name">{location.location__name}</div>
                  <div className="location-views">
                    <Eye size={16} />
                    {location.views} visualizações
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Location Stats Table */}
        {summary.location_stats && summary.location_stats.length > 0 && (
          <>
            <div className="section-title">
              <h2>Desempenho por Feira</h2>
            </div>

            <div className="locations-table">
              <table>
                <thead>
                  <tr>
                    <th>Feira</th>
                    <th>Visualizações</th>
                    <th>Favoritos</th>
                    <th>Este Mês</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.location_stats.map((location) => (
                    <tr key={location.location_id}>
                      <td className="location-name-cell">{location.location_name}</td>
                      <td>{location.total_views}</td>
                      <td>{location.total_favorites}</td>
                      <td>{location.monthly_views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="stats-footer">
          <p>Última atualização: {new Date(stats.last_calculated).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </Layout>
  )
}

export default EstatisticasPage
