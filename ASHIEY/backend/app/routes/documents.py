from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.services.document_loader import extract_pdf_text

router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)) -> dict:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    document_id = str(uuid4())
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    path = upload_dir / f"{document_id}.pdf"
    path.write_bytes(await file.read())

    pages = extract_pdf_text(path)
    return {
        "document_id": document_id,
        "filename": file.filename,
        "pages": len(pages),
        "message": "Document uploaded and text extracted.",
    }
