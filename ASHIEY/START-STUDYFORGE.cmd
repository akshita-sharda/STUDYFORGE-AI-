@echo off
cd /d "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\start-studyforge.ps1"
if errorlevel 1 pause
