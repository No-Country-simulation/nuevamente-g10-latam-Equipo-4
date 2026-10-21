"use client";

import { useEffect, useState } from "react";
import type { AgentId } from "@atlas/contracts";

export const identityKey = "atlas.companion.v1";
export const atlasColors = [
  "#ff704f",
  "#a89bff",
  "#55dce8",
  "#8fddb5",
] as const;
export type AtlasIdentity = {
  version: 1;
  name: string;
  color: (typeof atlasColors)[number];
  agentId: AgentId;
};
const agents: AgentId[] = ["nilo", "lumi", "prisma", "fio", "soma"];

export function parseIdentity(raw: string | null): AtlasIdentity | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (
      v?.version !== 1 ||
      typeof v.name !== "string" ||
      !v.name.trim() ||
      v.name.trim().length > 24 ||
      !atlasColors.includes(v.color) ||
      !agents.includes(v.agentId)
    )
      return null;
    return {
      version: 1,
      name: v.name.trim(),
      color: v.color,
      agentId: v.agentId,
    };
  } catch {
    return null;
  }
}

export function readIdentity(): AtlasIdentity | null {
  try {
    return parseIdentity(window.localStorage.getItem(identityKey));
  } catch {
    return null;
  }
}

export function saveIdentity(value: AtlasIdentity | null) {
  if (value) {
    const valid = parseIdentity(JSON.stringify(value));
    if (!valid) throw new Error("Confira o nome e as opções do seu Atlas.");
    window.localStorage.setItem(identityKey, JSON.stringify(valid));
  } else window.localStorage.removeItem(identityKey);
  window.dispatchEvent(new Event("atlas-identity-change"));
}

export function useAtlasIdentity() {
  const [identity, setIdentity] = useState<AtlasIdentity | null>(null);
  useEffect(() => {
    const refresh = () => setIdentity(readIdentity());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("atlas-identity-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("atlas-identity-change", refresh);
    };
  }, []);
  return identity;
}
