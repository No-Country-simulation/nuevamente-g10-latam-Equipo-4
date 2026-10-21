"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AtlasLogo } from "./atlas-orb";

export default function LandingNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <header className="landing-header landing-container">
      <Link href="/" aria-label="Atlas, início">
        <AtlasLogo />
      </Link>
      <button
        className="landing-menu-toggle"
        aria-expanded={open}
        aria-controls="landing-nav"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav
        id="landing-nav"
        className={open ? "landing-navigation is-open" : "landing-navigation"}
        aria-label="Navegação principal"
      >
        {[
          ["#produto", "Produto"],
          ["#metodos", "Métodos"],
          ["#agentes", "Agentes"],
          ["#seu-atlas", "Seu Atlas"],
          ["#perguntas", "Perguntas"],
        ].map(([href, label]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
      </nav>
      <div className="landing-header-actions">
        <Link className="landing-login" href="/studio">
          Abrir estúdio
        </Link>
        <Link
          className="landing-button landing-button-primary"
          href="#seu-atlas"
        >
          Começar
        </Link>
      </div>
    </header>
  );
}
