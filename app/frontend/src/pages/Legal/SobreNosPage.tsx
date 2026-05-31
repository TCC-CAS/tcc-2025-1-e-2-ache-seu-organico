import React from 'react'
import Layout from '../../components/Layout'
import './LegalPages.css'

const SobreNosPage: React.FC = () => {
  return (
    <Layout>
      <main className="legal-page">
        <header className="legal-hero">
          <h1>Sobre nós</h1>
          <p>
            O Ache Seu Orgânico nasceu como um projeto acadêmico para aproximar consumidores
            de produtores, feiras e pontos de venda de alimentos orgânicos.
          </p>
        </header>

        <article className="legal-content">
          <section className="legal-section">
            <h2>O projeto</h2>
            <p>
              A plataforma reúne localizações, produtos e informações de contato para facilitar
              a descoberta de alimentos orgânicos próximos ao consumidor. A ideia é reduzir a
              distância entre quem produz e quem busca uma alimentação mais consciente.
            </p>
          </section>

          <section className="legal-section">
            <h2>Para consumidores</h2>
            <p>
              Consumidores podem buscar feiras e produtores por localização, tipo de ponto de
              venda e produtos disponíveis, além de favoritar locais e iniciar conversas.
            </p>
          </section>

          <section className="legal-section">
            <h2>Para produtores</h2>
            <p>
              Produtores podem cadastrar seus pontos de venda, divulgar produtos e manter suas
              informações atualizadas para alcançar pessoas interessadas em orgânicos.
            </p>
          </section>
        </article>
      </main>
    </Layout>
  )
}

export default SobreNosPage
