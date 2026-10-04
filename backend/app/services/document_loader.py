from pathlib import Path

import fitz


def extract_pdf_text(path: Path) -> list[dict[str, str | int]]:
    """Extract page-level text so later RAG answers can cite page numbers."""
    with fitz.open(path) as document:
        return [
            {"page": page_number, "text": page.get_text("text").strip()}
            for page_number, page in enumerate(document, start=1)
        ]
