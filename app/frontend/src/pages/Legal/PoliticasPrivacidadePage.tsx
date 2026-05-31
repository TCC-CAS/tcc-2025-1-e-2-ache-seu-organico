import React from 'react'
import Layout from '../../components/Layout'
import './LegalPages.css'

const PoliticasPrivacidadePage: React.FC = () => {
  return (
    <Layout>
      <main className="legal-page">
        <header className="legal-hero">
          <h1>Políticas de privacidade</h1>
          <p>
            Esta página resume como o Ache Seu Orgânico trata informações de usuários,
            produtores e visitantes da plataforma.
          </p>
        </header>

        <article className="legal-content">
          <section className="legal-section">
            <h2>Dados coletados</h2>
            <p>
              Podemos coletar dados fornecidos no cadastro, como nome, email, telefone, tipo de
              usuário e informações de perfil. Produtores também podem informar dados de pontos
              de venda, produtos, imagens e canais de contato.
            </p>
          </section>

          <section className="legal-section">
            <h2>Uso das informações</h2>
            <p>
              As informações são utilizadas para autenticação, exibição de feiras e produtores,
              comunicação entre usuários, favoritos, notificações e melhoria da experiência na
              plataforma.
            </p>
          </section>

          <section className="legal-section">
            <h2>Compartilhamento</h2>
            <p>
              Informações públicas de produtores e localizações podem ser exibidas para usuários
              da plataforma. Dados de acesso e informações sensíveis não devem ser vendidos ou
              compartilhados fora das finalidades do projeto.
            </p>
          </section>

          <section className="legal-section">
            <h2>Controle do usuário</h2>
            <p>
              O usuário pode atualizar seus dados de perfil e gerenciar informações cadastradas.
              Ajustes adicionais de privacidade podem ser incorporados conforme a evolução do
              projeto.
            </p>
          </section>
        </article>
      </main>
    </Layout>
  )
}

export default PoliticasPrivacidadePage
