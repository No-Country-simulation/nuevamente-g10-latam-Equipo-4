export function boundedInteger(name:string,fallback:number,min:number,max:number):number {
  const value=process.env[name];
  if(value===undefined||value==='')return fallback;
  const parsed=Number(value);
  if(!Number.isInteger(parsed)||parsed<min||parsed>max)throw new Error(`Configuração inválida: ${name}.`);
  return parsed;
}
