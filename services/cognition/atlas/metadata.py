"""Conservative learning metadata. Terms come from evidence; time is an estimate."""
import math
import re

def learning_metadata(request, package, citations):
    terms=[]
    for citation in citations:
        text=citation['excerpt']
        candidates=re.findall(r'(?m)^#{1,6}\s+([^\n]{2,80})',text)+re.findall(r'\b[A-Z][A-Z0-9-]{1,14}\b',text)
        for term in candidates:
            term=term.strip()
            if term not in terms: terms.append(term)
    words=len(re.findall(r'\S+',package['conteudo_adaptado']['introducao_contextualizada']+' '+' '.join(item.get('body','')+' '+item.get('back','') for item in package['conteudo_adaptado']['itens'])))
    practice=len(package['conteudo_adaptado']['itens'])*(1 if request.format=='quiz' else .5 if request.format=='flashcards' else 0)
    return {'perfil_aplicado':request.profile,'formato_gerado':request.format,'tempo_estimado_estudo_minutos':max(1,math.ceil(words/180+practice)),'estimativa_metodo':'heuristica_leitura_180_palavras_minuto_e_pratica_v1','conceitos_chave':terms[:8],'conceitos_origem':'titulos_e_siglas_das_passagens_citadas','pre_requisitos':[],'pre_requisitos_status':'nao_inferidos'}
