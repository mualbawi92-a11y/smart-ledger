@echo off
title Smart Ledger - Stop Server
cd /d "%~dp0"
echo ====================================================================
echo             Smart Ledger - Stopping Background Server
echo ====================================================================
echo.
echo [*] Terminating Node.js and freeing port 3000...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*server.cjs*' } | Stop-Process -Force; Stop-Process -Name node -ErrorAction SilentlyContinue; Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [OK] Background server stopped successfully and port 3000 is free.
timeout /t 2 >nul
exit /b 0
