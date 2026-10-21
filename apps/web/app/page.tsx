import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  FileText,
  Fingerprint,
  Layers3,
  MessageCircle,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AtlasLogo, AtlasOrb } from "@/components/atlas-orb";
import AtlasCustomizer from "@/components/atlas-customizer";
import LandingNavigation from "@/components/landing-navigation";
import "./landing.css";

export const metadata: Metadata = {
  title: "Atlas — explore, pense, aprenda, evolua.",
  description:
    "Suas fontes, novas perspectivas. Um estúdio de aprendizagem com agentes educacionais e um Atlas com a sua identidade.",
};

const perspectives = [
  {
    name: "Nilo",
    role: "Uma ideia de cada vez",
    color: "#ff704f",
    text: "Paciência para explicar. Espaço para perguntar de novo.",
  },
  {
    name: "Lumi",
    role: "Curiosidade que conecta",
    color: "#a89bff",
    text: "Novas conexões para enxergar além do primeiro exemplo.",
  },
  {
    name: "Prisma",
    role: "Um olhar mais atento",
    color: "#e5c597",
    text: "Perguntas sobre as evidências e os limites de cada resposta.",
  },
  {
    name: "Fio",
    role: "Aprender fazendo",
    color: "#55dce8",
    text: "Ideias ganham forma em materiais para estudar e praticar.",
  },
  {
    name: "Soma",
    role: "Continuidade, sem pressão",
    color: "#8fddb5",
    text: "Um passo possível hoje. Um novo começo quando precisar.",
  },
];

export default function Page() {
  return (
    <div className="atlas-landing">
      <a href="#conteudo" className="skip-link">
        Ir ao conteúdo
      </a>
      <LandingNavigation />
      <main id="conteudo">
        <section
          className="landing-hero landing-container"
          aria-labelledby="hero-title"
        >
          <div className="hero-art" aria-hidden="true">
            <Image
              src="/images/atlas-world.webp"
              alt=""
              fill
              sizes="(max-width: 680px) 120vw, 1100px"
              preload
              unoptimized
            />
            <span className="hero-art-shade" />
          </div>
          <div className="hero-copy">
            <div className="hero-kicker">
              <span />
              Agentes para a sua aprendizagem
            </div>
            <h1 id="hero-title">
              Explore, pense,
              <br />
              aprenda, <em>evolua.</em>
            </h1>
            <p>
              O conhecimento abre mundos.
              <br />
              Encontre o seu jeito de explorá-los.
            </p>
            <p className="hero-description">
              Transforme suas fontes em conversas, descobertas e prática. Com
              diferentes perspectivas e um Atlas que tem a ver com você.
            </p>
            <div className="hero-actions">
              <Link
                className="landing-button landing-button-primary"
                href="#seu-atlas"
              >
                Crie seu Atlas
                <ArrowRight size={17} />
              </Link>
              <a
                className="landing-button landing-button-secondary"
                href="#como-funciona"
              >
                <Play size={13} fill="currentColor" />
                Conheça a experiência
              </a>
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

        <section
          id="produto"
          className="product-section landing-container"
          aria-labelledby="product-title"
        >
          <div className="section-intro">
            <div>
              <span className="landing-eyebrow">Um espaço para descobrir</span>
              <h2 id="product-title">
                Menos abas abertas.
                <br />
                Mais ideias conectadas.
              </h2>
            </div>
            <p>
              Seu material de estudo vira ponto de partida. Pergunte, veja a
              fonte e experimente outro jeito de entender, tudo no mesmo lugar.
            </p>
          </div>
          <div className="studio-preview" id="como-funciona">
            <aside className="preview-sidebar">
              <AtlasLogo />
              <span className="preview-nav active">
                <Layers3 size={14} />
                Meu estúdio
              </span>
              <span className="preview-nav">
                <MessageCircle size={14} />
                Meus agentes
              </span>
              <span className="preview-nav">
                <BookOpen size={14} />
                Biblioteca
              </span>
              <span className="preview-nav">
                <BrainCircuit size={14} />
                Memória
              </span>
              <div className="preview-sidebar-footer">
                <ShieldCheck size={14} />
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
                <MessageCircle size={16} />
                <span>Quero entender, não só decorar…</span>
                <ArrowRight size={16} />
              </div>
              <div className="preview-agents">
                {perspectives.slice(0, 4).map((p) => (
                  <div key={p.name}>
                    <AtlasOrb color={p.color} />
                    <strong>{p.name}</strong>
                    <span>{p.role}</span>
                  </div>
                ))}
              </div>
              <div className="preview-source">
                <FileText size={18} />
                <span>
                  Suas fontes, novas possibilidades
                  <small>Documentos · perguntas · descobertas</small>
                </span>
                <BookOpen size={16} />
              </div>
            </div>
            <div className="preview-context">
              <span className="landing-eyebrow">
                Uma fonte. Muitos caminhos.
              </span>
              <ol>
                <li>
                  <span>1</span>
                  <div>
                    Traga seu material<p>Adicione um PDF, Markdown ou texto.</p>
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
              <Link href="/studio" className="preview-open">
                Explorar o estúdio
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <p className="preview-disclaimer">
            Prévia ilustrativa. No estúdio, você estuda com suas próprias fontes
            e acompanha as capacidades disponíveis.
          </p>
        </section>

        <section
          className="methods-section landing-container"
          id="metodos"
          aria-labelledby="methods-title"
        >
          <div className="section-intro">
            <div>
              <span className="landing-eyebrow">
                Aprender tem mais de um caminho
              </span>
              <h2 id="methods-title">
                Grandes métodos.
                <br />A sua maneira.
              </h2>
            </div>
            <p>
              Às vezes, falta uma boa pergunta. Outras vezes, um exemplo
              simples. Explore métodos diferentes sem precisar saber qual
              escolher antes de começar.
            </p>
          </div>
          <div className="method-columns">
            <article>
              <span className="method-glyph">?</span>
              <span className="method-name">Socrático</span>
              <h3>
                Uma pergunta abre
                <br />a próxima porta.
              </h3>
              <p>
                Investigue o que você já sabe e encontre espaço para uma ideia
                nova.
              </p>
            </article>
            <article>
              <span className="method-glyph glyph-feynman">Aa</span>
              <span className="method-name">Feynman</span>
              <h3>
                Entender para explicar.
                <br />
                Explicar para entender.
              </h3>
              <p>
                Troque a complexidade por palavras simples, exemplos e
                compreensão.
              </p>
            </article>
            <article>
              <span className="method-glyph glyph-warburg">
                <Network strokeWidth={1} />
              </span>
              <span className="method-name">Warburg</span>
              <h3>
                As ideias crescem
                <br />
                quando se encontram.
              </h3>
              <p>
                Encontre relações entre referências e explore novas formas de
                olhar.
              </p>
            </article>
          </div>
        </section>

        <section
          className="perspectives-section"
          id="agentes"
          aria-labelledby="agents-title"
        >
          <div className="landing-container">
            <div className="center-intro">
              <span className="landing-eyebrow">
                Companhia para a sua curiosidade
              </span>
              <h2 id="agents-title">
                Cinco perspectivas.
                <br />
                Um universo para explorar.
              </h2>
              <p>
                Cada agente tem um jeito de acompanhar você. Troque de
                perspectiva quando quiser, sem abandonar suas fontes.
              </p>
            </div>
            <div className="perspective-list">
              {perspectives.map((p) => (
                <article key={p.name}>
                  <AtlasOrb color={p.color} />
                  <h3>{p.name}</h3>
                  <span>{p.role}</span>
                  <p>{p.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="create-section landing-container"
          id="seu-atlas"
          aria-labelledby="create-title"
        >
          <div className="section-intro">
            <div>
              <span className="landing-eyebrow">Crie seu próprio Atlas</span>
              <h2 id="create-title">
                O próximo encontro
                <br />é com o <em>seu Atlas.</em>
              </h2>
            </div>
            <p>
              Um nome que você gosta. Uma cor que combina com você. Uma
              perspectiva para começar. O resto a gente descobre pelo caminho.
            </p>
          </div>
          <AtlasCustomizer />
        </section>

        <section
          className="landing-faq landing-container"
          id="perguntas"
          aria-labelledby="faq-title"
        >
          <div>
            <span className="landing-eyebrow">Antes de começar</span>
            <h2 id="faq-title">
              Curiosidade
              <br />é bem-vinda.
            </h2>
            <p>Inclusive sobre o próprio Atlas.</p>
          </div>
          <div className="faq-items">
            <details>
              <summary>
                Preciso entender de inteligência artificial?<span>+</span>
              </summary>
              <p>
                Não. Comece adicionando uma fonte e escrevendo o que quer
                entender. Você pode deixar o método em escolha automática e
                ajustar quando quiser.
              </p>
            </details>
            <details>
              <summary>
                O que muda quando crio meu Atlas?<span>+</span>
              </summary>
              <p>
                Você dá um nome e uma cor a um dos cinco tutores. Essa
                identidade aparece no estúdio e nas conversas deste navegador.
                As perspectivas dos outros agentes e os métodos de estudo
                continuam disponíveis.
              </p>
            </details>
            <details>
              <summary>
                Meu Atlas vai lembrar de mim?<span>+</span>
              </summary>
              <p>
                Somente se você ativar a memória de aprendizagem no estúdio. O
                Dreamer usa experiências consentidas para avaliar melhorias
                pedagógicas. Você pode consultar esse histórico, desativar a
                memória e apagar suas experiências.
              </p>
            </details>
            <details>
              <summary>
                Posso conferir de onde veio uma resposta?<span>+</span>
              </summary>
              <p>
                Os materiais de estudo trazem referências que você pode abrir na
                fonte. Sem um modelo remoto configurado, o estúdio identifica o
                modo local e apresenta trechos dos documentos.
              </p>
            </details>
            <details>
              <summary>
                Já posso usar com a minha turma?<span>+</span>
              </summary>
              <p>
                Esta versão é um workspace local em desenvolvimento. Você pode
                experimentar os grupos locais; contas, autenticação e acesso
                público para uma turma ainda precisam ser concluídos antes de
                uma publicação.
              </p>
            </details>
          </div>
        </section>

        <section className="landing-closing landing-container">
          <Sparkles size={22} strokeWidth={1} />
          <h2>
            O mundo é grande.
            <br />
            Sua curiosidade também.
          </h2>
          <Link
            className="landing-button landing-button-primary"
            href="#seu-atlas"
          >
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
          <Link href="/studio">
            Abrir estúdio
            <ArrowRight size={14} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
