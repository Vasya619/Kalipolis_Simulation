@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 goto vscode
node "%~dp0src\cli.mjs" %*
exit /b %errorlevel%
:vscode
set "ELECTRON_RUN_AS_NODE=1"
set "KALIPOLIS_RUNTIME=%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"
if not exist "%KALIPOLIS_RUNTIME%" (
  echo Node.js 20+ or VS Code is required.
  exit /b 1
)
"%KALIPOLIS_RUNTIME%" "%~dp0src\cli.mjs" %*
exit /b %errorlevel%
