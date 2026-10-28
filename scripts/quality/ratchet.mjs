/** Anchor existing symbols first. A copied hotspot cannot borrow its old budget. */
export function matchBaseline(current,baseline){
  const matches=new Map(),used=new Set();
  for(const item of current){
    const previous=baseline.find(value=>value.file===item.file&&value.name===item.name);
    if(previous&&!used.has(previous)){matches.set(item,previous);used.add(previous);}
  }
  for(const item of current){
    if(matches.has(item))continue;
    const candidates=baseline.filter(value=>!used.has(value)&&value.fingerprint===item.fingerprint);
    if(candidates.length===1){matches.set(item,candidates[0]);used.add(candidates[0]);}
  }
  return matches;
}
