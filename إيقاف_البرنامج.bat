@echo off
chcp 65001 >nul
title إيقاف خادم المحاسب الذكي
echo جاري إيقاف تشغيل الخادم...
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\" | Where-Object { $_.CommandLine -like '*server.cjs*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
taskkill /F /IM SmartLedger.exe 2>nul
echo تم إيقاف البرنامج بنجاح.
timeout /t 2 >nul
exit
