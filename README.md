# StudyForge AI

## Start everything at once on Windows

Double-click `START-STUDYFORGE.cmd`. It starts the API and website, waits until
both are ready, and opens StudyForge at http://127.0.0.1:3000.

Double-click `STOP-STUDYFORGE.cmd` when you are finished.

## Run from VS Code

Open this repository root in VS Code (the folder containing this README).
Press `Ctrl+Shift+B` and select **Start StudyForge AI**. The task starts the
backend and website and opens the browser. To stop them, choose **Terminal >
Run Task > Stop StudyForge AI**. You do not need to activate a Python environment
or type a folder path in the terminal.

From the VS Code PowerShell terminal, run these commands from this repository
(not from an older `B:\STUDYFORGE_AI` copy):

```powershell
cd "C:\Users\akshita sharda\Documents\ChatGPT\STUDYFORGE_AI"
.\START-STUDYFORGE.cmd
```

## Run in two VS Code terminals

Terminal 1 starts the API:

```powershell
cd "C:\Users\akshita sharda\Documents\ChatGPT\STUDYFORGE_AI\backend"
py -m uvicorn app.main:app --reload --port 8000
```

Terminal 2 starts the website:

```powershell
cd "C:\Users\akshita sharda\Documents\ChatGPT\STUDYFORGE_AI\frontend"
npm.cmd run dev -- --port 3000
```
