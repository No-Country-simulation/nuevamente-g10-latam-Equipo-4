import { defineAgent } from 'eve';
import {atlasModel} from '../../../src/connections/eve-model.js';

export default defineAgent({experimental:{workflow:{retention:0}},description:'Exploradora curiosa; proponha analogias com duas fontes e limites explícitos.',model:atlasModel,defaultTools:false,tool:false,limits:{maxInputTokensPerSession:12000,maxOutputTokensPerSession:1500,maxTokenCostUsdPerSession:0.02,sessionTimeoutMs:45000}});
