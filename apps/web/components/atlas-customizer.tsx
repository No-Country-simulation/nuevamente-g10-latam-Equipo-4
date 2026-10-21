"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import catalog from "@atlas/contracts/agents.json";
import type { AgentId } from "@atlas/contracts";
import {
  atlasColors,
  saveIdentity,
  useAtlasIdentity,
  type AtlasIdentity,
} from "@/lib/atlas-identity";
import { AtlasOrb } from "./atlas-orb";

export default function AtlasCustomizer({
  inStudio = false,
  onComplete,
}: {
  inStudio?: boolean;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const identity = useAtlasIdentity();
  const [name, setName] = useState("");
  const [color, setColor] = useState<AtlasIdentity["color"]>(atlasColors[0]);
  const [agentId, setAgentId] = useState<AgentId>("nilo");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (identity) {
      setName(identity.name);
      setColor(identity.color);
      setAgentId(identity.agentId);
    }
    setReady(true);
  }, [identity]);
  const guide = catalog.agents.find((a) => a.id === agentId)!;
  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      saveIdentity({ version: 1, name: name.trim(), color, agentId });
      if (inStudio) onComplete?.();
      else router.push("/studio");
    } catch {
      setError(
        "Não foi possível salvar neste navegador. Confira o nome e permita o armazenamento local para tentar novamente.",
      );
    }
  }
  function reset() {
    try {
      saveIdentity(null);
      setName("");
      setColor(atlasColors[0]);
      setAgentId("nilo");
      setError("");
    } catch {
      setError(
        "O navegador não permitiu remover a personalização. Verifique o armazenamento local.",
      );
    }
  }
  return (
    <div className={`atlas-customizer ${inStudio ? "customizer-compact" : ""}`}>
      <div
        className="companion-preview"
        style={{ "--companion-color": color } as React.CSSProperties}
      >
        <span className="preview-caption">Seu companheiro de descobertas</span>
        <AtlasOrb color={color} />
        <h3>{name.trim() || "Seu Atlas"}</h3>
        <p>{guide.description}</p>
        <span className="companion-tag">
          <span />
          Com a perspectiva de {guide.name}
        </span>
      </div>
      <form className="companion-form" onSubmit={submit}>
        <label htmlFor="companion-name">
          Como vamos chamar seu Atlas?
          <input
            id="companion-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Órion, Íris, Cosmo…"
            maxLength={24}
            minLength={1}
            required
            pattern=".*\S.*"
            autoComplete="off"
          />
          <span className="field-caption">
            Um nome que tenha a ver com você. Até 24 caracteres.
          </span>
        </label>
        <fieldset>
          <legend>Escolha sua energia</legend>
          <div className="companion-swatches">
            {atlasColors.map((value, i) => (
              <button
                type="button"
                key={value}
                style={{ background: value }}
                aria-label={
                  [
                    "Laranja solar",
                    "Violeta orbital",
                    "Azul celeste",
                    "Verde aurora",
                  ][i]
                }
                aria-pressed={color === value}
                onClick={() => setColor(value)}
              >
                {color === value && <Check size={18} />}
              </button>
            ))}
          </div>
        </fieldset>
        <label htmlFor="companion-guide">
          Uma perspectiva para começar
          <select
            id="companion-guide"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value as AgentId)}
          >
            {catalog.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.persona}
              </option>
            ))}
          </select>
        </label>
        <p className="companion-privacy">
          Nome e aparência ficam neste navegador. Você pode mudar depois. A
          memória de aprendizagem só é ativada com seu consentimento no estúdio.
        </p>
        <button
          className="landing-button landing-button-primary"
          disabled={!ready}
          type="submit"
        >
          {inStudio ? "Salvar meu Atlas" : "Criar meu Atlas e começar"}
          <ArrowRight size={17} />
        </button>
        {identity && (
          <button className="companion-reset" type="button" onClick={reset}>
            <RotateCcw size={13} />
            Restaurar tutores originais
          </button>
        )}
        {error && (
          <p className="companion-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
