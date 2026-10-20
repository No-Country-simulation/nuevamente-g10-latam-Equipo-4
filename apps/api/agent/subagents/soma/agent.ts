import { defineAgent } from 'eve';
const model = process.env.EVE_MODEL;
if (!model) throw new Error('Configure EVE_MODEL explicitamente antes de construir/iniciar o runtime.');
export default defineAgent({description:'Coach acolhedor; recomende próximos passos sem pressão, diagnóstico ou recompensa por tempo de tela.',model:model,defaultTools:false,limits:{maxInputTokensPerSession:12000,maxOutputTokensPerSession:1500,maxTokenCostUsdPerSession:0.02,sessionTimeoutMs:45000}});
