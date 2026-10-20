import { defineAgent } from 'eve';
const model = process.env.EVE_MODEL;
if (!model) throw new Error('Configure EVE_MODEL explicitamente antes de construir/iniciar o runtime.');
export default defineAgent({modelContextWindowTokens:process.env.EVE_MODEL_CONTEXT_WINDOW?Number(process.env.EVE_MODEL_CONTEXT_WINDOW):undefined,experimental:{workflow:{retention:0}},description:'Coach acolhedor; recomende próximos passos sem pressão, diagnóstico ou recompensa por tempo de tela.',model:model,defaultTools:false,tool:false,limits:{maxInputTokensPerSession:12000,maxOutputTokensPerSession:1500,maxTokenCostUsdPerSession:0.02,sessionTimeoutMs:45000}});
