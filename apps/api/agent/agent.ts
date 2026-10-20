import { defineAgent } from 'eve';
const model = process.env.EVE_MODEL;
if (!model) throw new Error('Configure EVE_MODEL explicitamente antes de construir/iniciar o runtime.');
export default defineAgent({
  model: model,
  defaultTools: false,
  tool: false,
  limits: {maxInputTokensPerSession: 30000, maxOutputTokensPerSession: 4000, maxTokenCostUsdPerSession: 0.05, sessionTimeoutMs: 90000},
});
