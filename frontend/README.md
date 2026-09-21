# StudyForge AI frontend

## Where the code lives

- `app/page.tsx` is the app controller: it keeps the signed-in student state,
  calls the backend, and chooses which screen to show.
- `app/screens.tsx` contains the landing page, setup form, dashboard, tutor,
  flashcards, quiz, practice, and progress screens.
- `app/globals.css` loads the base styles, `app/rebuild.css` holds the main
  layout, and `app/brown-overrides.css` plus `app/chat-polish.css` refine the
  brown theme and chat.
- `app/layout.tsx` is the shared page wrapper; `backend/app/main.py` contains
  the API and study logic.

In short: a student clicks a screen in `screens.tsx` → `page.tsx` handles the
action and sends a request → `main.py` returns data → the screen displays it.

## Run in VS Code

```powershell
cd B:\STUDYFORGE_AI\frontend
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000 while the backend is running on port 8000.
