import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, BadgeCheck, Bolt, CalendarDays, Crown, Info,
  Package, ShieldCheck, Sparkles, Star, Store, Check, UserRound,
} from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { billingService } from '../../api/billing'
import type { BillingSubscription, SubscriptionPlan, BillingSummaryResponse } from '../../types'
import { useToast } from '../../components/Toast'
import './PlanosPage.css'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function memberSince(iso: string | null | undefined): string {
  if (!iso) return ''
  const start = new Date(iso)
  const now = new Date()
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (months < 1) return 'menos de 1 mês'
  if (months === 1) return '1 mês'
  if (months < 12) return `${months} meses`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem === 0 ? `${years} ano${years > 1 ? 's' : ''}` : `${years} ano${years > 1 ? 's' : ''} e ${rem} ${rem === 1 ? 'mês' : 'meses'}`
}

function daysUntil(iso: string | null | undefined): string {
  if (!iso) return 'data indisponível'

  const end = new Date(iso)
  const now = new Date()
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `expirado há ${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? '' : 's'}`
  if (diffDays === 0) return 'expira hoje'
  if (diffDays === 1) return '1 dia restante'
  return `${diffDays} dias restantes`
}

function statusLabel(status: BillingSubscription['status']): { text: string; cls: string } {
  switch (status) {
    case 'ACTIVE':    return { text: 'Ativa', cls: 'status-active' }
    case 'PENDING':   return { text: 'Aguardando pagamento', cls: 'status-pending' }
    case 'PAST_DUE':  return { text: 'Pagamento em atraso', cls: 'status-due' }
    case 'CANCELED':  return { text: 'Cancelada', cls: 'status-canceled' }
    default:          return { text: status, cls: '' }
  }
}

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
  const isConsumer = user?.user_type === 'CONSUMER'
  const isProducer = user?.user_type === 'PRODUCER'
  const hasActivePlan = isProducer && activePlanCode !== null

  const freePlan = useMemo(() => plans.find(plan => plan.code === 'FREE'), [plans])
  const basicPlan = useMemo(() => plans.find(plan => plan.code === 'BASIC'), [plans])
  const activePlanData = useMemo(() => plans.find(p => p.code === activePlanCode), [plans, activePlanCode])

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      window.location.href = '/register'
      return
    }

    if (isConsumer) {
      toast.error('Planos são exclusivos para produtores. Converta seu perfil para ter acesso.')
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

  // ── Consumidores: informativo sem acesso a planos ─────────────────────────
  if (isConsumer) {
    return (
      <Layout user={user}>
        <div className="plans-page">
          <div className="consumer-block">
            <div className="consumer-block-icon">
              <UserRound size={40} />
            </div>
            <div className="consumer-block-body">
              <h2>Planos exclusivos para produtores</h2>
              <p>
                Sua conta é do tipo <strong>consumidor</strong>. Os planos de assinatura são destinados
                a produtores que divulgam seus produtos e feiras na plataforma.
              </p>
              <p>
                Se você é um produtor orgânico e quer criar seu perfil, converta sua conta para
                produtor e tenha acesso a todos os planos disponíveis.
              </p>
              <div className="consumer-block-actions">
                <Button variant="primary" onClick={() => window.location.href = '/perfil'}>
                  Ir para meu perfil
                </Button>
              </div>
            </div>
            <div className="consumer-block-callout">
              <Info size={18} />
              <span>A conversão de perfil estará disponível em breve.</span>
            </div>
          </div>

          {/* Mostra os planos em modo somente leitura, sem CTAs habilitados */}
          <section id="pricing-cards" className="pricing-cards pricing-cards--readonly">
            {plans.map(plan => {
              const isPremium = plan.code === 'PREMIUM'
              const isFree = plan.code === 'FREE'
              return (
                <article key={plan.id} className={`plan-card ${isPremium ? 'featured' : ''}`}>
                  <div className="plan-badge-row">
                    <span className="plan-badge">{isPremium ? 'Recomendado' : isFree ? 'Plano inicial' : 'Primeiras feiras'}</span>
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
                    <span>{plan.monthly_price === '0.00' ? 'para sempre' : plan.billing_cycle_months === 12 ? '/mês · anual' : '/mês'}</span>
                  </div>
                  <div className="plan-limits">
                    <div><Sparkles size={16} /><span>{plan.limits.locations === null ? 'Feiras ilimitadas' : `${plan.limits.locations} feiras`}</span></div>
                    <div><Package size={16} /><span>{plan.limits.products === null ? 'Produtos ilimitados' : `${plan.limits.products} produtos`}</span></div>
                  </div>
                  <Button variant="secondary" fullWidth disabled>Disponível para produtores</Button>
                </article>
              )
            })}
          </section>
        </div>
      </Layout>
    )
  }

  // ── Produtor com plano ativo: painel gerencial ────────────────────────────
  const subscription = billing?.subscription
  const planDetails = activePlanData || billing?.summary?.plan
  const planCycleMonths = activePlanData?.billing_cycle_months ?? 1
  const isAnnualPlan = planCycleMonths === 12
  const planExpiresAt = subscription?.current_period_end
  const isSubscriptionExpired = Boolean(planExpiresAt && new Date(planExpiresAt).getTime() < Date.now())
  const expirationSummary = subscription?.status === 'CANCELED'
    ? 'Plano cancelado'
    : planExpiresAt
      ? formatDate(planExpiresAt)
      : 'data indisponível'

  return (
    <Layout user={user}>
      <div className="plans-page">

        {hasActivePlan && planDetails && (
          <section className="my-plan-banner">
            <div className="my-plan-header">
              <div className="my-plan-icon">
                {activePlanCode === 'PREMIUM' ? <Crown size={32} /> : activePlanCode === 'FREE' ? <Store size={32} /> : <BadgeCheck size={32} />}
              </div>
              <div className="my-plan-title">
                <span className="eyebrow">Meu plano</span>
                <h2>{planDetails.name}</h2>
                {subscription && (
                  <span className={`plan-status-badge ${statusLabel(subscription.status).cls}`}>
                    {statusLabel(subscription.status).text}
                  </span>
                )}
                <div className="my-plan-meta">
                  <span className="my-plan-meta-pill">{isAnnualPlan ? 'Cobrança anual' : 'Cobrança mensal'}</span>
                  <span className="my-plan-meta-pill">Plano {planDetails.code}</span>
                  {subscription?.current_period_end && (
                    <span className="my-plan-meta-pill my-plan-meta-pill--accent">{daysUntil(subscription.current_period_end)}</span>
                  )}
                </div>
              </div>
              {activePlanCode !== 'PREMIUM' && (
                <div className="my-plan-upgrade-cta">
                  <Button variant="primary" onClick={() => document.getElementById('pricing-cards')?.scrollIntoView({ behavior: 'smooth' })}>
                    Fazer upgrade <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </div>

            <div className="my-plan-details">
              <div className="my-plan-stat">
                <CalendarDays size={18} />
                <div>
                  <strong>Membro desde</strong>
                  <span>{formatDate(subscription?.starts_at)}</span>
                  {subscription?.starts_at && (
                    <small>{memberSince(subscription.starts_at)}</small>
                  )}
                </div>
              </div>

              {subscription?.current_period_start && (
                <div className="my-plan-stat">
                  <Star size={18} />
                  <div>
                    <strong>Período contratado</strong>
                    <span>{formatDate(subscription.current_period_start)}</span>
                    {subscription.current_period_end && (
                      <small>expira em {formatDate(subscription.current_period_end)}</small>
                    )}
                  </div>
                </div>
              )}

              <div className="my-plan-stat">
                <ShieldCheck size={18} />
                <div>
                  <strong>Status técnico</strong>
                  <span>{subscription ? statusLabel(subscription.status).text : 'Sem assinatura'}</span>
                  <small>{isSubscriptionExpired ? 'Recursos limitados até o pagamento' : 'Recursos liberados enquanto vigente'}</small>
                </div>
              </div>

              <div className="my-plan-stat">
                <CalendarDays size={18} />
                <div>
                  <strong>Validade</strong>
                  <span>{expirationSummary}</span>
                  <small>{subscription?.current_period_end ? daysUntil(subscription.current_period_end) : 'Sem data de expiração'}</small>
                </div>
              </div>

              <div className="my-plan-stat">
                <Sparkles size={18} />
                <div>
                  <strong>Pontos de venda</strong>
                  <span>
                    {planDetails.limits.locations === null ? 'Ilimitado' : `até ${planDetails.limits.locations}`}
                  </span>
                </div>
              </div>

              <div className="my-plan-stat">
                <Package size={18} />
                <div>
                  <strong>Produtos</strong>
                  <span>
                    {planDetails.limits.products === null ? 'Ilimitado' : `até ${planDetails.limits.products}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="my-plan-warning">
              <Info size={16} />
              <span>
                Quando a validade terminar, as feiras acima do limite do plano ficam suspensas.
                O acesso volta após a confirmação do pagamento.
              </span>
            </div>

            {(planDetails.boost_results || planDetails.relevance_priority || planDetails.priority_verification) && (
              <div className="my-plan-perks">
                {planDetails.boost_results && <span><Bolt size={14} /> Impulsionamento de resultados</span>}
                {planDetails.relevance_priority && <span><Sparkles size={14} /> Relevância prioritária</span>}
                {planDetails.priority_verification && <span><ShieldCheck size={14} /> Verificação preferencial</span>}
              </div>
            )}
          </section>
        )}

        {/* Hero (somente quando não há plano ativo) */}
        {!hasActivePlan && (
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
                <strong>Encontre o plano certo para você</strong>
                <p>Comece gratuitamente e evolua conforme sua operação crescer.</p>
              </div>
              <div className="hero-stats">
                <div>
                  <span>∞</span>
                  <small>Feiras Premium</small>
                </div>
                <div>
                  <span>∞</span>
                  <small>Produtos Premium</small>
                </div>
                <div>
                  <span>{freePlan?.formatted_price || 'Grátis'}</span>
                  <small>Plano inicial</small>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Título da seção de planos quando há plano ativo */}
        {hasActivePlan && (
          <div className="plans-section-header">
            <h3>Todos os planos</h3>
            <p>Compare e altere seu plano quando quiser.</p>
          </div>
        )}

        <section id="pricing-cards" className="pricing-cards">
          {plans.map(plan => {
            const isCurrent = activePlanCode === plan.code
            const isAnnual = plan.billing_cycle_months === 12
            const totalPrice = isAnnual
              ? `R$ ${(parseFloat(plan.monthly_price) * 12).toFixed(2).replace('.', ',')}`
              : null
            const isPremium = plan.code === 'PREMIUM'
            const isFree = plan.code === 'FREE'

            return (
              <article key={plan.id} className={`plan-card ${isPremium ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="plan-badge-row">
                  <span className="plan-badge">{isPremium ? 'Recomendado' : isFree ? 'Plano inicial' : 'Primeiras feiras'}</span>
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
                  {isAnnual ? (
                    <>
                      <strong>{plan.formatted_price}</strong>
                      <span>/mês</span>
                      <small className="plan-price-total">cobrado {totalPrice}/ano</small>
                    </>
                  ) : (
                    <>
                      <strong>{plan.formatted_price}</strong>
                      <span>{plan.monthly_price === '0.00' ? 'para sempre' : '/mês'}</span>
                    </>
                  )}
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
                  {isCurrent ? 'Plano ativo' : isPremium ? 'Assinar Premium' : isFree ? 'Continuar no Grátis' : 'Assinar Básico'}
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
              <span>Grátis</span>
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
              <span>Não</span>
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
