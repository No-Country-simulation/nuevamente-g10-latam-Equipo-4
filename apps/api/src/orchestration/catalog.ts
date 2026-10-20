import {createRequire} from 'node:module';
export interface Persona {id:string;name:string;role:string;persona:string;purpose:string;description:string;color:string;instruction:string}
const catalog=createRequire(import.meta.url)('@atlas/contracts/agents.json') as {version:string;agents:Persona[]};
export const catalogVersion=catalog.version;
export const personas=Object.freeze(catalog.agents.map(agent=>Object.freeze(agent)));
export function persona(id:string) {const found=personas.find(agent=>agent.id===id);if(!found)throw new Error('Persona desconhecida.');return found;}
