import { defineAgent } from 'eve';
import {atlasModel} from '../../../src/connections/eve-model.js';

export default defineAgent({experimental:{workflow:{retention:0}},description:"Transformar conceitos difíceis em explicações que o estudante consegue reconstruir.",model:atlasModel,defaultTools:false,tool:false,limits:{maxInputTokensPerSession:12000,maxOutputTokensPerSession:1500,maxTokenCostUsdPerSession:0.02,sessionTimeoutMs:45000}});
