'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AtlasCustomizer from './atlas-customizer';
import {
  ArrowRight,
  Play,
  User,
  ShieldCheck,
  Zap,
  UserCheck,
  Lock,
  Search,
  Target,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Send,
  Sparkles,
  ExternalLink,
  BookOpen,
  FileText,
  Star,
  Check,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle
} from 'lucide-react';

/* ============================================================================
   DATA CONSTANTS & PERSONAS
   ============================================================================ */

const AGENTS = [
  {
    id: 'nilo',
    name: 'Guia',
    role: 'Tutor',
    description: 'Explica conceitos, esclarece dúvidas e orienta o seu estudo.',
    color: '#ff7043',
    avatar: '/brand/agent-nilo.png',
  },
  {
    id: 'lumi',
    name: 'Faísca',
    role: 'Exploradora',
    description: 'Encontra informações relevantes e conecta ideias.',
    color: '#85e7b8',
    avatar: '/brand/agent-lumi.png',
  },
  {
    id: 'prisma',
    name: 'Prisma',
    role: 'Revisor',
    description: 'Analisa, resume e ajuda a organizar o que aprendeu.',
    color: '#ffb74d',
    avatar: '/brand/agent-prisma.png',
  },
  {
    id: 'fio',
    name: 'Trama',
    role: 'Criador',
    description: 'Transforma ideias em resumos, mapas mentais e materiais.',
    color: '#ef5350',
    avatar: '/brand/agent-fio.png',
  },
  {
    id: 'soma',
    name: 'Elo',
    role: 'Mentor',
    description: 'Acompanha o seu progresso e motiva a sua evolução.',
    color: '#ab47bc',
    avatar: '/brand/agent-soma.png',
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Conteúdo confiável',
    description: 'Cada citação permite voltar ao trecho do documento.',
  },
  {
    icon: Zap,
    title: 'Aprendizagem prática',
    description: 'Mais do que teoria, focado em aplicação e resultados.',
  },
  {
    icon: UserCheck,
    title: 'Personalização real',
    description: 'Adapta-se ao seu ritmo, nível e objetivos.',
  },
  {
    icon: Lock,
    title: 'Seguro e privado',
    description: 'Os seus dados e o seu progresso são protegidos.',
  },
];

const STEPS = [
  {
    num: '01',
    icon: Search,
    title: 'Escolhe as fontes',
    description: 'Seleciona os livros, documentos ou links que queres explorar.',
  },
  {
    num: '02',
    icon: Target,
    title: 'Define o objetivo',
    description: 'Diz o que queres aprender, rever ou aprofundar.',
  },
  {
    num: '03',
    icon: MessageSquare,
    title: 'Conversa com os agentes',
    description: 'Recebe explicações, resumos, exercícios e muito mais.',
  },
  {
    num: '04',
    icon: TrendingUp,
    title: 'Pratica e evolui',
    description: 'Acompanha o teu progresso e atinge os teus objetivos.',
  },
];

const STUDY_SCENARIOS = [
  {
    quote: 'Comece por uma explicação curta e volte à fonte quando surgir uma dúvida.',
    name: 'Entender um conceito',
    role: 'Cenário ilustrativo de estudo',
    avatar: '/landing/avatar-joao.png',
    stars: 5,
  },
  {
    quote: 'Transforme suas anotações em cartões e pratique com perguntas sobre o documento.',
    name: 'Revisar para uma prova',
    role: 'Cenário ilustrativo de estudo',
    avatar: '/landing/avatar-ana.png',
    stars: 5,
  },
  {
    quote: 'Siga uma trilha, converse sobre as ideias e conecte o que aprendeu.',
    name: 'Conectar o aprendizado',
    role: 'Cenário ilustrativo de estudo',
    avatar: '/landing/avatar-carlos.png',
    stars: 5,
  },
];

export default function Landing() {
  const [activeTab, setActiveTab] = useState<'resumo' | 'fonte'>('resumo');
  const [chatInput, setChatInput] = useState('');
  const [chatQuestion, setChatQuestion] = useState('Podes explicar este tema de uma forma mais simples?');
  const [isTyping, setIsTyping] = useState(false);
  const [chatAnswer, setChatAnswer] = useState(
    'Claro! Vou explicar de forma simples. A Fotossíntese é o processo pelo qual as plantas produzem o seu próprio alimento, usando a luz solar, dióxido de carbono e água.'
  );

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    const prompt = chatInput.trim();
    setChatQuestion(prompt);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatAnswer(
        `Excelente pergunta sobre "${prompt}"! Com o Atlas AI, conectamos este tema a referências confiáveis, dividindo o conceito em partes simples e práticas para o teu estudo.`
      );
    }, 700);
  };

  return (
    <div className="atlas-clone-landing">
      {/* ====================================================================
          1. HEADER ESPELHADO COM GLASSMORPHISM
          ==================================================================== */}
      <header className="clone-header mirrored-header">
        <div className="header-glass-reflection" aria-hidden="true" />
        <div className="clone-header-inner">
          {/* Logo */}
          <Link className="clone-logo" href="/" aria-label="Atlas AI">
            <Image
              src="/brand/novamente-mark.png"
              alt="Atlas AI Logo"
              width={34}
              height={34}
              priority
            />
            <div className="clone-logo-text">
              <span className="clone-logo-title">ATLAS <span className="logo-ai-badge">AI</span></span>
              <span className="clone-logo-sub">AGENTS FOR EDUCATION</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="clone-nav" aria-label="Navegação principal">
            <a href="#" className="clone-nav-link active">Início</a>
            <a href="#agentes" className="clone-nav-link">Agentes</a>
            <a href="#recursos" className="clone-nav-link">Recursos</a>
            <a href="#sobre" className="clone-nav-link">Sobre</a>
            <a href="#seu-atlas" className="clone-nav-link">Seu Atlas</a>
          </nav>

          {/* Action Buttons */}
          <div className="clone-header-actions">
            <Link className="clone-login-btn" href="/workspace">
              <User size={15} />
              <span>Entrar</span>
            </Link>
            <Link className="clone-btn-primary" href="/workspace">
              <span>Começar Agora</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ====================================================================
            2. SECÇÃO 1: HERO (FUNDO PRETO)
            ==================================================================== */}
        <section className="clone-hero-section section-dark">
          <div className="clone-container">
            <div className="clone-hero-layout">
              {/* Left Copy */}
              <div className="clone-hero-left">
                <div className="clone-kicker">
                  <span className="clone-kicker-dash" />
                  <span>APRENDIZAGEM MAIS INTELIGENTE</span>
                </div>

                <h1 className="clone-hero-title">
                  O seu assistente de<br />
                  aprendizagem <span className="clone-title-highlight">com IA.</span>
                </h1>

                <p className="clone-hero-desc">
                  Atlas AI é uma plataforma que reúne agentes inteligentes para te ajudar a aprender melhor, com base em fontes confiáveis, conteúdos personalizados e uma abordagem prática.
                </p>

                <div className="clone-hero-buttons">
                  <Link className="clone-btn-primary hero-main-btn" href="/workspace">
                    <span>Começar Agora</span>
                    <ArrowRight size={16} />
                  </Link>
                  <a className="clone-btn-ghost" href="#como-funciona">
                    <Play size={14} className="play-icon" />
                    <span>Ver como funciona</span>
                  </a>
                </div>

                {/* Social Proof */}
                <div className="clone-social-proof">
                  <div className="clone-avatar-stack">
                    <Image src="/landing/avatar-joao.png" alt="Estudante" width={28} height={28} className="stack-avatar" />
                    <Image src="/landing/avatar-ana.png" alt="Estudante" width={28} height={28} className="stack-avatar" />
                    <Image src="/landing/avatar-carlos.png" alt="Estudante" width={28} height={28} className="stack-avatar" />
                    <div className="stack-avatar stack-more">MVP</div>
                  </div>
                  <span className="clone-social-proof-text">
                    Um projeto em construção com a comunidade do hackathon
                  </span>
                </div>
              </div>

              {/* Right 3D Tablet Mockup */}
              <div className="clone-hero-right">
                <div className="clone-tablet-frame">
                  <div className="tablet-screen">
                    {/* Tablet Left Sidebar */}
                    <div className="tablet-sidebar">
                      <div className="tablet-logo-mini">
                        <Image src="/brand/novamente-mark.png" alt="" width={16} height={16} />
                        <span>ATLAS <strong>AI</strong></span>
                      </div>

                      <div className="tablet-nav-list">
                        <span className="tablet-nav-item active">Início</span>
                        <span className="tablet-nav-item">Agentes</span>
                        <span className="tablet-nav-item">Biblioteca</span>
                        <span className="tablet-nav-item">Histórico</span>
                        <span className="tablet-nav-item">Definições</span>
                      </div>

                      <div className="tablet-agents-list">
                        <small className="tablet-agents-title">AGENTES</small>
                        <div className="tablet-agent-row"><span className="pip pip-blue" /> Guia</div>
                        <div className="tablet-agent-row active"><span className="pip pip-green" /> Faísca</div>
                        <div className="tablet-agent-row"><span className="pip pip-amber" /> Prisma</div>
                        <div className="tablet-agent-row"><span className="pip pip-red" /> Trama</div>
                        <div className="tablet-agent-row"><span className="pip pip-purple" /> Elo</div>
                      </div>
                    </div>

                    {/* Tablet Main Chat Window */}
                    <div className="tablet-chat-main">
                      {/* Chat Header */}
                      <div className="tablet-chat-header">
                        <div className="tablet-agent-profile">
                          <Image src="/brand/agent-lumi.png" alt="Faísca" width={28} height={28} className="tablet-agent-pic" />
                          <div>
                            <strong>Faísca</strong>
                            <small>Exploradora</small>
                          </div>
                        </div>
                        <span className="tablet-online-badge">● Online</span>
                      </div>

                      {/* Chat Messages */}
                      <div className="tablet-chat-messages">
                        {/* User message */}
                        <div className="tablet-msg user-msg">
                          <p>{chatQuestion}</p>
                        </div>

                        {/* Faísca message */}
                        <div className="tablet-msg agent-msg">
                          {isTyping ? (
                            <div className="typing-dots" aria-label="Faísca está a escrever...">
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                            </div>
                          ) : (
                            <>
                              <p>{chatAnswer}</p>

                              {/* Plant Pedagogical Card */}
                              <div className="tablet-plant-card">
                                <div className="plant-card-visual">
                                  <span className="plant-leaf-icon">🌿</span>
                                </div>
                                <div className="plant-card-content">
                                  <strong>Fotossíntese</strong>
                                  <ul>
                                    <li>• Luz solar</li>
                                    <li>• CO₂ (dióxido de carbono)</li>
                                    <li>• Água</li>
                                    <li className="formula-arrow">→ Glicose (alimento)</li>
                                  </ul>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Chat Input Bar */}
                      <form className="tablet-chat-input-bar" onSubmit={handleSendPrompt}>
                        <input
                          type="text"
                          placeholder="Escreve a tua pergunta..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button type="submit" aria-label="Enviar">
                          <Send size={13} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            3. SECÇÃO 2: OS NOSSOS AGENTES (FUNDO BEGE ARCHIVAL)
            ==================================================================== */}
        <section id="agentes" className="clone-agents-section section-beige">
          <div className="clone-container">
            <div className="clone-agents-head">
              <div className="agents-head-left">
                <div className="clone-kicker">
                  <span className="clone-kicker-dash" />
                  <span>OS NOSSOS AGENTES</span>
                </div>
                <h2>Cinco especialistas, um só objetivo: o seu sucesso.</h2>
              </div>
              <div className="agents-head-right">
                <p>
                  Cada agente tem uma função única, com um foco específico para te ajudar a aprender, explorar, organizar e evoluir.
                </p>
                <Link className="clone-text-link" href="/workspace">
                  <span>Conheça todos os agentes</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* 5 Agent Cards */}
            <div className="clone-agents-grid">
              {AGENTS.map((agent) => (
                <article key={agent.id} className="clone-agent-card">
                  <div className="agent-card-avatar-wrap">
                    <Image
                      src={agent.avatar}
                      alt={agent.name}
                      width={52}
                      height={52}
                      className="agent-card-avatar"
                    />
                  </div>
                  <h3 className="agent-card-name">{agent.name}</h3>
                  <span className="agent-card-role">{agent.role}</span>
                  <p className="agent-card-desc">{agent.description}</p>
                  <div className="agent-card-bar" style={{ backgroundColor: agent.color }} />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================================
            4. SECÇÃO 3: POR QUE ATLAS (FUNDO PRETO)
            ==================================================================== */}
        <section id="sobre" className="clone-why-section section-dark">
          <div className="clone-container">
            <div className="clone-why-grid">
              {/* Left Column */}
              <div className="clone-why-left">
                <div className="clone-kicker">
                  <span className="clone-kicker-dash" />
                  <span>POR QUE ATLAS</span>
                </div>
                <h2>Educação com base no que realmente importa.</h2>
                <p>
                  O Atlas combina o poder da IA com conteúdos confiáveis, para oferecer uma experiência de aprendizagem personalizada, segura e eficaz.
                </p>
                <Link className="clone-outline-btn" href="/workspace">
                  <span>Saiba mais</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Right Column: 4 Feature Cards */}
              <div className="clone-why-features">
                {FEATURES.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div key={idx} className="clone-feature-row">
                      <div className="feature-icon-circle">
                        <Icon size={18} />
                      </div>
                      <div className="feature-text">
                        <h4>{feat.title}</h4>
                        <p>{feat.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            5. SECÇÃO 4: COMO FUNCIONA (FUNDO BEGE ARCHIVAL)
            ==================================================================== */}
        <section id="como-funciona" className="clone-how-section section-beige">
          <div className="clone-container">
            <div className="clone-how-head">
              <div className="how-head-left">
                <div className="clone-kicker">
                  <span className="clone-kicker-dash" />
                  <span>COMO FUNCIONA</span>
                </div>
                <h2>Da pergunta ao conhecimento.</h2>
              </div>
              <div className="how-head-right">
                <p>Em poucos passos, o Atlas transforma informação em conhecimento real.</p>
              </div>
            </div>

            {/* Subtitle Badge */}
            <div className="how-subtitle-badge">
              <span className="badge-dot" />
              <span>Tudo o que precisa para aprender, num só lugar.</span>
            </div>

            {/* 4 Steps Row */}
            <div className="clone-steps-grid">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.num} className="clone-step-card">
                    <div className="step-card-top">
                      <span className="step-num">{step.num}</span>
                      <Icon size={18} className="step-icon" />
                    </div>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====================================================================
            6. SECÇÃO 5: EXPERIÊNCIA REAL (FUNDO PRETO)
            ==================================================================== */}
        <section id="recursos" className="clone-experience-section section-dark">
          <div className="clone-container">
            <div className="clone-experience-card">
              {/* Left Column */}
              <div className="experience-left">
                <div className="clone-kicker">
                  <span className="clone-kicker-dash" />
                  <span>EXPERIÊNCIA REAL</span>
                </div>
                <h2>Uma plataforma completa, na ponta dos seus dedos.</h2>
                <p className="experience-subtitle">Tudo o que precisa para aprender, num só lugar.</p>

                <ul className="experience-checklist">
                  <li>
                    <span className="check-bullet" />
                    <strong>Interface simples e intuitiva</strong>
                  </li>
                  <li>
                    <span className="check-bullet" />
                    <strong>Acesso aos cinco agentes especializados</strong>
                  </li>
                  <li>
                    <span className="check-bullet" />
                    <strong>Biblioteca de conteúdos e fontes confiáveis</strong>
                  </li>
                  <li>
                    <span className="check-bullet" />
                    <strong>Histórico e acompanhamento de progresso</strong>
                  </li>
                </ul>
              </div>

              {/* Right Column: High Fidelity 3-Column Workspace Mockup */}
              <div className="experience-right">
                <div className="experience-mockup-wrapper">
                  <div className="app-mockup-window">
                    {/* Col 1: App Sidebar */}
                    <div className="mockup-sidebar">
                      <div className="mockup-brand">
                        <Image src="/brand/novamente-mark.png" alt="" width={14} height={14} />
                        <span>ATLAS <strong>AI</strong></span>
                      </div>
                      <div className="mockup-nav">
                        <span className="mockup-nav-row active">Início</span>
                        <span className="mockup-nav-row">Agentes</span>
                        <span className="mockup-nav-row">Biblioteca</span>
                        <span className="mockup-nav-row">Histórico</span>
                        <span className="mockup-nav-row">Definições</span>
                      </div>
                      <div className="mockup-agents-dots">
                        <small>AGENTES</small>
                        <div className="dot-row"><span className="pip pip-blue" /> Guia</div>
                        <div className="dot-row active"><span className="pip pip-green" /> Faísca</div>
                        <div className="dot-row"><span className="pip pip-amber" /> Prisma</div>
                        <div className="dot-row"><span className="pip pip-red" /> Trama</div>
                        <div className="dot-row"><span className="pip pip-purple" /> Elo</div>
                      </div>
                    </div>

                    {/* Col 2: Chat Stream */}
                    <div className="mockup-chat">
                      <div className="mockup-chat-header">
                        <div className="agent-meta">
                          <Image src="/brand/agent-lumi.png" alt="" width={22} height={22} />
                          <div>
                            <strong>Faísca</strong>
                            <small>Exploradora</small>
                          </div>
                        </div>
                        <span className="online-pill">● Online</span>
                      </div>

                      <div className="mockup-bubbles">
                        <div className="bubble bubble-user">
                          <p>Podes explicar este tema de forma mais simples?</p>
                        </div>
                        <div className="bubble bubble-agent">
                          <p>
                            Claro! Vou explicar de forma simples. A <strong>Fotossíntese</strong> é o processo pelo qual as plantas produzem o seu próprio alimento, usando a luz solar, dióxido de carbono e água.
                          </p>
                          <div className="inline-plant-diagram">
                            <span className="leaf-glyph">🌿</span>
                            <div className="diagram-copy">
                              <strong>Fotossíntese</strong>
                              <small>• Luz solar</small>
                              <small>• CO₂ (dióxido de carbono)</small>
                              <small>• Água</small>
                              <small className="arrow">→ Glicose (alimento)</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mockup-input-box">
                        <span>Escreve a tua pergunta...</span>
                        <Send size={11} className="mockup-send" />
                      </div>
                    </div>

                    {/* Col 3: Fontes & Evidências Panel */}
                    <div className="mockup-drawer">
                      <div className="drawer-header">
                        <strong>Fontes & evidências</strong>
                        <span className="drawer-close">✕</span>
                      </div>

                      <div className="drawer-tabs">
                        <button
                          type="button"
                          className={`drawer-tab ${activeTab === 'resumo' ? 'active' : ''}`}
                          onClick={() => setActiveTab('resumo')}
                        >
                          Resumo Trama
                        </button>
                        <button
                          type="button"
                          className={`drawer-tab ${activeTab === 'fonte' ? 'active' : ''}`}
                          onClick={() => setActiveTab('fonte')}
                        >
                          Fonte original
                        </button>
                      </div>

                      {activeTab === 'resumo' ? (
                        <div className="drawer-document-paper">
                          <h5>FOTOSSÍNTESE EM SÍNTESE</h5>
                          <p>
                            A fotossíntese é a via metabólica pela qual organismos fotoautotróficos convertem energia luminosa em energia química, fixando dióxido de carbono para sintetizar carboidratos.
                          </p>
                          <p className="doc-highlight">
                            Equação geral: 6 CO₂ + 6 H₂O + luz → C₆H₁₂O₆ + 6 O₂
                          </p>
                          <div className="doc-citation-tag">
                            <FileText size={10} />
                            <span>Referência: Biologia Celular, pág. 42</span>
                          </div>
                        </div>
                      ) : (
                        <div className="drawer-document-paper">
                          <h5>MANUSCRITO ORIGINAL</h5>
                          <p>
                            &ldquo;As reações fotoquímicas ocorrem na membrana dos tilacoides nos cloroplastos, promovendo o bombeamento de prótons e a geração de ATP e NADPH.&rdquo;
                          </p>
                          <div className="doc-citation-tag">
                            <ShieldCheck size={10} />
                            <span>Passagem validada via citação literal</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            7. SECÇÃO 6: CAMINHOS PARA EXPLORAR (FUNDO BEGE ARCHIVAL)
            ==================================================================== */}
        <section className="clone-testimonials-section section-beige">
          <div className="clone-container">
            <div className="clone-kicker">
              <span className="clone-kicker-dash" />
              <span>CAMINHOS PARA EXPLORAR</span>
            </div>
            <h2 className="testimonials-title">Três jeitos de começar a aprender.</h2>

            <div className="testimonials-grid">
              {STUDY_SCENARIOS.map((item, idx) => (
                <div key={idx} className="testimonial-card">
                  <div className="testimonial-user-top">
                    <Image
                      src={item.avatar}
                      alt={item.name}
                      width={44}
                      height={44}
                      className="testimonial-avatar"
                    />
                  </div>
                  <p className="testimonial-quote">{item.quote}</p>
                  <div className="testimonial-author">
                    <strong>{item.name}</strong>
                    <small>{item.role}</small>
                  </div>
                  <p className="small">Experiência a validar com estudantes.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="seu-atlas" className="clone-customizer-section section-dark" aria-labelledby="custom-atlas-title">
          <div className="clone-container">
            <div className="clone-kicker"><span className="clone-kicker-dash"/><span>SEU COMPANHEIRO DE APRENDIZAGEM</span></div>
            <h2 id="custom-atlas-title">Crie seu próprio Atlas.</h2>
            <p>Escolha um nome, uma cor e uma perspectiva para começar. Você pode mudar depois, no seu ritmo.</p>
            <AtlasCustomizer destination="/workspace"/>
          </div>
        </section>

        {/* ====================================================================
            8. SECÇÃO 7: BANNER FINAL (FUNDO PRETO COM FOTOGRAFIA)
            ==================================================================== */}
        <section className="clone-final-banner-section section-dark">
          <div className="clone-container">
            <div className="final-banner-card">
              <div className="final-banner-bg-img">
                <Image
                  src="/landing/study-banner.png"
                  alt="Estudante estudando à noite com foco"
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'center right' }}
                  priority
                />
                <div className="final-banner-gradient-overlay" />
              </div>

              <div className="final-banner-content">
                <div className="final-banner-left">
                  <h2>O seu próximo passo<br />começa aqui.</h2>
                  <p>
                    Junte-se a milhares de estudantes que já estão a aprender melhor com o Atlas AI.
                  </p>
                  <Link className="clone-btn-primary banner-cta" href="/workspace">
                    <span>Começar Agora</span>
                    <ArrowRight size={16} />
                  </Link>
                  <small className="banner-footnote">
                    É gratuito • Sem cartão • Em poucos minutos
                  </small>
                </div>

                <div className="final-banner-right">
                  <div className="handwritten-motto">
                    <span>Mais conhecimento.</span>
                    <span>Mais futuro.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================================
          9. FOOTER (FUNDO ESCURO)
          ==================================================================== */}
      <footer className="clone-footer">
        <div className="clone-container">
          <div className="clone-footer-top">
            {/* Logo */}
            <Link className="clone-logo" href="/">
              <Image
                src="/brand/novamente-mark.png"
                alt="Atlas AI"
                width={30}
                height={30}
              />
              <div className="clone-logo-text">
                <span className="clone-logo-title">ATLAS <span className="logo-ai-badge">AI</span></span>
                <span className="clone-logo-sub">AGENTS FOR EDUCATION</span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="footer-nav" aria-label="Links de rodapé">
              <a href="#">Início</a>
              <a href="#agentes">Agentes</a>
              <a href="#recursos">Recursos</a>
              <a href="#sobre">Sobre</a>
            </nav>

            {/* Social Icons */}
            <div className="footer-social-icons">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube size={17} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram size={17} />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                <MessageCircle size={17} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin size={17} />
              </a>
            </div>
          </div>

          <div className="clone-footer-bottom">
            <span>&copy; 2026 Atlas AI. Todos os direitos reservados.</span>
            <div className="footer-bottom-links">
              <a href="#">Termos de Uso</a>
              <a href="#">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
