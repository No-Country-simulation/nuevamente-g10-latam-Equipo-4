import { defineAgent } from 'eve';
import {atlasModel} from '../src/connections/eve-model.js';

export default defineAgent({experimental:{workflow:{retention:0}},
  model: atlasModel,
  defaultTools: false,
  tool: false,
  limits: {maxInputTokensPerSession: 30000, maxOutputTokensPerSession: 4000, maxTokenCostUsdPerSession: 0.05, sessionTimeoutMs: 90000},
});
