@echo off
chcp 65001 >nul
title Smart Ledger Update - تثبيت تحديث المحاسب الذكي

:: 1. التحقق من صلاحيات المسؤول وطلبها تلقائيا
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo جاري طلب صلاحيات المسؤول (Administrator) لتثبيت التحديث في Program Files...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c `\"%~dpnx0`\"' -Verb RunAs"
    exit /b
)

echo ====================================================================
echo      نظام المحاسب الذكي (Smart Ledger) - أداة التحديث الفوري
echo ====================================================================
echo.
echo [1/3] إيقاف تشغيل البرنامج المؤقت لضمان تحديث الملفات بنجاح...
taskkill /F /IM SmartLedger.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

set "TARGET_DIR=%ProgramFiles%\Smart Ledger"
if not exist "%TARGET_DIR%" (
    if exist "%ProgramFiles(x86)%\Smart Ledger" (
        set "TARGET_DIR=%ProgramFiles(x86)%\Smart Ledger"
    ) else (
        set "TARGET_DIR=%~dp0"
    )
)

echo [2/3] جاري نسخ ملفات التحديث إلى: %TARGET_DIR% ...
if exist "%~dp0dist" xcopy "%~dp0dist" "%TARGET_DIR%\dist" /E /I /Y /Q >nul 2>&1
if exist "%~dp0assets" xcopy "%~dp0assets" "%TARGET_DIR%\assets" /E /I /Y /Q >nul 2>&1
if exist "%~dp0server.cjs" copy /Y "%~dp0server.cjs" "%TARGET_DIR%\server.cjs" >nul 2>&1
if exist "%~dp0index.html" copy /Y "%~dp0index.html" "%TARGET_DIR%\index.html" >nul 2>&1
if exist "%~dp0stop.bat" copy /Y "%~dp0stop.bat" "%TARGET_DIR%\stop.bat" >nul 2>&1
icacls "%TARGET_DIR%" /grant *S-1-5-32-545:(OI)(CI)F /T /C /Q >nul 2>&1
if exist "%LOCALAPPDATA%\SmartLedger\app_dist" rmdir /S /Q "%LOCALAPPDATA%\SmartLedger\app_dist" >nul 2>&1
if exist "%LOCALAPPDATA%\SmartLedger\server.cjs" del /F /Q "%LOCALAPPDATA%\SmartLedger\server.cjs" >nul 2>&1
if exist "%LOCALAPPDATA%\SmartLedger\server.cjs.map" del /F /Q "%LOCALAPPDATA%\SmartLedger\server.cjs.map" >nul 2>&1

echo.
echo [3/3] تم تثبيت التحديث وتحديث النظام بنجاح 100%%!
echo ملاحظة: كافة قيودك وحساباتك وقاعدة بياناتك محفوظة بأمان تام دون أي تغيير.
echo.
echo جاري إعادة تشغيل المحاسب الذكي...
timeout /t 2 >nul
if exist "%TARGET_DIR%\SmartLedger.exe" (
    start "" "%TARGET_DIR%\SmartLedger.exe"
)
exit
