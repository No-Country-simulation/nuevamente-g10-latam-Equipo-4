import {defineConfig} from '@trigger.dev/sdk';
const project=process.env.TRIGGER_PROJECT_REF;
if(!project)throw new Error('Configure TRIGGER_PROJECT_REF do seu projeto Trigger.dev.');
export default defineConfig({project,runtime:'node',dirs:['./tasks'],maxDuration:1200});
