; ====================================================================
; Smart Ledger - Professional NSIS Windows Installer Script
; Produces: dist\Smart-Ledger-Setup.exe
; Architecture: 64-bit (x64) for Windows 10 and Windows 11
; ====================================================================

Unicode True
SetCompressor /SOLID lzma

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"

; --- Product Details ---
!ifdef CLIENT_EDITION
  !define PRODUCT_NAME "Smart Ledger (نسخة العميل)"
  OutFile "..\dist\Smart-Ledger-Client-Setup.exe"
!else
  !define PRODUCT_NAME "Smart Ledger"
  OutFile "..\dist\Smart-Ledger-Setup.exe"
!endif
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Smart Ledger"
!define PRODUCT_WEB_SITE "http://localhost:3000"
!define PRODUCT_DIR_REGKEY "Software\SmartLedger"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartLedger"

Name "${PRODUCT_NAME}"
InstallDir "$PROGRAMFILES64\Smart Ledger"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" "InstallLocation"
RequestExecutionLevel admin

; --- MUI Settings ---
!define MUI_ICON "..\assets\icon.ico"
!define MUI_UNICON "..\assets\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "banner.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "dialog.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "dialog.bmp"
!define MUI_ABORTWARNING

; --- Installer Wizard Pages ---
; 1. Welcome Page
!define MUI_WELCOMEPAGE_TITLE "مرحباً بك في معالج تثبيت المحاسب الذكي$\r$\nWelcome to the Smart Ledger Setup Wizard"
!define MUI_WELCOMEPAGE_TEXT "سيقوم هذا البرنامج بتثبيت نظام المحاسب الذكي (Smart Ledger) على جهازك.$\r$\n$\r$\nالنظام مصمم لإدارة الحسابات، الصناديق، والحوالات المالية بأمان محلي تام دون الحاجة لاتصال بالإنترنت أو خدمات خارجية.$\r$\n$\r$\nانقر على [التالي / Next] للبدء في خطوات التثبيت."
!insertmacro MUI_PAGE_WELCOME

; 2. License / Terms Page
!define MUI_LICENSEPAGE_TEXT_TOP "يرجى مراجعة شروط الاستخدام والأمان قبل المتابعة:"
!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_LICENSEPAGE_CHECKBOX_TEXT "أوافق على الشروط والأحكام المذكورة أعلاه"
!insertmacro MUI_PAGE_LICENSE "license.txt"

; 3. Directory Selection Page
!define MUI_DIRECTORYPAGE_TEXT_TOP "حدد المجلد الذي ترغب في تثبيت المحاسب الذكي فيه:"
!insertmacro MUI_PAGE_DIRECTORY

; 4. Installation Progress Page
!insertmacro MUI_PAGE_INSTFILES

; 5. Finish Page
!define MUI_FINISHPAGE_TITLE "اكتمل تثبيت المحاسب الذكي بنجاح$\r$\nInstallation Complete"
!define MUI_FINISHPAGE_TEXT "تم تثبيت نظام المحاسب الذكي (Smart Ledger) بنجاح على جهازك.$\r$\n$\r$\nتم إنشاء اختصار على سطح المكتب وقائمة ابدأ.$\r$\n$\r$\nيمكنك الآن تشغيل البرنامج بالنقر على [إنهاء / Finish]."
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchSmartLedger"
!define MUI_FINISHPAGE_RUN_TEXT "تشغيل المحاسب الذكي الآن (Launch Smart Ledger now)"
!define MUI_FINISHPAGE_NOREBOOTSUPPORT
!insertmacro MUI_PAGE_FINISH

Function LaunchSmartLedger
  SetOutPath "$INSTDIR"
  Exec '"$INSTDIR\SmartLedger.exe"'
FunctionEnd

; --- Uninstaller Pages ---
!define MUI_PAGE_HEADER_TEXT "إلغاء تثبيت المحاسب الذكي"
!define MUI_UNCONFIRMPAGE_TEXT_TOP "هل أنت متأكد من رغبتك في إلغاء تثبيت نظام المحاسب الذكي؟$\r$\nملاحظة: سيتم الحفاظ على قاعدة بياناتك وملفاتك المالية في مسار المستخدم بأمان."
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; --- Languages ---
!insertmacro MUI_LANGUAGE "Arabic"
!insertmacro MUI_LANGUAGE "English"

; ====================================================================
; Installation Section
; ====================================================================
Section "MainSection" SEC01
  SectionIn RO

  ; Terminate any existing Smart Ledger and Node instances before copying files
  DetailPrint "Stopping any running Smart Ledger and background processes..."
  nsExec::Exec 'cmd.exe /c "taskkill /F /IM SmartLedger.exe /T 2>nul & taskkill /F /IM node.exe /T 2>nul"'
  nsExec::Exec 'powershell.exe -NoProfile -Command "Stop-Process -Name node,SmartLedger -Force -ErrorAction SilentlyContinue"'
  nsExec::Exec 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $$_.OwningProcess -Force -ErrorAction SilentlyContinue }"'
  Sleep 2000

  SetOutPath "$INSTDIR"
  SetOverwrite try

  DetailPrint "Copying application core files..."
  File /r "..\staging\*.*"

  ; Clear stale user-space UI/server override cache while strictly preserving user data/
  RMDir /r "$LOCALAPPDATA\SmartLedger\app_dist"
  Delete "$LOCALAPPDATA\SmartLedger\server.cjs"
  Delete "$LOCALAPPDATA\SmartLedger\server.cjs.map"

  ; Grant standard Users full permissions on $INSTDIR so in-app updates never trigger UAC
  DetailPrint "Configuring folder permissions for seamless in-app updates..."
  nsExec::Exec 'icacls "$INSTDIR" /grant *S-1-5-32-545:(OI)(CI)F /T /C /Q'

!ifdef CLIENT_EDITION
  DetailPrint "Configuring client edition license..."
  FileOpen $0 "$INSTDIR\client_config.json" w
  FileWrite $0 '{"isClientEdition":true,"edition":"client","editionType":"client_edition"}'
  FileClose $0
  CreateDirectory "$INSTDIR\data"
  FileOpen $0 "$INSTDIR\data\client_config.json" w
  FileWrite $0 '{"isClientEdition":true,"edition":"client","editionType":"client_edition"}'
  FileClose $0
  CreateDirectory "$LOCALAPPDATA\SmartLedger\data"
  FileOpen $0 "$LOCALAPPDATA\SmartLedger\data\client_config.json" w
  FileWrite $0 '{"isClientEdition":true,"edition":"client","editionType":"client_edition"}'
  FileClose $0
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "Edition" "client"
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "Edition" "client"
!endif

  ; Shortcuts creation with official icon file and multi-context desktop placement
  DetailPrint "Creating Start Menu and Desktop shortcuts with official icon..."
  
  ; 1. All-Users context
  SetShellVarContext all
  CreateDirectory "$SMPROGRAMS\Smart Ledger"
  CreateShortcut "$SMPROGRAMS\Smart Ledger\Smart Ledger.lnk" "$INSTDIR\SmartLedger.exe" "" "$INSTDIR\assets\icon.ico" 0
  CreateShortcut "$SMPROGRAMS\Smart Ledger\إلغاء التثبيت (Uninstall).lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\assets\icon.ico" 0
  CreateShortcut "$DESKTOP\Smart Ledger.lnk" "$INSTDIR\SmartLedger.exe" "" "$INSTDIR\assets\icon.ico" 0

  ; 2. Current User context (ensures personal desktop visibility)
  SetShellVarContext current
  CreateDirectory "$SMPROGRAMS\Smart Ledger"
  CreateShortcut "$SMPROGRAMS\Smart Ledger\Smart Ledger.lnk" "$INSTDIR\SmartLedger.exe" "" "$INSTDIR\assets\icon.ico" 0
  CreateShortcut "$DESKTOP\Smart Ledger.lnk" "$INSTDIR\SmartLedger.exe" "" "$INSTDIR\assets\icon.ico" 0

  ; 3. OneDrive Desktop redirection check
  ${If} ${FileExists} "$PROFILE\OneDrive\Desktop"
    CreateShortcut "$PROFILE\OneDrive\Desktop\Smart Ledger.lnk" "$INSTDIR\SmartLedger.exe" "" "$INSTDIR\assets\icon.ico" 0
  ${EndIf}

  ; 4. Direct user profile desktop fallback
  ${If} ${FileExists} "$PROFILE\Desktop"
    CreateShortcut "$PROFILE\Desktop\Smart Ledger.lnk" "$INSTDIR\SmartLedger.exe" "" "$INSTDIR\assets\icon.ico" 0
  ${EndIf}

  ; 5. Force Windows Shell & Explorer to refresh and display desktop icons immediately
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
  System::Call 'shell32::SHChangeNotify(i 0x00001000, i 0x0005, t "$DESKTOP", i 0)'

  ; Create Uninstaller
  DetailPrint "Generating uninstaller..."
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Registry configuration
  DetailPrint "Registering in Windows Installed Apps (Apps & Features)..."
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "Version" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "Software\SmartLedger" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\SmartLedger" "Version" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "Software\SmartLedger" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\SmartLedger" "Version" "${PRODUCT_VERSION}"

  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "Smart Ledger - المحاسب الذكي"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "QuietUninstallString" '"$INSTDIR\Uninstall.exe" /S'
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" '"$INSTDIR\assets\icon.ico"'
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "NoRepair" 1

  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"
SectionEnd

; ====================================================================
; Uninstallation Section
; ====================================================================
Section "Uninstall"
  DetailPrint "Stopping background server..."
  nsExec::Exec 'taskkill /F /IM SmartLedger.exe /T'
  nsExec::Exec 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $$_.Name -eq ''node.exe'' -and ($$_.CommandLine -like ''*server.cjs*'' -or $$_.ExecutablePath -like ''*Smart Ledger*'' -or $$_.ExecutablePath -like ''*SmartLedger*'') } | Stop-Process -Force -ErrorAction SilentlyContinue"'
  nsExec::Exec 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $$_.OwningProcess -Force -ErrorAction SilentlyContinue }"'
  Sleep 1000

  SetShellVarContext all

  DetailPrint "Removing shortcuts..."
  SetShellVarContext all
  Delete "$DESKTOP\Smart Ledger.lnk"
  Delete "$SMPROGRAMS\Smart Ledger\Smart Ledger.lnk"
  Delete "$SMPROGRAMS\Smart Ledger\إلغاء التثبيت (Uninstall).lnk"
  RMDir "$SMPROGRAMS\Smart Ledger"

  SetShellVarContext current
  Delete "$DESKTOP\Smart Ledger.lnk"
  Delete "$SMPROGRAMS\Smart Ledger\Smart Ledger.lnk"
  Delete "$SMPROGRAMS\Smart Ledger\إلغاء التثبيت (Uninstall).lnk"
  RMDir "$SMPROGRAMS\Smart Ledger"

  ${If} ${FileExists} "$PROFILE\OneDrive\Desktop\Smart Ledger.lnk"
    Delete "$PROFILE\OneDrive\Desktop\Smart Ledger.lnk"
  ${EndIf}
  ${If} ${FileExists} "$PROFILE\Desktop\Smart Ledger.lnk"
    Delete "$PROFILE\Desktop\Smart Ledger.lnk"
  ${EndIf}

  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'

  DetailPrint "Removing application files..."
  Delete "$INSTDIR\SmartLedger.exe"
  Delete "$INSTDIR\server.cjs"
  Delete "$INSTDIR\server.cjs.map"
  Delete "$INSTDIR\stop.bat"
  Delete "$INSTDIR\Uninstall.exe"
  
  RMDir /r "$INSTDIR\dist"
  RMDir /r "$INSTDIR\assets"
  RMDir /r "$INSTDIR\runtime"
  RMDir /r "$INSTDIR\data"
  RMDir "$INSTDIR"

  DetailPrint "Removing registry entries..."
  DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
SectionEnd
