import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import {
  existsSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";

export const slots = [
  "generation",
  "embeddings",
  "decision",
  "search",
] as const;
export type Slot = (typeof slots)[number];
export const providers = {
  openrouter: "https://openrouter.ai/api/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  typesafe: "https://api.typesafe.ai",
  firecrawl: "https://api.firecrawl.dev",
} as const;
export type Provider =
  | keyof typeof providers
  | "gateway"
  | "compatible"
  | "chatgpt_local";
export const connectionSchema = z
  .object({
    mode: z.enum(["manual", "local_login"]),
    provider: z.enum([
      "openrouter",
      "openai",
      "anthropic",
      "typesafe",
      "firecrawl",
      "chatgpt_local",
    ]),
    model: z.string().trim().min(1).max(160).optional(),
    key: z.string().trim().min(8).max(4096).optional(),
    context_window: z.number().int().min(16000).max(200000).optional(),
  })
  .strict();
export type Connection = {
  provider: Provider;
  model: string;
  base_url: string;
  key: string;
  context_window: number;
  source: "env" | "secret_file" | "manual" | "local_login";
  updated_at?: string;
};
type Vault = {
  version: 1;
  tenant: string;
  profiles: Partial<Record<Slot, Connection>>;
};
const fail = () =>
  Object.assign(
    new Error(
      "Cofre indisponível. Verifique a chave mestra e o volume no servidor.",
    ),
    { status: 503 },
  );
export function secret(name: string): string {
  const file = process.env[name + "_FILE"];
  if (file) {
    try {
      const value = readFileSync(file);
      if (value.length > 16384) throw fail();
      return value.toString().trim();
    } catch {
      throw fail();
    }
  }
  return process.env[name] || "";
}
export function masterKey(): Buffer {
  const encoded = secret("ATLAS_CREDENTIAL_MASTER_KEY");
  if (!/^[A-Za-z0-9+/]{43}=$/.test(encoded)) throw fail();
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw fail();
  return key;
}
export function vaultFile() {
  return resolve(
    process.env.ATLAS_CREDENTIALS_FILE ||
      resolve(
        process.env.ATLAS_DATA_DIR || "../../data",
        "credentials/providers.enc",
      ),
  );
}
function tenant() {
  return process.env.ATLAS_TENANT_ID || "local-workspace";
}
function aad() {
  return Buffer.from("atlas-credentials:v1:" + tenant());
}
export function readVault(): Vault {
  if (!existsSync(vaultFile()))
    return { version: 1, tenant: tenant(), profiles: {} };
  try {
    const bytes = readFileSync(vaultFile());
    if (bytes.length > 65536) throw fail();
    const envelope = JSON.parse(bytes.toString());
    if (envelope.version !== 1) throw fail();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      masterKey(),
      Buffer.from(envelope.iv, "base64"),
    );
    decipher.setAAD(aad());
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    const data = JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(envelope.data, "base64")),
        decipher.final(),
      ]).toString(),
    ) as Vault;
    if (data.version !== 1 || data.tenant !== tenant() || !data.profiles)
      throw fail();
    return data;
  } catch {
    throw fail();
  }
}
function writeVault(value: Vault) {
  const key = masterKey(),
    path = vaultFile();
  if (!Object.keys(value.profiles).length) {
    if (existsSync(path)) unlinkSync(path);
    return;
  }
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad());
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ]);
  const envelope = JSON.stringify({
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  });
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temp = path + "." + randomBytes(8).toString("hex") + ".tmp";
  try {
    writeFileSync(temp, envelope, { mode: 0o600, flag: "wx" });
    renameSync(temp, path);
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}
function envConnection(slot: Slot): Connection {
  const source = (name: string) =>
    process.env[name + "_FILE"] ? ("secret_file" as const) : ("env" as const);
  if (slot === "decision")
    return {
      provider: "typesafe",
      model: "jev-latest",
      base_url: providers.typesafe,
      key: secret("TYPESAFE_API_KEY"),
      context_window: 0,
      source: source("TYPESAFE_API_KEY"),
    };
  if (slot === "search")
    return {
      provider: "firecrawl",
      model: "",
      base_url: providers.firecrawl,
      key: secret("FIRECRAWL_API_KEY"),
      context_window: 0,
      source: source("FIRECRAWL_API_KEY"),
    };
  if (slot === "embeddings")
    return {
      provider: "compatible",
      model: process.env.EMBEDDING_MODEL || "",
      base_url: process.env.EMBEDDING_BASE_URL || "",
      key: secret("EMBEDDING_API_KEY"),
      context_window: 0,
      source: source("EMBEDDING_API_KEY"),
    };
  if (process.env.ATLAS_AGENT_RUNTIME === "direct")
    return {
      provider: "compatible",
      model: process.env.LLM_MODEL || "",
      base_url: process.env.LLM_BASE_URL || "",
      key: secret("LLM_API_KEY"),
      context_window: 32768,
      source: source("LLM_API_KEY"),
    };
  const provider = z
    .enum(["gateway", "openai", "anthropic", "openrouter", "chatgpt_local"])
    .parse(process.env.EVE_MODEL_PROVIDER || "gateway");
  const name = {
    gateway: "AI_GATEWAY_API_KEY",
    openai: "ATLAS_OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    chatgpt_local: "ATLAS_UNUSED_KEY",
  }[provider];
  return {
    provider,
    model: process.env.EVE_MODEL || "",
    base_url:
      provider in providers
        ? providers[provider as keyof typeof providers]
        : "",
    key: secret(name),
    context_window: Number(process.env.EVE_MODEL_CONTEXT_WINDOW || 32768),
    source: provider === "chatgpt_local" ? "local_login" : source(name),
  };
}
export function connection(slot: Slot): Connection {
  return readVault().profiles[slot] || envConnection(slot);
}
export function ready(slot: Slot) {
  const p = connection(slot);
  return p.provider === "chatgpt_local"
    ? false
    : !!p.key &&
        (!(slot === "generation" || slot === "embeddings") || !!p.model);
}
export function saveConnection(slot: Slot, raw: unknown) {
  const input = connectionSchema.parse(raw);
  const allowed = {
    generation: ["openrouter", "openai", "anthropic", "chatgpt_local"],
    embeddings: ["openai", "openrouter"],
    decision: ["typesafe"],
    search: ["firecrawl"],
  }[slot];
  if (!allowed.includes(input.provider))
    throw Object.assign(new Error("Provedor incompatível com a finalidade."), {
      status: 400,
    });
  if (input.mode === "local_login") {
    if (
      slot !== "generation" ||
      input.provider !== "chatgpt_local" ||
      process.env.ATLAS_ALLOW_LOCAL_CHATGPT !== "1" ||
      process.env.NODE_ENV === "production" ||
      input.key
    )
      throw Object.assign(
        new Error(
          "Login ChatGPT é restrito ao Eve local habilitado pelo operador.",
        ),
        { status: 409 },
      );
  } else if (!input.key || input.provider === "chatgpt_local")
    throw Object.assign(
      new Error("Informe uma chave do provedor selecionado."),
      { status: 400 },
    );
  if ((slot === "generation" || slot === "embeddings") && !input.model)
    throw Object.assign(new Error("Informe o identificador do modelo."), {
      status: 400,
    });
  const value = readVault();
  value.profiles[slot] = {
    provider: input.provider,
    model: input.model || "",
    base_url:
      input.provider in providers
        ? providers[input.provider as keyof typeof providers]
        : "",
    key: input.key || "",
    source: input.mode === "local_login" ? "local_login" : "manual",
    context_window: input.context_window || 32768,
    updated_at: new Date().toISOString(),
  };
  writeVault(value);
  return publicConnections();
}
export function removeConnection(slot: Slot) {
  const value = readVault();
  delete value.profiles[slot];
  writeVault(value);
  return publicConnections();
}
export function publicConnections() {
  let writable = false;
  try {
    masterKey();
    writable = true;
  } catch {}
  return {
    scope: "local_workspace",
    manual_available: writable,
    chatgpt_local_allowed:
      process.env.ATLAS_ALLOW_LOCAL_CHATGPT === "1" &&
      process.env.NODE_ENV !== "production",
    runtime: process.env.ATLAS_AGENT_RUNTIME || "eve",
    eve_configured: !!process.env.EVE_URL,
    connections: slots.map((slot) => {
      const p = connection(slot);
      return {
        slot,
        provider: p.provider,
        model: p.model,
        source: p.source,
        configured: ready(slot),
        status:
          p.provider === "chatgpt_local"
            ? "login_requires_local_verification"
            : ready(slot)
              ? "configured_not_verified"
              : "not_configured",
        updated_at: p.updated_at || null,
        context_window: p.context_window,
      };
    }),
  };
}
