'use client';

import { AtlasOrb, AtlasLogo } from './atlas-orb';
import AtlasCustomizer from './atlas-customizer';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  FileText,
  Fingerprint,
  Layers,
  Menu,
  MessageCircle,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Landing() {
  return (
    <div className="atlas-landing">
      <a href="#conteudo" className="skip-link">
        Ir ao conteúdo
      </a>

      <header className="landing-header landing-container">
        <Link href="/" aria-label="Atlas, início">
          <AtlasLogo />
        </Link>
        <button
          type="button"
          className="landing-menu-toggle"
          aria-expanded={false}
          aria-controls="landing-nav"
          aria-label="Abrir menu"
        >
          <Menu />
        </button>
        <nav
          id="landing-nav"
          className="landing-navigation"
          aria-label="Navegação principal"
        >
          <a href="#produto">Produto</a>
          <a href="#metodos">Métodos</a>
          <a href="#agentes">Agentes</a>
          <a href="#seu-atlas">Seu Atlas</a>
          <a href="#perguntas">Perguntas</a>
        </nav>
        <div className="landing-header-actions">
          <a className="landing-login" href="#seu-atlas">
            Personalizar Atlas
          </a>
          <a className="landing-button landing-button-primary" href="#seu-atlas">
            Começar
            <ArrowRight size={17} />
          </a>
        </div>
      </header>

      <main id="conteudo">
        <section className="landing-hero landing-container" aria-labelledby="hero-title">
          <div className="hero-art" aria-hidden="true">
            <Image
              src="/images/atlas-world.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 600px) 620px, (max-width: 1100px) 1000px, 1150px"
            />
            <span className="hero-art-shade" />
          </div>

          <div className="hero-rail" aria-hidden="true">
            <span className="hero-rail-line" />
            <span>Explore</span>
            <span>Pense</span>
            <span>Aprenda</span>
            <span>Evolua</span>
          </div>

          <div className="hero-orbits" aria-hidden="true">
            <span className="hero-orbits-ring ring-one" />
            <span className="hero-orbits-ring ring-two" />
            <span className="hero-orbits-ring ring-three" />
            <span className="hero-orbits-core" />
          </div>

          <div className="hero-copy">
            <div className="hero-kicker">
              <span />
              Agentes para a sua aprendizagem
            </div>
            <h1 id="hero-title">Explore, pense,<br />aprenda, <em>evolua.</em></h1>
            <p>O conhecimento abre mundos.<br />Encontre o seu jeito de explorá-los.</p>
            <p className="hero-description">
              Transforme suas fontes em conversas, descobertas e prática. Com diferentes perspectivas e um Atlas que tem a ver com você.
            </p>
            <div className="hero-actions">
              <a className="landing-button landing-button-primary" href="#seu-atlas">
                Crie seu Atlas
                <ArrowRight size={17} />
              </a>
              <a className="landing-button landing-button-secondary" href="#como-funciona">
                <Play size={13} />
                Conheça a experiência
              </a>
              <Link href="/workspace" className="landing-button landing-button-secondary">
                <Play size={13} />
                Entrar no sistema
              </Link>
            </div>
            <span className="hero-note">
              <span className="tiny-orbit" />
              Você traz a curiosidade. A gente começa por ela.
            </span>
          </div>

          <div className="hero-coordinate coordinate-one">
            <span />
            Conecta
          </div>
          <div className="hero-coordinate coordinate-two">
            <span />
            Questiona
          </div>
          <div className="hero-coordinate coordinate-three">
            <span />
            Transforma
          </div>

          <div className="hero-features">
            <div>
              <BookOpen />
              <strong>Métodos que fazem pensar</strong>
              <span>Da pergunta à compreensão.</span>
            </div>
            <div>
              <Network />
              <strong>Perspectivas que se encontram</strong>
              <span>Uma equipe para explorar com você.</span>
            </div>
            <div>
              <Fingerprint />
              <strong>Um caminho com a sua cara</strong>
              <span>Seu objetivo. Seu ritmo.</span>
            </div>
          </div>
        </section>

        <section id="produto" className="product-section landing-container" aria-labelledby="product-title">
          <div className="section-intro">
            <div>
              <span className="landing-eyebrow">Um espaço para descobrir</span>
              <h2 id="product-title">Menos abas abertas.<br />Mais ideias conectadas.</h2>
            </div>
            <p>Seu material de estudo vira ponto de partida. Pergunte, veja a fonte e experimente outro jeito de entender, tudo no mesmo lugar.</p>
          </div>
          <div className="studio-preview" id="como-funciona">
            <aside className="preview-sidebar">
              <AtlasLogo />
              <span className="preview-nav active">
                <Layers />
                Meu estúdio
              </span>
              <span className="preview-nav">
                <MessageCircle />
                Meus agentes
              </span>
              <span className="preview-nav">
                <BookOpen />
                Biblioteca
              </span>
              <span className="preview-nav">
                <BrainCircuit />
                Memória
              </span>
              <div className="preview-sidebar-footer">
                <ShieldCheck />
                Seu ritmo, sempre.
              </div>
            </aside>
            <div className="preview-workspace">
              <div className="preview-workspace-top">
                <span>Seu espaço de aprendizagem</span>
                <span className="preview-indicator">
                  <span />
                  Uma prévia do estúdio
                </span>
              </div>
              <h3>
                Por onde sua curiosidade
                <br />
                vai levar você hoje?
              </h3>
              <div className="preview-question">
                <MessageCircle />
                <span>Quero entender, não só decorar…</span>
                <ArrowRight />
              </div>
              <div className="preview-agents">
                <div>
                  <AtlasOrb color="#ff704f" />
                  <strong>Nilo</strong>
                  <span>Uma ideia de cada vez</span>
                </div>
                <div>
                  <AtlasOrb color="#a89bff" />
                  <strong>Lumi</strong>
                  <span>Curiosidade que conecta</span>
                </div>
                <div>
                  <AtlasOrb color="#e5c597" />
                  <strong>Prisma</strong>
                  <span>Um olhar mais atento</span>
                </div>
                <div>
                  <AtlasOrb color="#55dce8" />
                  <strong>Fio</strong>
                  <span>Aprender fazendo</span>
                </div>
              </div>
              <div className="preview-source">
                <FileText />
                <span>
                  Suas fontes, novas possibilidades
                  <small>Documentos · perguntas · descobertas</small>
                </span>
                <BookOpen />
              </div>
            </div>
            <div className="preview-context">
              <span className="landing-eyebrow">Uma fonte. Muitos caminhos.</span>
              <ol>
                <li>
                  <span>1</span>
                  <div>
                    Traga seu material
                    <p>Adicione um PDF, Markdown ou texto.</p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    Comece com uma pergunta
                    <p>Conte o que você quer compreender.</p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    Descubra e pratique
                    <p>Explore explicações, quiz e flashcards.</p>
                  </div>
                </li>
              </ol>
              <a className="preview-open" href="#seu-atlas">
                Explorar o estúdio
                <ArrowRight />
              </a>
            </div>
          </div>
          <p className="preview-disclaimer">
            Prévia ilustrativa. No estúdio, você estuda com suas próprias fontes e acompanha as capacidades disponíveis.
          </p>
        </section>

        <section className="methods-section landing-container" id="metodos" aria-labelledby="methods-title">
          <div className="section-intro">
            <div>
              <span className="landing-eyebrow">Aprender tem mais de um caminho</span>
              <h2 id="methods-title">Grandes métodos.<br />A sua maneira.</h2>
            </div>
            <p>Às vezes, falta uma boa pergunta. Outras vezes, um exemplo simples. Explore métodos diferentes sem precisar saber qual escolher antes de começar.</p>
          </div>
          <div className="method-columns">
            <article>
              <span className="method-glyph">?</span>
              <span className="method-name">Socrático</span>
              <h3>Uma pergunta abre<br />a próxima porta.</h3>
              <p>Investigue o que você já sabe e encontre espaço para uma ideia nova.</p>
            </article>
            <article>
              <span className="method-glyph glyph-feynman">Aa</span>
              <span className="method-name">Feynman</span>
              <h3>Entender para explicar.<br />Explicar para entender.</h3>
              <p>Troque a complexidade por palavras simples, exemplos e compreensão.</p>
            </article>
            <article>
              <span className="method-glyph glyph-warburg">
                <Network />
              </span>
              <span className="method-name">Warburg</span>
              <h3>As ideias crescem<br />quando se encontram.</h3>
              <p>Encontre relações entre referências e explore novas formas de olhar.</p>
            </article>
          </div>
        </section>

        <section className="perspectives-section" id="agentes" aria-labelledby="agents-title">
          <div className="landing-container">
            <div className="center-intro">
              <span className="landing-eyebrow">Companhia para a sua curiosidade</span>
              <h2 id="agents-title">Cinco perspectivas.<br />Um universo para explorar.</h2>
              <p>Cada agente tem um jeito de acompanhar você. Troque de perspectiva quando quiser, sem abandonar suas fontes.</p>
            </div>
            <div className="perspective-list">
              <article>
                <AtlasOrb color="#ff704f" />
                <h3>Nilo</h3>
                <span>Uma ideia de cada vez</span>
                <p>Paciência para explicar. Espaço para perguntar de novo.</p>
              </article>
              <article>
                <AtlasOrb color="#a89bff" />
                <h3>Lumi</h3>
                <span>Curiosidade que conecta</span>
                <p>Novas conexões para enxergar além do primeiro exemplo.</p>
              </article>
              <article>
                <AtlasOrb color="#e5c597" />
                <h3>Prisma</h3>
                <span>Um olhar mais atento</span>
                <p>Perguntas sobre as evidências e os limites de cada resposta.</p>
              </article>
              <article>
                <AtlasOrb color="#55dce8" />
                <h3>Fio</h3>
                <span>Aprender fazendo</span>
                <p>Ideias ganham forma em materiais para estudar e praticar.</p>
              </article>
              <article>
                <AtlasOrb color="#8fddb5" />
                <h3>Soma</h3>
                <span>Continuidade, sem pressão</span>
                <p>Um passo possível hoje. Um novo começo quando precisar.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="create-section landing-container" id="seu-atlas" aria-labelledby="create-title">
          <div className="section-intro">
            <div>
              <span className="landing-eyebrow">Crie seu próprio Atlas</span>
              <h2 id="create-title">O próximo encontro<br />é com o <em>seu Atlas.</em></h2>
            </div>
            <p>Um nome que você gosta. Uma cor que combina com você. Uma perspectiva para começar. O resto a gente descobre pelo caminho.</p>
          </div>
          <AtlasCustomizer destination="/workspace" />
        </section>

        <section className="landing-faq landing-container" id="perguntas" aria-labelledby="faq-title">
          <div>
            <span className="landing-eyebrow">Antes de começar</span>
            <h2 id="faq-title">Curiosidade<br />é bem-vinda.</h2>
            <p>Inclusive sobre o próprio Atlas.</p>
          </div>
          <div className="faq-items">
            <details>
              <summary>
                Preciso entender de inteligência artificial?
                <span>+</span>
              </summary>
              <p>Não. Comece adicionando uma fonte e escrevendo o que quer entender. Você pode deixar o método em escolha automática e ajustar quando quiser.</p>
            </details>
            <details>
              <summary>
                O que muda quando crio meu Atlas?
                <span>+</span>
              </summary>
              <p>Você dá um nome e uma cor a um dos cinco tutores. Essa identidade aparece no estúdio e nas conversas deste navegador. As perspectivas dos outros agentes e os métodos de estudo continuam disponíveis.</p>
            </details>
            <details>
              <summary>
                Meu Atlas vai lembrar de mim?
                <span>+</span>
              </summary>
              <p>Somente se você ativar a memória de aprendizagem no estúdio. O Dreamer usa experiências consentidas para avaliar melhorias pedagógicas. Você pode consultar esse histórico, desativar a memória e apagar suas experiências.</p>
            </details>
            <details>
              <summary>
                Posso conferir de onde veio uma resposta?
                <span>+</span>
              </summary>
              <p>Os materiais de estudo trazem referências que você pode abrir na fonte. Sem um modelo remoto configurado, o estúdio identifica o modo local e apresenta trechos dos documentos.</p>
            </details>
            <details>
              <summary>
                Já posso usar com a minha turma?
                <span>+</span>
              </summary>
              <p>Esta versão é um workspace local em desenvolvimento. Você pode experimentar os grupos locais; contas, autenticação e acesso público para uma turma ainda precisam ser concluídos antes de uma publicação.</p>
            </details>
          </div>
        </section>

        <section className="landing-closing landing-container">
          <Sparkles size={22} />
          <h2>O mundo é grande.<br />Sua curiosidade também.</h2>
          <Link href="#seu-atlas" className="landing-button landing-button-primary">
            Vamos explorar?
            <ArrowRight size={17} />
          </Link>
          <p>Comece com uma pergunta.</p>
        </section>
      </main>

      <footer className="landing-footer landing-container">
        <Link href="/" aria-label="Atlas, início">
          <AtlasLogo />
        </Link>
        <span>NovaMente · Agentes para a educação</span>
        <div>
          <a href="#seu-atlas">Crie seu Atlas</a>
          <a href="#seu-atlas">
            Personalizar Atlas
            <ArrowRight size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}
