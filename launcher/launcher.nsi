; ====================================================================
; Smart Ledger - Silent Windows App Launcher
; Built with NSIS: Produces SmartLedger.exe
; ====================================================================

Unicode True
SetCompressor /SOLID lzma
RequestExecutionLevel user

Name "Smart Ledger"
Caption "Smart Ledger - المحاسب الذكي"
OutFile "..\SmartLedger.exe"
Icon "..\assets\icon.ico"
SilentInstall silent
AutoCloseWindow true
ShowInstDetails nevershow

!include "FileFunc.nsh"
!include "LogicLib.nsh"

Function .onInit
  InitPluginsDir
FunctionEnd

Section ""
  SetOutPath "$EXEDIR"

  ; 1. Check for command line parameters (e.g. --stop)
  ${GetParameters} $R0
  ${GetOptions} $R0 "--stop" $R1
  ${IfNot} ${Errors}
    ; Terminate background node.exe and exit immediately
    nsExec::Exec 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $$_.Name -eq ''node.exe'' -and ($$_.CommandLine -like ''*server.cjs*'' -or $$_.ExecutablePath -like ''*Smart Ledger*'' -or $$_.ExecutablePath -like ''*SmartLedger*'') } | Stop-Process -Force -ErrorAction SilentlyContinue"'
    Quit
  ${EndIf}

  ; 2. Terminate any previous / zombie node.exe instances to prevent port 3000 conflicts
  nsExec::Exec 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $$_.Name -eq ''node.exe'' -and ($$_.CommandLine -like ''*server.cjs*'' -or $$_.ExecutablePath -like ''*Smart Ledger*'' -or $$_.ExecutablePath -like ''*SmartLedger*'') } | Stop-Process -Force -ErrorAction SilentlyContinue"'

  ; Locate portable node.exe (checks $EXEDIR\runtime\node.exe then $EXEDIR\node.exe)
  StrCpy $1 "$EXEDIR\runtime\node.exe"
  ${IfNot} ${FileExists} "$1"
    StrCpy $1 "$EXEDIR\node.exe"
  ${EndIf}

  ; Locate server script (checks $EXEDIR\dist\server.cjs then $EXEDIR\server.cjs)
  StrCpy $2 "$EXEDIR\dist\server.cjs"
  ${IfNot} ${FileExists} "$2"
    StrCpy $2 "$EXEDIR\server.cjs"
  ${EndIf}

  ; Check if Node runtime exists
  ${If} ${FileExists} "$1"
    ; Launch node.exe server silently in background with SW_HIDE
    ExecShell "open" "$1" '"$2"' SW_HIDE
  ${Else}
    ; If runtime is missing, check if setup installer exists to assist the user
    ${If} ${FileExists} "$EXEDIR\Smart-Ledger-Setup.exe"
      MessageBox MB_YESNO|MB_ICONQUESTION "محرك التشغيل غير مكتمل في هذا المجلد.$\r$\n$\r$\nهل ترغب في تشغيل معالج التثبيت (Smart-Ledger-Setup.exe) لتثبيت البرنامج بالكامل؟" IDYES run_setup IDNO exit_app
      run_setup:
        ExecShell "open" "$EXEDIR\Smart-Ledger-Setup.exe"
      exit_app:
    ${Else}
      MessageBox MB_OK|MB_ICONEXCLAMATION "تنبيه: محرك تشغيل البرنامج (runtime\node.exe) غير موجود.$\r$\nيرجى تشغيل معالج التثبيت Smart-Ledger-Setup.exe."
    ${EndIf}
    Abort
  ${EndIf}

  ; Allow node server to initialize and bind port 3000
  Sleep 1200

  ; Target local URL
  StrCpy $3 "http://127.0.0.1:3000"

  ; Launch in standalone app window using Microsoft Edge (--app=http://127.0.0.1:3000)
  ; with fallbacks to Chrome, Brave, or system default browser
  ${If} ${FileExists} "$PROGRAMFILES (x86)\Microsoft\Edge\Application\msedge.exe"
    Exec '"$PROGRAMFILES (x86)\Microsoft\Edge\Application\msedge.exe" --app=$3 --start-maximized'
  ${ElseIf} ${FileExists} "$PROGRAMFILES\Microsoft\Edge\Application\msedge.exe"
    Exec '"$PROGRAMFILES\Microsoft\Edge\Application\msedge.exe" --app=$3 --start-maximized'
  ${ElseIf} ${FileExists} "$LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
    Exec '"$LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe" --app=$3 --start-maximized'
  ${ElseIf} ${FileExists} "$PROGRAMFILES\Google\Chrome\Application\chrome.exe"
    Exec '"$PROGRAMFILES\Google\Chrome\Application\chrome.exe" --app=$3 --start-maximized'
  ${ElseIf} ${FileExists} "$PROGRAMFILES (x86)\Google\Chrome\Application\chrome.exe"
    Exec '"$PROGRAMFILES (x86)\Google\Chrome\Application\chrome.exe" --app=$3 --start-maximized'
  ${ElseIf} ${FileExists} "$LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    Exec '"$LOCALAPPDATA\Google\Chrome\Application\chrome.exe" --app=$3 --start-maximized'
  ${ElseIf} ${FileExists} "$PROGRAMFILES\BraveSoftware\Brave-Browser\Application\brave.exe"
    Exec '"$PROGRAMFILES\BraveSoftware\Brave-Browser\Application\brave.exe" --app=$3 --start-maximized'
  ${Else}
    ExecShell "open" "$3"
  ${EndIf}

SectionEnd
