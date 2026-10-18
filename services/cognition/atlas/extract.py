"""Isolated PDF parser; stdout is a bounded JSON result, never executable content."""
import json
import resource
import sys
from pypdf import PdfReader

if __name__ == "__main__":
    resource.setrlimit(resource.RLIMIT_AS, (512 * 1024**2, 512 * 1024**2))
    resource.setrlimit(resource.RLIMIT_CPU, (15, 15))
    reader = PdfReader(sys.argv[1], strict=False)
    if reader.is_encrypted or len(reader.pages) > 100:
        raise ValueError("PDF protegido ou acima de 100 páginas.")
    pages, total = [], 0
    for index, page in enumerate(reader.pages):
        text = (page.extract_text() or "").replace("\x00", "")
        total += len(text)
        if total > 300_000:
            raise ValueError("Texto acima de 300 mil caracteres.")
        pages.append({"number": index + 1, "text": text})
    print(json.dumps(pages, ensure_ascii=False))
