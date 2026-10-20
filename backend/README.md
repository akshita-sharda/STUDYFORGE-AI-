# StudyForge AI backend

ASHIEY is the friendly Gemini and RAG study companion. This backend supports
PDF upload, source-grounded chat, Gemini flashcards and quizzes, Concept Match
games, and XP progress.

Student accounts are included: signup, login, signed tokens, password hashing,
and saved preferences for subjects, goals, explanation style, difficulty, and
pastel theme. Uploaded documents are associated with the logged-in student.

## Run in VS Code

```powershell
cd "C:\Users\akshita sharda\Documents\ChatGPT\STUDYFORGE_AI\backend"
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Open http://127.0.0.1:8000/docs. Add `GEMINI_API_KEY` to a local `.env` or
terminal environment to enable Gemini. Without a key, the local RAG fallback
still works and shows retrieved source text.

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
4. Flashcards, quizzes, games, and XP are saved as simple database records.
