#!/usr/bin/env bash
set -e

echo "===================================================================="
echo "    Smart Ledger - Official Windows Installer Builder (EXE & MSI)   "
echo "===================================================================="

# 1. Build Frontend and Bundle Server
echo "[1/4] Building production web app and server bundle..."
npm run build

# 1.5. Compile Windows Native Launcher
echo "[1.5/4] Compiling Windows Native Launcher (SmartLedger.exe)..."
if command -v makensis >/dev/null 2>&1 && [ -f "launcher/launcher.nsi" ]; then
  echo "      -> Compiling NSIS Silent Launcher..."
  cd launcher && makensis launcher.nsi && cd ..
fi

if [ ! -f "SmartLedger.exe" ] && command -v x86_64-w64-mingw32-gcc >/dev/null 2>&1; then
  echo "      -> Compiling C Win32 Launcher via MinGW-w64..."
  x86_64-w64-mingw32-windres launcher/resource.rc -O coff -o launcher/resource.res
  x86_64-w64-mingw32-gcc -O2 launcher/main.c launcher/resource.res -o SmartLedger.exe -lws2_32 -lwininet -lshell32 -ladvapi32 -mwindows
fi

# 2. Populate Staging Directory
echo "[2/4] Populating staging directory with application files..."
rm -rf staging
mkdir -p staging/runtime staging/assets staging/dist staging/data

if [ ! -f "runtime/node.exe" ]; then
  echo "Downloading standalone Windows node.exe runtime..."
  mkdir -p runtime
  curl -fsSL -o runtime/node.exe https://nodejs.org/dist/v20.18.0/win-x64/node.exe
fi

cp SmartLedger.exe staging/
cp dist/server.cjs dist/server.cjs.map staging/
cp dist/server.cjs server.cjs
cp dist/server.cjs.map server.cjs.map
cp runtime/node.exe staging/runtime/
cp runtime/node.exe staging/node.exe
cp assets/icon.ico assets/icon.png staging/assets/
cp assets/icon.ico staging/icon.ico
# Ensure frontend files exist in both root and dist folder for 100% path safety
cp -r dist/index.html dist/assets staging/dist/
cp dist/index.html staging/
cp -r dist/assets staging/
if [ -f "dist/manifest.webmanifest" ]; then
  cp dist/manifest.webmanifest staging/
  cp dist/manifest.webmanifest staging/dist/
fi
if [ -f "dist/registerSW.js" ]; then
  cp dist/registerSW.js staging/
  cp dist/registerSW.js staging/dist/
fi

# النسخ دائماً بقاعدة بيانات نظيفة وفارغة 100% دون أي حركات أو بيانات سابقة
if [ -f "data/clean_database_template.json" ]; then
  cp data/clean_database_template.json staging/data/database.json
else
  cp data/database.json staging/data/
fi
cp stop.bat staging/

# 2.5. Generate fresh Portable ZIP from staging
echo "[2.5/4] Packaging fresh Smart-Ledger-Portable.zip from staging..."
(cd staging && zip -1 -q -r ../dist/Smart-Ledger-Portable.zip .)
mkdir -p public
cp dist/Smart-Ledger-Portable.zip public/Smart-Ledger-Portable.zip 2>/dev/null || true
cp dist/Smart-Ledger-Portable.zip Smart-Ledger-Portable.zip 2>/dev/null || true
cp dist/Smart-Ledger-Portable.zip staging/dist/Smart-Ledger-Portable.zip 2>/dev/null || true


# 3. Build NSIS Windows Installer Wizard (Smart-Ledger-Setup.exe)
echo "[3/4] Building NSIS Windows Setup Wizard (Smart-Ledger-Setup.exe)..."
mkdir -p dist
if command -v makensis >/dev/null 2>&1; then
  cd installer
  makensis installer.nsi
  makensis -DCLIENT_EDITION=1 installer.nsi
  cd ..
  echo "      [OK] Smart-Ledger-Setup.exe and Smart-Ledger-Client-Setup.exe generated."
else
  echo "      [!] makensis not found, skipping EXE installer."
fi

# 4. Build WiX Windows Installer Package (Smart-Ledger-Setup.msi)
echo "[4/4] Building Windows MSI Installer (Smart-Ledger-Setup.msi)..."
python3 installer/generate_wxs.py staging installer/Product.wxs

if command -v wixl >/dev/null 2>&1; then
  wixl -v -a x64 -o dist/Smart-Ledger-Setup.msi installer/Product.wxs
  echo "      [OK] Smart-Ledger-Setup.msi generated."
else
  echo "      [!] wixl not found, skipping MSI installer."
fi

# Copy installers to root and public folders for instant access and direct download
mkdir -p public
if [ -f "dist/Smart-Ledger-Setup.exe" ]; then
  cp dist/Smart-Ledger-Setup.exe Smart-Ledger-Setup.exe
  cp dist/Smart-Ledger-Setup.exe public/Smart-Ledger-Setup.exe
  echo "      [OK] Smart-Ledger-Setup.exe copied to root and public/."
fi

if [ -f "dist/Smart-Ledger-Client-Setup.exe" ]; then
  cp dist/Smart-Ledger-Client-Setup.exe Smart-Ledger-Client-Setup.exe
  cp dist/Smart-Ledger-Client-Setup.exe public/Smart-Ledger-Client-Setup.exe
  echo "      [OK] Smart-Ledger-Client-Setup.exe copied to root and public/."
fi

if [ -f "dist/Smart-Ledger-Setup.msi" ]; then
  cp dist/Smart-Ledger-Setup.msi Smart-Ledger-Setup.msi
  cp dist/Smart-Ledger-Setup.msi public/Smart-Ledger-Setup.msi
  echo "      [OK] Smart-Ledger-Setup.msi copied to root and public/."
fi

echo ""
echo "===================================================================="
echo "                INSTALLERS GENERATED SUCCESSFULLY                   "
echo "===================================================================="
ls -lh Smart-Ledger-Setup.exe Smart-Ledger-Setup.msi dist/Smart-Ledger-Setup.exe dist/Smart-Ledger-Setup.msi 2>/dev/null || true
echo "===================================================================="
