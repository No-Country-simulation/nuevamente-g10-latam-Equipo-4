import { connection, type Slot } from "./vault.js";
/** Catalog-only probe: no documents, user prompts, model generation or embeddings. */
export async function probeConnection(
  slot: Slot,
  fetcher: typeof fetch = fetch,
) {
  const p = connection(slot);
  if (
    !p.key ||
    !["openai", "openrouter", "anthropic"].includes(p.provider) ||
    !["generation", "embeddings"].includes(slot)
  )
    throw Object.assign(
      new Error("Este provedor é validado na primeira operação real."),
      { status: 409 },
    );
  const headers: Record<string, string> =
    p.provider === "anthropic"
      ? { "x-api-key": p.key, "anthropic-version": "2023-06-01" }
      : { Authorization: `Bearer ${p.key}` };
  try {
    const response = await fetcher(p.base_url + "/models", {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      return {
        status: "rejected_or_unavailable",
        authenticated: false,
        inference: false,
      };
    if (!response.body) throw new Error();
    const reader = response.body.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 4 * 1024 * 1024) throw new Error();
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => undefined);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    return {
      status: "catalog_accessible",
      authenticated: true,
      model_listed:
        Array.isArray(body.data) &&
        body.data.some((model: { id?: string }) => model.id === p.model),
      inference: false,
    };
  } catch {
    return { status: "unavailable", authenticated: false, inference: false };
  }
}
