@echo off
chcp 65001 >nul 2>&1
title Holiday Notice Generator

set "PORT=8899"
set "DIR=%~dp0"

echo ============================================
echo   Company Holiday Notice Generator
echo ============================================
echo.

set "PY="

rem --- 1. use bundled python (managed runtime) if available ---
set "WB_PY=C:\Users\38335\.workbuddy\binaries\python\versions\3.13.12\python.exe"
if exist "%WB_PY%" set "PY=%WB_PY%"

rem --- 2. fallback to system python ---
if not defined PY (
  where python >nul 2>&1 && set "PY=python"
)
if not defined PY (
  if exist "C:\Python314\python.exe" set "PY=C:\Python314\python.exe"
)

if not defined PY (
  echo [!] Python not found.
  echo     Opening the page directly instead - download may be blocked by the browser.
  echo.
  start "" "%DIR%index.html"
  echo.
  pause
  exit /b
)

echo [1/2] Starting local web server on port %PORT% ...
start "HolidayNoticeServer" /min cmd /c ""%PY%" -m http.server %PORT% --bind 127.0.0.1 --directory "%DIR%""

echo [2/2] Opening browser ...
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/index.html"

echo.
echo ============================================
echo   Server is running.
echo   URL: http://127.0.0.1:%PORT%/index.html
echo.
echo   - Keep this window open while using the tool.
echo   - Image download and PDF printing work normally now.
echo   - Close this window to stop the server.
echo ============================================
echo.
echo Press any key to stop the server and exit...
pause >nul

echo Stopping server ...
taskkill /fi "WindowTitle eq HolidayNoticeServer*" /f >nul 2>&1
exit /b
