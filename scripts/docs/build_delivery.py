#!/usr/bin/env python3
"""Reproducible technical/architecture PDFs and six-slide pitch from Markdown."""
import hashlib
import html
import re
from pathlib import Path
from urllib.parse import quote
import build_guide as guide
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Frame, PageTemplate, Paragraph, Spacer, PageBreak
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderSVG

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/entrega-2026-10-28"
BRANCH = "feat/andre-pos-mvp-quality-20261028"


def architecture_map():
    drawing = Drawing(480, 315)
    for x, title, subtitle in [(0, "Interface + BFF", "Next / mesma origem"), (170, "Comandos + brains", "Nest / Invokta"), (340, "Personas", "Eve / SDK externo")]:
        guide.box(drawing, x, 260, 140, 45, title, subtitle)
    guide.box(drawing, 0, 135, 230, 62, "Aprendizagem / Python", "RAG + trilhas + comunidade + Dreamer")
    guide.box(drawing, 290, 135, 190, 62, "Recibos persistentes", "reserva / replay / expiracao")
    guide.box(drawing, 0, 15, 230, 62, "SQLite + objetos locais", "dados canonicos / volume privado")
    guide.box(drawing, 290, 15, 190, 62, "OCI Object Storage", "original + JSON / readback")
    for coordinates in [(140, 282, 170, 282), (310, 282, 340, 282), (205, 260, 115, 197), (275, 260, 385, 197), (115, 135, 115, 77), (230, 155, 290, 65)]:
        guide.arrow(drawing, *coordinates)
    directory = SOURCE / "diagrams"
    directory.mkdir(exist_ok=True)
    renderSVG.drawToFile(drawing, str(directory / "architecture.svg"))
    return drawing


def footer(c, doc):
    width, height = A4
    c.saveState()
    c.setFillColor(guide.MUTED)
    c.setFont("Atlas", 8)
    c.drawString(48, height - 30, "ATLAS 0.5 / CÓDIGO, CONTRATOS E EVIDÊNCIAS")
    c.drawString(48, 25, "NovaMente · ONE G10 · 28/10/2026 · Branch de revisão")
    c.drawRightString(width - 48, 25, str(doc.page))
    c.restoreState()


def document(source, destination, title):
    text = source.read_text()
    digest = hashlib.sha256(text.encode()).hexdigest()[:16]
    # PDF links point to this branch and the correct directory, never unmerged main.
    prefix = f"{guide.REPO}/blob/{BRANCH}/docs/entrega-2026-10-28/"
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: m[0] if m[2].startswith("https:") else f"[{m[1]}]({prefix}{quote(m[2])})", text)
    styles = guide.styles()
    styles["chapter"].pageBreakBefore = False
    styles["chapter"].spaceBefore = 18
    styles["chapter"].fontSize = 18
    styles["chapter"].leading = 24
    doc = guide.Guide(str(destination), pagesize=A4, leftMargin=48, rightMargin=48,
                      topMargin=53, bottomMargin=53, title=title, author="Equipe NovaMente Atlas",
                      subject=f"Atlas0.5; fonte SHA256 {digest}; baseline3a58543; branch {BRANCH}")
    doc.addPageTemplates([PageTemplate(id="delivery", frames=[Frame(48, 53, guide.CONTENT, guide.HEIGHT-106,
                         leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=footer)])
    story = [Spacer(1, 100), Paragraph("NOVAMENTE / ATLAS", styles["sub"]),
             Paragraph(html.escape(title), ParagraphStyle("DeliveryTitle", fontName="AtlasBold", fontSize=30, leading=38, spaceAfter=24)),
             Paragraph("Implementação 0.5, limites e próximos passos.<br/>28/10/2026 · Material técnico da branch de revisão.", styles["body"]),
             Spacer(1, 24), Paragraph(f"Baseline sincronizada: 3a58543<br/>Branch: {BRANCH}<br/>Fonte Markdown SHA256: {digest}", styles["body"]),
             Paragraph("Leia também SPEC, ENV, backlog, roadmap e parecer independente. Este PDF não comprova deploy, fornecedor real nem aprovação de produção.", styles["body"]),
             PageBreak(), Paragraph("Mapa dos módulos e processos", styles["sub"]), architecture_map(),
             Paragraph("Next apresenta e protege a fronteira. Nest registra comandos e aplica capacidades. Python contém regras de estudo e memória. Eve executa as personas. O mapa resume dependências; as respostas retornam pelas mesmas fronteiras. Cofre e master ficam no servidor.", styles["body"]),
             PageBreak()]
    story.extend(guide.parse_markdown(text, styles, {}))
    doc.build(story)
    print(f"{destination.relative_to(ROOT)}: {destination.stat().st_size} bytes")


def pitch():
    width, height = 960, 540
    path = SOURCE / "Atlas_Pitch.pdf"
    slides = re.split(r"^## \d+\. ", (SOURCE / "PITCH.md").read_text(), flags=re.M)[1:]
    c = canvas.Canvas(str(path), pagesize=(width, height))
    c.setTitle("Atlas — pitch do sistema e plano de evolução")
    c.setAuthor("Equipe NovaMente Atlas")
    for index, slide in enumerate(slides):
        title, body = slide.strip().split("\n", 1)
        dark = index % 2 == 0
        ink = colors.HexColor("#f5f1e8" if dark else "#131515")
        bg = colors.HexColor("#0c0e0f" if dark else "#f5f1e8")
        c.setFillColor(bg); c.rect(0, 0, width, height, fill=1, stroke=0)
        c.setFillColor(guide.ACCENT); c.rect(52, height-75, 48, 5, fill=1, stroke=0)
        c.setFont("AtlasBold", 11); c.drawString(118, height-76, "ATLAS / AGENTS FOR EDUCATION")
        heading = Paragraph(html.escape(title), ParagraphStyle("PitchHeading", fontName="AtlasBold", fontSize=31, leading=39, textColor=ink))
        _, size = heading.wrap(820, 140); heading.drawOn(c, 52, height-118-size)
        paragraph = Paragraph(html.escape(" ".join(body.split())), ParagraphStyle("PitchBody", fontName="Atlas", fontSize=18, leading=29, textColor=ink))
        _, size = paragraph.wrap(820, 340)
        if size > 270:
            raise ValueError(f"Pitch slide {index+1} exceeds text budget")
        paragraph.drawOn(c, 52, 292-size)
        c.setFillColor(guide.ACCENT); c.setFont("AtlasBold", 13); c.drawString(52, 38, f"{index+1:02d} / {len(slides):02d}")
        c.setFillColor(ink); c.setFont("Atlas", 9); c.drawRightString(width-52, 38, "28/10/2026 · Protótipo em validação · sem métricas de eficácia comprovadas")
        c.showPage()
    c.save()
    print(f"{path.relative_to(ROOT)}: {len(slides)} slides")


def main():
    guide.fonts()
    document(SOURCE / "GUIA_TECNICO.md", SOURCE / "Atlas_Guia_Tecnico_Codigo.pdf", "Atlas por dentro: guia técnico do código")
    document(SOURCE / "ARQUITETURA.md", SOURCE / "Atlas_Arquitetura_05.pdf", "Arquitetura do monólito modular")
    pitch()


if __name__ == "__main__":
    main()
