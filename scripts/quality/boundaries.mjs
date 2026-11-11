import {dirname,join,normalize} from 'node:path';

export function importSpecifiers(ts,source,path){
  const tree=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true);
  const imports=[];
  function record(node,kind,typeOnly=false){
    if(node&&ts.isStringLiteralLike(node))imports.push({specifier:node.text,kind,typeOnly});
  }
  function visit(node){
    if(ts.isImportDeclaration(node))record(node.moduleSpecifier,'static',Boolean(node.importClause?.isTypeOnly));
    if(ts.isExportDeclaration(node))record(node.moduleSpecifier,'static',Boolean(node.isTypeOnly));
    if(ts.isImportEqualsDeclaration(node)&&ts.isExternalModuleReference(node.moduleReference))record(node.moduleReference.expression,'require');
    if(ts.isCallExpression(node)){
      if(node.expression.kind===ts.SyntaxKind.ImportKeyword)record(node.arguments[0],'dynamic');
      if(ts.isIdentifier(node.expression)&&node.expression.text==='require')record(node.arguments[0],'require');
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);return imports;
}
export function boundaryViolations(ts,path,source){
  const browser=path.startsWith('integrations/chatgpt-desktop/renderer/')||path.startsWith('apps/web/components/')||path.startsWith('apps/web/lib/')&&!path.startsWith('apps/web/lib/server/');
  if(!browser)return [];
  return importSpecifiers(ts,source,path).filter(({specifier,typeOnly})=>{
    if(specifier==='@siwc/local'&&typeOnly)return false;
    if(/^(?:node:|eve(?:\/|$)|electron(?:\/|$)|@siwc\/local(?:\/|$)|@invokta\/|@ai-sdk\/|@nestjs\/|@\/lib\/server(?:\/|$))/.test(specifier))return true;
    const local=specifier.startsWith('.')?normalize(join(dirname(path),specifier)):specifier;
    return /^(apps\/api\/|services\/cognition\/|apps\/web\/lib\/server\/|integrations\/chatgpt-desktop\/src\/)/.test(local);
  }).map(entry=>({file:path,...entry}));
}
