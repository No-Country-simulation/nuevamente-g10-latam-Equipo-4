#!/usr/bin/env python3
"""Build the team's beginner guide and reusable SVG diagrams. No application imports."""
from __future__ import annotations

import html
import re
import subprocess
import textwrap
from pathlib import Path
from urllib.parse import quote

from reportlab.graphics import renderSVG
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Preformatted, Flowable,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/GUIA_ARQUITETURA.md'
DEST = ROOT / 'docs/NovaMente_Atlas_Guia_Arquitetura_Iniciantes.pdf'
REPO = 'https://github.com/Oracle-hackatom-g10-team-4/Nova-mente-Solution'
WIDTH, HEIGHT = A4
MARGIN = 48
CONTENT = WIDTH - MARGIN * 2
INK = colors.HexColor('#18232d')
MUTED = colors.HexColor('#53626d')
ACCENT = colors.HexColor('#d7442d')
PAPER = colors.HexColor('#f2f4f6')
BORDER = colors.HexColor('#d9e0e5')


def fonts():
    base = Path('/usr/share/fonts/truetype/dejavu')
    names = {'Atlas': 'DejaVuSans.ttf', 'AtlasBold': 'DejaVuSans-Bold.ttf',
             'AtlasItalic': 'DejaVuSans-Oblique.ttf', 'AtlasMono': 'DejaVuSansMono.ttf'}
    for name, filename in names.items():
        if not (base / filename).exists():
            raise SystemExit('Fontes ausentes: instale fonts-dejavu-core antes de gerar o PDF.')
        pdfmetrics.registerFont(TTFont(name, str(base / filename)))
    pdfmetrics.registerFontFamily('Atlas', normal='Atlas', bold='AtlasBold', italic='AtlasItalic', boldItalic='AtlasBold')


def arrow(d, x1, y1, x2, y2, color=ACCENT):
    from math import atan2, cos, sin, pi
    d.add(Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=1.2))
    angle = atan2(y2-y1, x2-x1)
    tip = [x2, y2]
    for offset in [-pi/6, pi/6]:
        tip.extend([x2-6*cos(angle+offset), y2-6*sin(angle+offset)])
    d.add(Polygon(tip, fillColor=color, strokeColor=color))


def box(d, x, y, w, h, title, sub='', fill=PAPER):
    d.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=fill, strokeColor=BORDER, strokeWidth=.7))
    d.add(String(x+w/2, y+h/2+(6 if sub else -3), title, fontName='Helvetica-Bold', fontSize=10, fillColor=INK, textAnchor='middle'))
    if sub:
        d.add(String(x+w/2, y+h/2-11, sub, fontName='Helvetica', fontSize=8.8, fillColor=MUTED, textAnchor='middle'))


def diagrams():
    architecture = Drawing(480, 295)
    box(architecture, 0, 232, 145, 54, 'Interface', 'Next / navegador')
    box(architecture, 167, 232, 145, 54, 'Proxy server-side', 'mesmo Next / porta 3000')
    box(architecture, 334, 232, 146, 54, 'API Nest', 'porta 4000')
    arrow(architecture, 145, 259, 167, 259)
    arrow(architecture, 312, 259, 334, 259)
    box(architecture, 245, 128, 235, 62, '5 brains + 3 Action Engines', 'Factory + Invokta / TypeSafe / Firecrawl')
    arrow(architecture, 407, 232, 407, 190)
    box(architecture, 0, 128, 185, 62, 'Python / porta 8000', 'RAG + materiais + Dreamer')
    arrow(architecture, 245, 159, 185, 159)
    box(architecture, 0, 17, 185, 62, 'Persistência', 'SQLite + objetos / local ou OCI')
    arrow(architecture, 92, 128, 92, 79)
    box(architecture, 245, 17, 235, 62, 'Eve / porta 2000', 'Sessoes + especialistas / LLM externo')
    arrow(architecture, 363, 128, 363, 79)
    architecture.add(Line(185, 148, 217, 148, strokeColor=ACCENT))
    architecture.add(Line(217, 148, 217, 48, strokeColor=ACCENT))
    arrow(architecture, 217, 48, 245, 48)

    generation = Drawing(480, 340)
    positions = [43, 140, 237, 334, 437]
    for x, name in zip(positions, ['UI / proxy', 'Brain', 'Invokta', 'Python', 'Factory / Eve']):
        box(generation, x-42, 305, 84, 32, name)
        generation.add(Line(x, 296, x, 10, strokeColor=BORDER, strokeDashArray=[3, 3]))
    steps = [(0, 1, '1. Objetivo/fontes'), (1, 2, '2. Ler contexto'), (2, 3, '3. Fontes/memoria'),
             (3, 2, '4. Referencias'), (2, 1, '5. Decidir RAG'), (1, 2, '6. Enviar decisao'), (2, 3, '7. RAG/evidencias'),
             (3, 4, '8. Contexto/times'), (4, 3, '9. Sintese'),
             (3, 0, '10. Citacoes + judge + persistencia; resposta pela API e proxy')]
    for i, (a, b, label) in enumerate(steps):
        y = 277-i*29
        arrow(generation, positions[a], y, positions[b], y)
        generation.add(String((positions[a]+positions[b])/2, y+7, label, fontName='Helvetica', fontSize=8.0, textAnchor='middle', fillColor=INK))

    dreamer = Drawing(480, 337)
    labels = ['1. Consentimento explícito', '2. Consolidar tres mundos registrados', '3. Eve propoe politica de exploracao',
              '4. Simular historico sem novas chamadas', '5. Gate: suporte + melhoria sem regressão',
              '6. Promover ou preservar baseline', '7. Aplicar / rollback / excluir']
    for i, label in enumerate(labels):
        y = 300-i*46
        box(dreamer, 0, y, 307, 34, label)
        if i < len(labels)-1:
            arrow(dreamer, 154, y, 154, y-12)
    box(dreamer, 330, 212, 150, 90, 'Sem provedores', 'aguarda avaliação')
    for i, text in enumerate(['Não altera código,', 'pesos, segurança', 'ou permissões.', '', 'Coletivo exige', 'outro consentimento', 'e implementação.']):
        dreamer.add(String(335, 179-i*16, text, fontName='Helvetica', fontSize=10, fillColor=MUTED))
    return {'architecture': architecture, 'generation': generation, 'dreamer': dreamer}


def inline(text):
    pattern = r'`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|(https?://[^\s]+)'
    out, last = [], 0
    for match in re.finditer(pattern, text):
        out.append(html.escape(text[last:match.start()]))
        code, bold, label, target, url = match.groups()
        if code is not None:
            out.append(f'<font name="AtlasMono" size="8.8">{html.escape(code)}</font>')
        elif bold is not None:
            out.append(f'<b>{html.escape(bold)}</b>')
        else:
            address = target or url
            trailing = ''
            if url:
                cleaned = address.rstrip('.,;')
                trailing = address[len(cleaned):]
                address = cleaned
            if not address.startswith(('https://', 'http://')):
                address = REPO + '/blob/main/docs/' + quote(address)
            caption = label or (url[:-len(trailing)] if trailing else url)
            out.append(f'<link href="{html.escape(address, quote=True)}" color="#b43828">{html.escape(caption)}</link>{html.escape(trailing)}')
        last = match.end()
    out.append(html.escape(text[last:]))
    return ''.join(out)


def styles():
    return {
        'body': ParagraphStyle('Body', fontName='Atlas', fontSize=10.4, leading=15.4, textColor=INK, spaceAfter=9, splitLongWords=True),
        'chapter': ParagraphStyle('Chapter', fontName='AtlasBold', fontSize=21, leading=27, textColor=INK, spaceAfter=17, pageBreakBefore=True, keepWithNext=True),
        'sub': ParagraphStyle('Sub', fontName='AtlasBold', fontSize=12, leading=17, textColor=INK, spaceBefore=12, spaceAfter=7, keepWithNext=True),
        'list': ParagraphStyle('List', fontName='Atlas', fontSize=10.4, leading=15.4, textColor=INK, leftIndent=16, firstLineIndent=-16, spaceAfter=7),
        'cell': ParagraphStyle('Cell', fontName='Atlas', fontSize=9, leading=12.5, textColor=INK, splitLongWords=True),
        'th': ParagraphStyle('TH', fontName='AtlasBold', fontSize=9.1, leading=12.5, textColor=colors.white),
        'code': ParagraphStyle('Code', fontName='AtlasMono', fontSize=8.8, leading=12.5, textColor=INK),
        'caption': ParagraphStyle('Caption', fontName='AtlasItalic', fontSize=9, leading=13, textColor=MUTED, spaceAfter=12),
        'toc': ParagraphStyle('Toc', fontName='Atlas', fontSize=9.7, leading=13.5, spaceBefore=4, textColor=INK, rightIndent=20),
    }


class Cover(Flowable):
    def __init__(self):
        super().__init__()
        self.width = CONTENT
        self.height = 700

    def draw(self):
        c = self.canv
        c.setFillColor(colors.HexColor('#ff694f'))
        c.setFont('AtlasBold', 12)
        c.drawString(0, 663, 'NOVAMENTE / ATLAS')
        c.setFillColor(colors.white)
        c.setFont('AtlasBold', 38)
        c.drawString(0, 540, 'Guia de')
        c.drawString(0, 491, 'arquitetura')
        c.setFillColor(colors.HexColor('#ff927e'))
        c.setFont('Atlas', 17)
        c.drawString(0, 444, 'Para quem está começando')
        body = Paragraph('Do primeiro comando à primeira contribuição.<br/>Entenda os serviços, os brains, as Action Engines<br/>e o Dreamer com percursos guiados e exercícios.',
                         ParagraphStyle('CoverBody', fontName='Atlas', fontSize=12, leading=20, textColor=colors.HexColor('#d1d8dd')))
        body.wrap(CONTENT, 200)
        body.drawOn(c, 0, 329)
        c.setStrokeColor(colors.HexColor('#39464e'))
        c.line(0, 290, CONTENT, 290)
        c.setFont('AtlasMono', 10)
        for i, label in enumerate(['NEXT.JS + NESTJS + PYTHON', 'BRAINS + INVOKTA + EVE', 'RAG + DREAMER + ORACLE']):
            c.drawString(0, 258-i*26, label)
        c.setFillColor(colors.HexColor('#d1d8dd'))
        c.setFont('Atlas', 10)
        c.drawString(0, 108, 'Equipe ONE G10 • Edição didática 1.2 • 21/10/2026')
        c.drawString(0, 86, 'Atlas 0.3 / Times Eve + Dream-RSI / 4 GB')
        try:
            revision = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, text=True).strip()
            c.setFont('AtlasMono', 8.5)
            c.drawString(0, 58, f'Base Git consultada na geração: {revision}')
        except (OSError, subprocess.CalledProcessError):
            pass


class Guide(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'Chapter':
            title = flowable.getPlainText()
            key = flowable._chapter_key
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, level=0)
            self.notify('TOCEntry', (0, title, self.page, key))


def decoration(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(colors.HexColor('#101a21'))
        canvas.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
        canvas.setFillColor(ACCENT)
        canvas.rect(0, HEIGHT-10, WIDTH, 10, fill=1, stroke=0)
    else:
        canvas.setFillColor(MUTED)
        canvas.setFont('Atlas', 8)
        canvas.drawString(MARGIN, HEIGHT-30, 'NOVAMENTE ATLAS / GUIA DIDÁTICO')
        canvas.setStrokeColor(BORDER)
        canvas.line(MARGIN, 39, WIDTH-MARGIN, 39)
        canvas.setFont('Atlas', 8)
        canvas.drawString(MARGIN, 25, 'Equipe ONE G10 • Arquitetura e prática')
        canvas.drawRightString(WIDTH-MARGIN, 25, str(doc.page))
    canvas.restoreState()


def parse_markdown(text, st, figures):
    lines, story, paragraph = text.splitlines(), [], []
    i, chapter = 0, 0

    def flush():
        if paragraph:
            story.append(Paragraph(inline(' '.join(paragraph)), st['body']))
            paragraph.clear()

    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('## '):
            flush()
            chapter += 1
            p = Paragraph(inline(line[3:]), st['chapter'])
            p._chapter_key = f'chapter-{chapter}'
            story.append(p)
        elif not chapter:
            pass
        elif line.startswith('### '):
            flush()
            story.append(Paragraph(inline(line[4:]), st['sub']))
        elif line.startswith('```'):
            flush()
            code = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                raw = lines[i].expandtabs(4)
                if len(raw) <= 89:
                    code.append(raw)
                else:
                    code.extend(textwrap.wrap(raw, width=89, replace_whitespace=False, drop_whitespace=False, subsequent_indent='  ', break_long_words=True, break_on_hyphens=False))
                i += 1
            pre = Preformatted('\n'.join(code), st['code'])
            t = Table([[pre]], colWidths=[CONTENT], hAlign='LEFT')
            t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PAPER), ('BOX', (0, 0), (-1, -1), .5, BORDER), ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10), ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 9)]))
            story.extend([t, Spacer(1, 10)])
        elif line.startswith('|'):
            flush()
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', c) for c in cells):
                    rows.append(cells)
                i += 1
            i -= 1
            cols = len(rows[0])
            fractions = {2: [.36, .64], 3: [.27, .36, .37]}.get(cols, [1/cols]*cols)
            contents = [[Paragraph(inline(cell), st['th'] if r == 0 else st['cell']) for cell in row] for r, row in enumerate(rows)]
            table = Table(contents, colWidths=[CONTENT*f for f in fractions], repeatRows=1, hAlign='LEFT')
            table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), INK), ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PAPER]), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, 0), 1, ACCENT), ('LINEBELOW', (0, 1), (-1, -1), .35, BORDER), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
            story.extend([table, Spacer(1, 11)])
        elif re.match(r'!\[.*?\]\(', line):
            flush()
            name = Path(re.search(r'\((.*?)\)', line).group(1)).stem
            story.append(figures[name])
            caption = {'architecture': 'Interface/proxy compartilham o Next; brains e engines compartilham o Nest. Serviços opcionais exigem configuração.', 'generation': 'A resposta retorna pelas mesmas fronteiras. As setas sintetizam o fluxo; não autorizam chamada direta do browser ao Python.', 'dreamer': 'A promoção exige avaliação; ausência de provedor ou de consentimento produz espera, não uma melhoria simulada.'}[name]
            story.append(Paragraph(caption, st['caption']))
        elif line.startswith('> '):
            flush()
            note = Table([[Paragraph(inline(line[2:]), st['body'])]], colWidths=[CONTENT])
            note.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff1ed')), ('LINEBEFORE', (0, 0), (0, -1), 3, ACCENT), ('LEFTPADDING', (0, 0), (-1, -1), 12), ('RIGHTPADDING', (0, 0), (-1, -1), 10), ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
            story.extend([note, Spacer(1, 10)])
        elif re.match(r'^\d+\.\s', line) or line.startswith('- '):
            flush()
            if line.startswith('- '):
                line = '• ' + line[2:]
            story.append(Paragraph(inline(line), st['list']))
        elif not line:
            flush()
        else:
            paragraph.append(line)
        i += 1
    flush()
    return story


def main():
    fonts()
    st, figures = styles(), diagrams()
    diagram_dir = ROOT / 'docs/diagrams'
    diagram_dir.mkdir(parents=True, exist_ok=True)
    for name, figure in figures.items():
        renderSVG.drawToFile(figure, str(diagram_dir / f'{name}.svg'))
    doc = Guide(str(DEST), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=53, bottomMargin=53,
                title='NovaMente Atlas — Guia didático de arquitetura', author='Equipe NovaMente Atlas / ONE G10',
                subject='Guia para iniciantes: execução, brains, Invokta, RAG, Dreamer e contribuição', pageCompression=1)
    doc.addPageTemplates([PageTemplate(id='guide', frames=[Frame(MARGIN, 53, CONTENT, HEIGHT-106, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=decoration)])
    toc = TableOfContents()
    toc.levelStyles = [st['toc']]
    toc.dotsMinLevel = 0
    toc.tableStyle = TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),('VALIGN',(0,0),(-1,-1),'TOP')])
    title = Paragraph('Roteiro de leitura', ParagraphStyle('TocTitle', fontName='AtlasBold', fontSize=25, leading=31, textColor=INK, spaceAfter=15))
    story = [Cover(), PageBreak(), title, Paragraph('Comece pelos capítulos 03 a 05 para executar. Depois siga a trilha da sua contribuição. O sumário e os bookmarks permitem navegar diretamente aos capítulos.', st['body']), Spacer(1, 10), toc]
    story.extend(parse_markdown(SOURCE.read_text(), st, figures))
    doc.multiBuild(story, maxPasses=5)
    print(f'PDF gerado: {DEST.relative_to(ROOT)} ({DEST.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
