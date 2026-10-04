# Run ASHIEY locally

Backend (PowerShell, from ASHIEY/backend):

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env and enter your Gemini API key. Keep the key private.
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend (a second terminal, from ASHIEY/frontend):

```powershell
npm.cmd install
npm.cmd run dev -- --port 3000
```

Open http://localhost:3000, create an account, finish setup, and enter ASHIEY Room.
General chat uses Gemini. Upload a PDF from Study Worlds and select it in the chat to ask source-based questions. Without a key, PDF search returns clearly labelled excerpts, not generated AI answers.

The current conversation persists in this browser tab for the signed-in session. New conversation clears it; changing source starts a fresh conversation. Enter sends, Shift+Enter adds a line, and Stop cancels the browser request. A cancelled request may still finish on the provider.

Configuration: backend/.env supports GEMINI_API_KEY, GEMINI_MODEL, and ASHIEY_TOKEN_SECRET. Restart the backend after changes. Never commit .env. This is a local development application; other study features have not been hardened for public multi-user hosting.

Verification:
```powershell
# backend directory
.\.venv\Scripts\python.exe -m pytest tests -q
# frontend directory
npm.cmd run build
```
