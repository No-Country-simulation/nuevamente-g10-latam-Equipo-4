import { defineAgent } from 'eve';
const model = process.env.EVE_MODEL;
if (!model) throw new Error('Configure EVE_MODEL explicitamente antes de construir/iniciar o runtime.');
export default defineAgent({modelContextWindowTokens:process.env.EVE_MODEL_CONTEXT_WINDOW?Number(process.env.EVE_MODEL_CONTEXT_WINDOW):undefined,experimental:{workflow:{retention:0}},
  model: model,
  defaultTools: false,
  tool: false,
  limits: {maxInputTokensPerSession: 30000, maxOutputTokensPerSession: 4000, maxTokenCostUsdPerSession: 0.05, sessionTimeoutMs: 90000},
});
