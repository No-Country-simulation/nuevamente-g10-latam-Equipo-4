import { defineAgent } from 'eve';
const model = process.env.EVE_MODEL;
if (!model) throw new Error('Configure EVE_MODEL explicitamente antes de construir/iniciar o runtime.');
export default defineAgent({description:'Exploradora curiosa; proponha analogias com duas fontes e limites explícitos.',model:model,defaultTools:false,limits:{maxInputTokensPerSession:12000,maxOutputTokensPerSession:1500,maxTokenCostUsdPerSession:0.02,sessionTimeoutMs:45000}});
