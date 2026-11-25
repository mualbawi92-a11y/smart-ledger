@echo off
chcp 65001 >nul
title المحاسب الذكي - Smart Ledger
cd /d "%~dp0"

echo ========================================================
echo        تشغيل نظام المحاسب الذكي - Smart Ledger
echo ========================================================
echo.

if exist "runtime\node.exe" (
    set "NODE_BIN=runtime\node.exe"
) else if exist "node.exe" (
    set "NODE_BIN=node.exe"
) else (
    echo [خطأ] لم يتم العثور على محرك node.exe داخل المجلد.
    pause
    exit /b 1
)

if exist "dist\server.cjs" (
    set "SERVER_FILE=dist\server.cjs"
) else if exist "server.cjs" (
    set "SERVER_FILE=server.cjs"
) else (
    echo [خطأ] لم يتم العثور على ملف السيرفر server.cjs.
    pause
    exit /b 1
)

echo [1/2] جاري تشغيل المحرك المحلي في الخلفية...
start /b "" "%NODE_BIN%" "%SERVER_FILE%"

echo [2/2] جاري فتح واجهة البرنامج المستقلة...
timeout /t 2 /nobreak >nul

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:3000 --start-maximized
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:3000 --start-maximized
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://127.0.0.1:3000 --start-maximized
) else if exist "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:3000 --start-maximized
) else (
    start "" "http://127.0.0.1:3000"
)

exit
