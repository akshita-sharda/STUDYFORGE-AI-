# StudyForge AI backend

ASHIEY is the friendly Gemini and RAG study companion. This backend supports
PDF upload, source-grounded chat, Gemini flashcards and quizzes, Concept Match
games, and XP progress.

Student accounts include signup, login, signed tokens, password hashing, and
saved preferences. Documents, flashcards, quizzes, and progress are scoped to
the logged-in student; study endpoints require a valid login token.

## Run in VS Code

```powershell
cd B:\STUDYFORGE_AI\backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs. Add `GEMINI_API_KEY` to `backend/.env` to
enable Gemini. Without a key, retrieval and source-based fallback study tools
still work. Set a private `ASHIEY_TOKEN_SECRET` before deployment; the built-in
default is only for local development.

Run tests with:

```powershell
.venv\Scripts\python.exe -m pytest -q
```

Runtime data is stored under `backend/data/`: uploaded PDFs in
`backend/data/uploads/` and the SQLite database in `backend/data/studyforge.db`.

## Easy explanation

1. Upload extracts PDF text and saves page-level chunks in SQLite.
2. TF-IDF and cosine similarity retrieve relevant chunks for a question.
3. ASHIEY sends those chunks to Gemini and returns citations.
4. Flashcards and quizzes are saved with their owner; quiz submissions update
   that student's XP and progress.

## Current MVP boundaries

- Retrieval uses TF-IDF and cosine similarity; it does not yet use embedding
  vectors.
- PDFs must contain selectable text. Scanned PDFs need OCR before upload.
- Uploads are limited to 20 MB and 500 pages.
- This is a college demo backend, not a production deployment: production would
  also need HTTPS, a strong secret, backups, rate limiting, and account recovery.
