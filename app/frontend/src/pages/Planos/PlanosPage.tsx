import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck, Bolt, Crown, Sparkles, ShieldCheck, Store, Package, Check } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { billingService } from '../../api/billing'
import type { SubscriptionPlan, BillingSummaryResponse } from '../../types'
import { useToast } from '../../components/Toast'
import './PlanosPage.css'

const PlanosPage = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [billing, setBilling] = useState<BillingSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')

    if (!status) {
      return
    }

    if (status === 'success') {
      toast.success('Pagamento confirmado! Seu plano foi atualizado.')
      if (user) {
        billingService
          .getMe()
          .then(setBilling)
          .catch(() => {
            // Falha silenciosa: a tela continua funcional e pode ser atualizada no próximo reload.
          })
      }
    } else if (status === 'pending') {
      toast.info('Pagamento em processamento. Atualize em instantes para conferir o status.')
    } else if (status === 'cancel') {
      toast.info('Pagamento cancelado. Você pode tentar novamente quando quiser.')
    } else {
      toast.error('Não foi possível confirmar o pagamento. Tente novamente.')
    }

    window.history.replaceState({}, document.title, window.location.pathname)
  }, [toast, user])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [planData, billingData] = await Promise.allSettled([
          billingService.getPlans(),
          user ? billingService.getMe() : Promise.resolve(null),
        ])

        if (planData.status === 'fulfilled') {
          setPlans(planData.value)
        }

        if (billingData.status === 'fulfilled') {
          setBilling(billingData.value)
        }
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
        toast.error('Não foi possível carregar os planos no momento.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [toast, user])

  const activePlanCode = billing?.summary?.plan?.code || user?.billing_plan?.code || null

  const freePlan = useMemo(() => plans.find(plan => plan.code === 'FREE'), [plans])
  const premiumPlan = useMemo(() => plans.find(plan => plan.code === 'PREMIUM'), [plans])
  const basicPlan = useMemo(() => plans.find(plan => plan.code === 'BASIC'), [plans])

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      window.location.href = '/register'
      return
    }

    if (plan.code === 'FREE') {
      toast.info('O plano Gratis e o ponto de entrada da plataforma. Quando quiser escalar, escolha Basico ou Premium.')
      return
    }

    try {
      setCheckoutLoadingId(plan.id)
      const { checkout_url } = await billingService.createCheckoutSession(plan.id)
      window.location.href = checkout_url
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error)
      toast.error('Não foi possível iniciar o pagamento. Tente novamente.')
    } finally {
      setCheckoutLoadingId(null)
    }
  }

  if (loading) {
    return (
      <Layout user={user}>
        <Loading variant="fullpage" text="Carregando planos..." />
      </Layout>
    )
  }

  return (
    <Layout user={user}>
      <div className="plans-page">
        <section className="plans-hero">
          <div className="hero-copy">
            <span className="eyebrow">Assinaturas e crescimento</span>
            <h1>Escolha um plano que acompanhe o ritmo da sua produção.</h1>
            <p>
              Comece com um plano acessível e evolua quando quiser. O Premium libera alcance ilimitado,
              prioridade comercial e uma presença mais forte na plataforma.
            </p>
            <div className="hero-actions">
              <Button variant="primary" onClick={() => document.getElementById('pricing-cards')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver planos
                <ArrowRight size={18} />
              </Button>
              <a href="#comparison" className="hero-link">Comparar recursos</a>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-card">
              <BadgeCheck size={24} />
              <strong>
                {activePlanCode === 'PREMIUM' ? 'Seu plano atual e Premium' : activePlanCode === 'BASIC' ? 'Seu plano atual e Basico' : 'Seu plano atual e Gratis'}
              </strong>
              <p>
                {activePlanCode === 'PREMIUM'
                  ? 'Você já desbloqueou os recursos mais competitivos da plataforma.'
                  : 'Suba de nivel para aumentar visibilidade e reduzir friccao na operacao.'}
              </p>
            </div>
            <div className="hero-stats">
              <div>
                <span>{premiumPlan?.limits.locations ?? '∞'}</span>
                <small>Feiras Premium</small>
              </div>
              <div>
                <span>{premiumPlan?.limits.products ?? '∞'}</span>
                <small>Produtos Premium</small>
              </div>
              <div>
                <span>{freePlan?.formatted_price || 'Gratis'}</span>
                <small>Plano inicial</small>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing-cards" className="pricing-cards">
          {(plans.length > 0 ? plans : []).map(plan => {
            const isCurrent = activePlanCode === plan.code
            const isPremium = plan.code === 'PREMIUM'
            const isFree = plan.code === 'FREE'

            return (
              <article key={plan.id} className={`plan-card ${isPremium ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="plan-badge-row">
                  <span className="plan-badge">{isPremium ? 'Recomendado' : isFree ? 'Plano inicial' : 'Escala com controle'}</span>
                  {isCurrent && <span className="current-badge">Plano atual</span>}
                </div>

                <div className="plan-head">
                  <div className="plan-icon">
                    {isPremium ? <Crown size={26} /> : isFree ? <Store size={26} /> : <BadgeCheck size={26} />}
                  </div>
                  <div>
                    <h2>{plan.name}</h2>
                    <p>{plan.description}</p>
                  </div>
                </div>

                <div className="plan-price">
                  <strong>{plan.formatted_price}</strong>
                  <span>{plan.monthly_price === '0.00' ? 'para sempre' : '/mes'}</span>
                </div>

                <div className="plan-limits">
                  <div>
                    <Sparkles size={16} />
                    <span>{plan.limits.locations === null ? 'Feiras ilimitadas' : `${plan.limits.locations} feiras`}</span>
                  </div>
                  <div>
                    <Package size={16} />
                    <span>{plan.limits.products === null ? 'Produtos ilimitados' : `${plan.limits.products} produtos`}</span>
                  </div>
                </div>

                <ul className="plan-benefits">
                  {plan.benefits.map(benefit => (
                    <li key={benefit}>
                      <Check size={16} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="plan-support">
                  {plan.boost_results && <span><Bolt size={14} /> Impulsionamento de resultados</span>}
                  {plan.relevance_priority && <span><Sparkles size={14} /> Mais relevância nos resultados</span>}
                  {plan.priority_verification && <span><ShieldCheck size={14} /> Prioridade na verificação</span>}
                </div>

                <Button
                  variant={isPremium ? 'primary' : 'secondary'}
                  fullWidth
                  loading={checkoutLoadingId === plan.id}
                  disabled={isCurrent || checkoutLoadingId === plan.id}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isCurrent ? 'Plano ativo' : isPremium ? 'Assinar Premium' : isFree ? 'Continuar no Gratis' : 'Assinar Basico'}
                </Button>
              </article>
            )
          })}
        </section>

        <section id="comparison" className="comparison-section">
          <div className="comparison-header">
            <span className="eyebrow">Comparativo rápido</span>
            <h2>O que muda de um plano para o outro</h2>
          </div>

          <div className="comparison-grid">
            <div className="comparison-row comparison-row-head">
              <span>Recurso</span>
              <span>Gratis</span>
              <span>Básico</span>
              <span>Premium</span>
            </div>
            <div className="comparison-row">
              <span>Pontos de venda</span>
              <span>{freePlan?.limits.locations ?? 0}</span>
              <span>{basicPlan?.limits.locations ?? 0}</span>
              <span>Ilimitado</span>
            </div>
            <div className="comparison-row">
              <span>Produtos</span>
              <span>{freePlan?.limits.products ?? 0}</span>
              <span>{basicPlan?.limits.products ?? 0}</span>
              <span>Ilimitado</span>
            </div>
            <div className="comparison-row">
              <span>Impulsionamento</span>
              <span>Nao</span>
              <span>Não</span>
              <span>Sim</span>
            </div>
            <div className="comparison-row">
              <span>Relevância nos resultados</span>
              <span>Normal</span>
              <span>Normal</span>
              <span>Prioritária</span>
            </div>
            <div className="comparison-row">
              <span>Verificação da empresa</span>
              <span>Fila padrão</span>
              <span>Preferencial</span>
              <span>Prioridade</span>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default PlanosPage
