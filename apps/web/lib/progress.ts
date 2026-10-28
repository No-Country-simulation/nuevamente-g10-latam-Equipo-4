import type {Progress} from '@atlas/contracts';

/** Presentation defaults only; level thresholds and percentages come from Python. */
export function progressDisplay(progress?:Progress){
  if(!progress)return {level:1,xp:0,percent:0};
  return {level:progress.level,xp:progress.xp,percent:progress.level_percent};
}
