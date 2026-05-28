import React from 'react'
import Layout from '../../components/Layout'
import './LegalPages.css'

const TermosUsoPage: React.FC = () => {
  return (
    <Layout>
      <main className="legal-page">
        <header className="legal-hero">
          <h1>Termos de uso</h1>
          <p>
            Estes termos descrevem regras básicas para uso do Ache Seu Orgânico por consumidores,
            produtores e visitantes.
          </p>
        </header>

        <article className="legal-content">
          <section className="legal-section">
            <h2>Uso da plataforma</h2>
            <p>
              O usuário deve utilizar a plataforma de forma responsável, fornecendo informações
              verdadeiras e respeitando outros usuários, produtores e consumidores.
            </p>
          </section>

          <section className="legal-section">
            <h2>Cadastro e acesso</h2>
            <p>
              O usuário é responsável por manter suas credenciais em segurança. Contas podem ser
              usadas para buscar locais, favoritar feiras, enviar mensagens e, no caso de
              produtores, cadastrar pontos de venda e produtos.
            </p>
          </section>

          <section className="legal-section">
            <h2>Conteúdo cadastrado</h2>
            <p>
              Produtores são responsáveis pelas informações, imagens, contatos, endereços e
              produtos cadastrados. Conteúdos incorretos, ofensivos ou inadequados poderão ser
              removidos.
            </p>
          </section>

          <section className="legal-section">
            <h2>Limitações</h2>
            <p>
              O Ache Seu Orgânico atua como ferramenta de divulgação e conexão. A plataforma não
              substitui verificações comerciais, sanitárias, certificações oficiais ou acordos
              realizados diretamente entre usuários.
            </p>
          </section>
        </article>
      </main>
    </Layout>
  )
}

export default TermosUsoPage
