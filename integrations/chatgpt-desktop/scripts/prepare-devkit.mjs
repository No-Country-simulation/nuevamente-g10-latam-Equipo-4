import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const directory=fileURLToPath(new URL('../devkit/',import.meta.url));
const patch=fileURLToPath(new URL('../patches/bounded-responses.patch',import.meta.url));
const pin='0a36fefeb913055c8c7a1a29b63d82b96b2e841a';
const git=(...args)=>execFileSync('git',['-C',directory,...args],{encoding:'utf8',stdio:['pipe','pipe','pipe']});
if(git('rev-parse','HEAD').trim()!==pin)throw new Error('DevKit revision differs from the reviewed pin. Initialize the pinned submodule.');
const expected=readFileSync(patch,'utf8');
let actual=git('diff','--binary','--no-ext-diff','HEAD');
if(!actual&&!process.argv.includes('--check')){
  git('apply','--check',patch);git('apply',patch);
  actual=git('diff','--binary','--no-ext-diff','HEAD');
}
if(actual!==expected)throw new Error('DevKit changes differ from the approved bounded JSON patch. No build is allowed.');
if(git('ls-files','--others','--exclude-standard').trim())throw new Error('Unreviewed files in DevKit.');
console.log(`DevKit pin and bounded JSON patch verified: ${pin}`);
