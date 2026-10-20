@echo off
cd /d "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\stop-studyforge.ps1"
if errorlevel 1 pause
