# Study tools

- **Subject Library:** create CS subjects, upload PDFs, assign existing notes, filter or search the library, download originals, and choose notes for chat, flashcards and quizzes.
- **Study modes:** Explain simply, Give a hint, Debug my code, and Practise viva. The chosen mode is included in the AI request; actual answers still depend on Gemini availability. Debug mode reviews code; it does not execute it.
- **Code display:** fenced code blocks have lightweight syntax colouring and a Copy code button. If clipboard access is blocked, the code remains selectable for manual copying. Response content is rendered as text, never raw HTML.
- **Saved conversations:** successful exchanges are saved to the local server under the signed-in account, including sources, selected document and study mode. Use the saved-chat selector to resume after reload. Failed saves display a retry control. New conversation starts a fresh thread; Delete chat removes the selected thread after confirmation.
- **Revision Tracker:** add a topic under a subject and set Learning, Needs revision, or Confident. Counts and filters reflect your self-assessments. These are not automatically inferred mastery scores.

Library organisation, revision topics, planner tasks and saved chats remain on this StudyForge server. With a document selected, Gemini receives the complete PDF, question, recent conversation history, selected study mode and supporting excerpts. This full-document transfer was approved by the project owner. The saved student profile and revision records are not automatically added to AI prompts.

## Personal assistant and full-document reading

Upload study material directly in Ashiey, choose Solve step by step or Plan my study, and ask about the material. PDFs can include scanned pages, tables and diagrams. Limits: 20 MB and 200 pages per file; split longer books into chapters. Poor-quality or illegible scans may still need clarification. Responses can include page references and distinguish document facts from additional CS knowledge. Long papers are solved in batches, not guaranteed in one response. Gemini availability and quotas still apply.

My Planner stores assignments, revision, exams and pending questions with optional due dates. Tasks can be edited, completed, reopened or deleted. Save question for later stores a short question locally without sending it to AI. Planner dates do not trigger notifications. Conversations remain saved separately for continuing prior work.

The animation button has been removed. System reduced-motion preferences are still respected.

## Checks

Backend: from `backend`, run `.\.venv\Scripts\python.exe -m pytest tests -q --basetemp .pytest-tmp-features`.

Frontend: from `frontend`, run `npm.cmd run build`.

Browser workflow: `node check-study.cjs` from `frontend` (requires a local Playwright installation and Microsoft Edge). The browser script intercepts every API call and does not create a real account, save to the live database or call Gemini. It tests library, revision, saved-chat, code-copy and mobile-layout flows. Screenshots are saved in the ignored `ASHIEY/data` directory.
