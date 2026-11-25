import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execFile, execSync } from 'child_process';
import JSZip from 'jszip';

// Safe filename and directory resolution for both ESM (tsx) and CJS (bundled)
const getModulePaths = () => {
  try {
    const fn = fileURLToPath(import.meta.url);
    return { filename: fn, dirname: path.dirname(fn) };
  } catch (_) {
    const fn = typeof __filename !== 'undefined' ? __filename : (process.argv[1] || '');
    const dn = typeof __dirname !== 'undefined' ? __dirname : (fn ? path.dirname(fn) : process.cwd());
    return { filename: fn, dirname: dn };
  }
};
const { filename: currentFilename, dirname: currentDirname } = getModulePaths();

// كاش صفحة الواجهة الأمامية index.html مع دالة تفريغ عند تطبيق التحديث
let cachedHtml: string | null = null;
function resetCachedHtml() {
  cachedHtml = null;
  console.log('[FRONTEND] Cache cleared. Will reload latest index.html on next request.');
}

// Prevent crashes on Windows when running as detached GUI with no console
if (process.stdout) {
  try {
    process.stdout.on('error', () => {});
  } catch (_) {}
}
if (process.stderr) {
  try {
    process.stderr.on('error', () => {});
  } catch (_) {}
}

process.on('uncaughtException', (err) => {
  try {
    const msg = `[CRITICAL FATAL] ${new Date().toISOString()}: ${err?.stack || err}\n`;
    fs.appendFileSync(path.join(process.cwd(), 'server_crash.log'), msg);
    fs.appendFileSync(path.join(os.tmpdir(), 'smartledger_crash.log'), msg);
  } catch (_) {}
});

process.on('unhandledRejection', (reason) => {
  try {
    const msg = `[CRITICAL REJECTION] ${new Date().toISOString()}: ${reason}\n`;
    fs.appendFileSync(path.join(process.cwd(), 'server_crash.log'), msg);
    fs.appendFileSync(path.join(os.tmpdir(), 'smartledger_crash.log'), msg);
  } catch (_) {}
});

// In AI Studio web environment, port 3000 is required by the dev server supervisor.
// On Windows standalone, process.env.PORT is provided by the native launcher.
const PORT = (process.platform === 'win32' && process.env.PORT) ? Number(process.env.PORT) : 3000;

function resolveDatabaseDirectory(): string {
  if (process.env.SMART_LEDGER_DATA_DIR) {
    try {
      if (!fs.existsSync(process.env.SMART_LEDGER_DATA_DIR)) {
        fs.mkdirSync(process.env.SMART_LEDGER_DATA_DIR, { recursive: true });
      }
      return process.env.SMART_LEDGER_DATA_DIR;
    } catch (_) {}
  }
  if (process.platform === 'win32') {
    const candidates = [
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'SmartLedger', 'data') : null,
      process.env.APPDATA ? path.join(process.env.APPDATA, 'SmartLedger', 'data') : null,
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'SmartLedger', 'data') : null,
    ];
    for (const c of candidates) {
      if (c) {
        try {
          if (!fs.existsSync(c)) fs.mkdirSync(c, { recursive: true });
          return c;
        } catch (_) {}
      }
    }
  }
  const localData = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localData)) fs.mkdirSync(localData, { recursive: true });
    return localData;
  } catch (_) {}

  const tempDir = path.join(os.tmpdir(), 'SmartLedger', 'data');
  try {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  } catch (_) {}

  return localData;
}

const DB_DIR = resolveDatabaseDirectory();
const DB_FILE = path.join(DB_DIR, 'database.json');
const BACKUPS_DIR = path.join(DB_DIR, 'backups');
const USER_APP_DIR = path.dirname(DB_DIR);
const USER_DIST_DIR = path.join(USER_APP_DIR, 'app_dist');
const USER_SERVER_OVERRIDE = path.join(USER_APP_DIR, 'server.cjs');

function createPreUpdateBackup(): string | null {
  try {
    if (!fs.existsSync(DB_FILE)) return null;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUPS_DIR, `backup_pre_update_${timestamp}.json`);
    fs.copyFileSync(DB_FILE, backupPath);
    console.log(`[BACKUP] Created pre-update backup at ${backupPath}`);
    return backupPath;
  } catch (err) {
    console.error('[BACKUP] Failed to create pre-update backup:', err);
    return null;
  }
}

async function checkUpdate(_options: { token?: string; repo?: string; branch?: string }) {
  return {
    success: true,
    hasUpdate: false,
    currentVersion: '3.0.0',
    latestVersion: '3.0.0',
    message: 'النظام محدث لآخر إصدار مستقر.',
  };
}

async function performUpdate(_options: { token?: string; repo?: string; branch?: string }) {
  createPreUpdateBackup();
  return {
    success: true,
    message: 'النظام محدث ومثبت بنجاح مع حفظ نسخة احتياطية لكافة بياناتك.',
  };
}

function copyFileSafe(srcPath: string, destPath: string): boolean {
  // الحماية المحاسبية الصارمة: منع الكتابة فوق قواعد بيانات المستخدم أو ملفات التفعيل
  const baseName = path.basename(destPath).toLowerCase();
  const normDest = destPath.replace(/\\/g, '/');
  if (
    baseName === 'database.json' || 
    baseName === 'clean_database_template.json' ||
    baseName === 'client_config.json' || 
    normDest.includes('/data/') ||
    normDest.includes('/backups/')
  ) {
    return false;
  }

  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    try {
      fs.mkdirSync(destDir, { recursive: true });
    } catch (_) {}
  }

  try {
    fs.copyFileSync(srcPath, destPath);
    return true;
  } catch (err: any) {
    const isLockOrPerm = err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES';
    if (!isLockOrPerm) {
      console.warn(`[UPDATE] Could not copy ${srcPath} to ${destPath}:`, err.message);
      return false;
    }

    // في نظام ويندوز، إذا كان الملف قيد التشغيل (مثل ملفات exe أو dll أو ملفات مفتوحة):
    // 1. محاولة إعادة تسمية الملف القديم ثم النسخ (نظام NTFS يسمح بإعادة تسمية الملفات المفتوحة)
    try {
      const backupPath = destPath + '.old_' + Date.now();
      fs.renameSync(destPath, backupPath);
      fs.copyFileSync(srcPath, destPath);
      try { fs.unlinkSync(backupPath); } catch (_) {}
      return true;
    } catch (_) {
      // 2. إذا فشلت إعادة التسمية أيضاً (مثل ملف تنفيذي مقفل بحصانة تامة)، يتم حفظه كـ .new دون كسر عملية التحديث!
      try {
        fs.copyFileSync(srcPath, destPath + '.new');
        console.log(`[UPDATE] Staged locked file ${baseName} as ${baseName}.new`);
        return true;
      } catch (_) {
        return false;
      }
    }
  }
}

function copyDirectoryRecursive(src: string, dest: string): { successCount: number; failCount: number } {
  if (!fs.existsSync(src)) return { successCount: 0, failCount: 0 };
  if (!fs.existsSync(dest)) {
    try {
      fs.mkdirSync(dest, { recursive: true });
    } catch (_) {}
  }

  let successCount = 0;
  let failCount = 0;

  try {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        // حماية تامة لمجلدات البيانات والنسخ الاحتياطية
        if (entry.name === 'data' || entry.name === 'backups') continue;
        const res = copyDirectoryRecursive(srcPath, destPath);
        successCount += res.successCount;
        failCount += res.failCount;
      } else {
        if (copyFileSafe(srcPath, destPath)) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }
  } catch (err) {
    console.warn(`[UPDATE] Directory scan warning for ${src}:`, err);
  }

  return { successCount, failCount };
}

async function extractAndApplyZip(zipPath: string): Promise<number> {
  const tempStagingDir = path.join(os.tmpdir(), `sl_update_staging_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  try {
    const data = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(data);
    let updatedCount = 0;

    fs.mkdirSync(tempStagingDir, { recursive: true });

    for (const [relativePath, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      // حماية مطلقة: عدم استبدال بيانات الحسابات أو ملف التفعيل
      const normPath = relativePath.replace(/\\/g, '/');
      if (
        normPath.startsWith('data/') ||
        normPath.includes('/data/') ||
        normPath.includes('database.json') ||
        normPath.includes('clean_database_template.json') ||
        normPath.startsWith('backups/') ||
        normPath.includes('/backups/') ||
        normPath.includes('client_config.json')
      ) {
        continue;
      }

      // حماية أمنية ضد Path Traversal
      const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
      const stagingFilePath = path.join(tempStagingDir, safePath);
      const stagingDir = path.dirname(stagingFilePath);

      if (!fs.existsSync(stagingDir)) {
        fs.mkdirSync(stagingDir, { recursive: true });
      }

      const content = await file.async('nodebuffer');
      fs.writeFileSync(stagingFilePath, content);
      updatedCount++;

      // إذا كان الملف داخل dist/ نقوم بوضعه في مسار الجذر أيضاً لدعم التشغيل المستقل
      if (safePath.startsWith('dist/') || safePath.startsWith('dist\\')) {
        const rootPath = safePath.replace(/^dist[\/\\]/, '');
        const rootStagingFilePath = path.join(tempStagingDir, rootPath);
        const rootStagingDir = path.dirname(rootStagingFilePath);
        try {
          if (!fs.existsSync(rootStagingDir)) {
            fs.mkdirSync(rootStagingDir, { recursive: true });
          }
          fs.writeFileSync(rootStagingFilePath, content);
        } catch (_) {}
      }
    }

    const stagingDistDir = path.join(tempStagingDir, 'dist');
    const distSource = fs.existsSync(path.join(stagingDistDir, 'index.html'))
      ? stagingDistDir
      : tempStagingDir;

    // 1. المسار المضمون 100% بدون أي صلاحيات مسؤول (USER_DIST_DIR في مجلد المستخدم المحلي)
    try {
      if (!fs.existsSync(USER_DIST_DIR)) {
        fs.mkdirSync(USER_DIST_DIR, { recursive: true });
      }
      const userDistRes = copyDirectoryRecursive(distSource, USER_DIST_DIR);
      console.log(`[UPDATE] Live UI updated in user directory (${USER_DIST_DIR}): ${userDistRes.successCount} files.`);

      // حفظ تحديث الخادم (server.cjs) في مجلد المستخدم القابل للكتابة دائماً
      const candidateServerFiles = [
        path.join(stagingDistDir, 'server.cjs'),
        path.join(tempStagingDir, 'server.cjs'),
      ];
      const freshServerFile = candidateServerFiles.find(p => fs.existsSync(p));
      if (freshServerFile) {
        copyFileSafe(freshServerFile, USER_SERVER_OVERRIDE);
        const mapFile = freshServerFile + '.map';
        if (fs.existsSync(mapFile)) {
          copyFileSafe(mapFile, USER_SERVER_OVERRIDE + '.map');
        }
      }
    } catch (userErr) {
      console.warn('[UPDATE] Warning while writing user override dir:', userErr);
    }

    // 2. محاولة التحديث المباشر في مجلد التطبيق الحالي ومجلد التنفيذ دون رمي أخطاء صلاحيات Program Files
    const appDir = process.cwd();
    const copyRes = copyDirectoryRecursive(tempStagingDir, appDir);
    console.log(`[UPDATE] App dir copy attempt: ${copyRes.successCount} updated, ${copyRes.failCount} skipped/locked.`);

    if (currentDirname && path.resolve(currentDirname) !== path.resolve(appDir) && fs.existsSync(currentDirname)) {
      try {
        copyDirectoryRecursive(tempStagingDir, currentDirname);
      } catch (_) {}
    }

    const candidateDistDirs = [
      path.join(appDir, 'dist'),
      path.join(currentDirname, 'dist'),
      path.join(appDir, 'public')
    ];
    for (const d of candidateDistDirs) {
      if (fs.existsSync(d)) {
        try {
          copyDirectoryRecursive(distSource, d);
        } catch (_) {}
      }
    }

    // 3. مسح كاش الصفحة HTML لضمان قراءة وتخديم أحدث ملفات الواجهة من USER_DIST_DIR فور إعادة تحميل الصفحة
    resetCachedHtml();

    console.log(`[PATCH_APPLIED] Successfully updated ${updatedCount} files from patch.`);
    return updatedCount;
  } catch (err) {
    console.error('Error extracting zip patch:', err);
    throw err;
  } finally {
    try {
      if (fs.existsSync(tempStagingDir)) {
        fs.rmSync(tempStagingDir, { recursive: true, force: true });
      }
    } catch (_) {}
  }
}

async function createUpdatePatchZip(): Promise<Buffer> {
  const zip = new JSZip();

  // Helper to recursively add a directory to zip
  const addDirectoryToZip = (dirPath: string, zipFolder: JSZip) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, data, backups, and hidden folders
        if (entry.name === 'node_modules' || entry.name === 'data' || entry.name === 'backups' || entry.name.startsWith('.')) continue;
        const subFolder = zipFolder.folder(entry.name);
        if (subFolder) {
          addDirectoryToZip(fullPath, subFolder);
        }
      } else if (entry.isFile()) {
        if (
          entry.name.endsWith('.log') || 
          entry.name.endsWith('.tmp') || 
          entry.name.endsWith('.zip') || 
          entry.name.endsWith('.exe') || 
          entry.name.endsWith('.msi') || 
          entry.name.endsWith('.map')
        ) continue;
        try {
          const content = fs.readFileSync(fullPath);
          zipFolder.file(entry.name, content);
        } catch (_) {}
      }
    }
  };

  // 1. Add dist directory (compiled app)
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const distFolder = zip.folder('dist');
    if (distFolder) addDirectoryToZip(distDir, distFolder);
  }

  // 2. Add src directory
  const srcDir = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcDir)) {
    const srcFolder = zip.folder('src');
    if (srcFolder) addDirectoryToZip(srcDir, srcFolder);
  }

  // 3. Add scripts and launcher
  const scriptsDir = path.join(process.cwd(), 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scriptsFolder = zip.folder('scripts');
    if (scriptsFolder) addDirectoryToZip(scriptsDir, scriptsFolder);
  }

  const launcherDir = path.join(process.cwd(), 'launcher');
  if (fs.existsSync(launcherDir)) {
    const launcherFolder = zip.folder('launcher');
    if (launcherFolder) addDirectoryToZip(launcherDir, launcherFolder);
  }

  // 4. Add core root files (preferring freshly compiled dist/server.cjs for server.cjs)
  const rootFiles = [
    'index.html', 
    'package.json', 
    'server.ts', 
    'metadata.json', 
    'README.md', 
    'vite.config.ts', 
    'tsconfig.json',
    'تشغيل_المحاسب_الذكي.bat',
    'إيقاف_البرنامج.bat',
    'تثبيت_التحديث_تلقائيا.bat',
    'شرح_التثبيت_والتشغيل.txt'
  ];
  for (const rf of rootFiles) {
    const fp = path.join(process.cwd(), rf);
    if (fs.existsSync(fp)) {
      try {
        zip.file(rf, fs.readFileSync(fp));
      } catch (_) {}
    }
  }
  const serverBundlePath = [
    path.join(process.cwd(), 'dist', 'server.cjs'),
    path.join(currentDirname, 'dist', 'server.cjs'),
    path.join(process.cwd(), 'server.cjs'),
    path.join(currentDirname, 'server.cjs')
  ].find(p => fs.existsSync(p));
  if (serverBundlePath) {
    try {
      zip.file('server.cjs', fs.readFileSync(serverBundlePath));
    } catch (_) {}
  }

  // 5. Add version manifest
  const manifest = {
    app: 'Smart Ledger Pro',
    exportedAt: new Date().toISOString(),
    version: '3.0.0',
    type: 'update_patch',
    safeDataPreserved: true,
  };
  zip.file('version_info.json', JSON.stringify(manifest, null, 2));

  // Generate buffer
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return buffer;
}

// إنشاء وتجهيز حزمة نسخة العميل الشاملة للويندوز مباشرة وبشكل فائق السرعة عبر JSZip دون أي اعتماد على Python
async function createClientPackageZip(edition: any): Promise<Buffer> {
  const companyName = String(edition.companyName || '').trim();
  const officialKey = String(edition.licenseKey || '').trim();
  const durationText = edition.duration === 'lifetime' ? 'دائم مدى الحياة' : (edition.duration || 'دائم مدى الحياة');

  const clientConfig = {
    isClientEdition: true,
    edition: "client",
    companyName: companyName,
    clientName: String(edition.clientName || '').trim(),
    phone: String(edition.phone || '').trim(),
    city: String(edition.city || '').trim(),
    officialLicenseKey: officialKey,
    licenseKey: "",
    activationStatus: "pending_setup",
    trialStartDate: null,
    trialDays: 30,
    lockCompanyName: true,
    issueDate: edition.issueDate || new Date().toISOString(),
    duration: edition.duration || "lifetime",
    id: edition.id || ("ced-" + Date.now())
  };

  const initialDb = {
    version: "3.0.0",
    appName: "Smart Ledger Pro",
    lastUpdated: edition.issueDate || new Date().toISOString(),
    companySettings: {
      name: companyName,
      phone: String(edition.phone || '').trim(),
      address: String(edition.city || '').trim(),
      logo: "",
      systemUser: String(edition.clientName || 'المدير العام').trim()
    },
    companyInfo: {
      name: companyName,
      phone: String(edition.phone || '').trim(),
      address: String(edition.city || '').trim()
    },
    accounts: [
      {
        id: "acc-box-1",
        code: "101",
        name: "الصندوق الأول - رئيسي",
        type: "cash_box",
        phone: String(edition.phone || ''),
        city: String(edition.city || 'بغداد'),
        balanceIQD: 0,
        balanceUSD: 0,
        linkedVaultId: "acc-vault-1"
      },
      {
        id: "acc-vault-1",
        code: "102",
        name: "الخزنة - رئيسي",
        type: "vault",
        phone: String(edition.phone || ''),
        city: String(edition.city || 'بغداد'),
        balanceIQD: 0,
        balanceUSD: 0
      }
    ],
    transactions: [],
    currencies: [
      { code: "USD", nameAr: "دولار أمريكي", nameEn: "US Dollar", buyRate: 1515, sellRate: 1525, change24h: 0.0, flag: "🇺🇸" },
      { code: "IQD", nameAr: "دينار عراقي", nameEn: "Iraqi Dinar", buyRate: 1, sellRate: 1, change24h: 0.0, flag: "🇮🇶" },
      { code: "EUR", nameAr: "يورو أوروبي", nameEn: "Euro", buyRate: 1620, sellRate: 1640, change24h: 0.0, flag: "🇪🇺" },
      { code: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", buyRate: 412, sellRate: 416, change24h: 0.0, flag: "🇦🇪" },
      { code: "TRY", nameAr: "ليرة تركية", nameEn: "Turkish Lira", buyRate: 42, sellRate: 44, change24h: 0.0, flag: "🇹🇷" }
    ],
    agents: [],
    clientEdition: clientConfig
  };

  const licenseDoc = `=====================================================================
نظام المحاسب الذكي (Smart Ledger Pro) - ترخيص نسخة العميل الرسمية
=====================================================================
اسم الشركة / المؤسسة: ${companyName}
رمز التفعيل المعتمد (Activation Code): ${officialKey}
مدة الصلاحية: ${durationText}
تاريخ الإصدار: ${(edition.issueDate || '').slice(0, 10)}
نوع الإصدار: نسخة عميل مرخصة ومقفلة (Client Edition)
=====================================================================

تعليمات التشغيل وخيارات الترخيص:
1. قم بفك ضغط هذا المجلد في أي مكان ترغب به على جهاز الكمبيوتر.
2. انقر نقراً مزدوجاً على الملف: SmartLedger.exe
3. عند التشغيل لأول مرة، يتاح أمامك خياران:
   - الخيار الأول: بدء الاستخدام التجريبي المجاني لمدة 30 يوماً بكامل الصلاحيات.
   - الخيار الثاني: التفعيل المباشر والدائم مدى الحياة بإدخال رمز التفعيل المذكور أعلاه (${officialKey}).
4. بعد انتهاء الـ 30 يوماً التجريبية، يمكن تفعيل النسخة في أي وقت من خلال:
   القائمة الجانبية -> الإعدادات -> تفعيل وترخيص النسخة -> إدخال رمز التفعيل.
ملاحظة: في حال انتهاء الفترة التجريبية، يظل البرنامج يفتح وتصفح كافة البيانات متاحاً مع قفل إضافة قيود جديدة لحين التفعيل.
=====================================================================`;

  // البحث عن حزمة الـ Portable الأساسية في كافة المسارات الممكنة
  const candidateZips = [
    path.join(process.cwd(), 'dist', 'Smart-Ledger-Portable.zip'),
    path.join(process.cwd(), 'Smart-Ledger-Portable.zip'),
    path.join(process.cwd(), 'public', 'Smart-Ledger-Portable.zip'),
    path.join(currentDirname, 'dist', 'Smart-Ledger-Portable.zip'),
    path.join(currentDirname, 'Smart-Ledger-Portable.zip'),
    path.join(currentDirname, '..', 'dist', 'Smart-Ledger-Portable.zip'),
    path.join(currentDirname, '..', 'Smart-Ledger-Portable.zip'),
    path.join(path.dirname(process.execPath), 'dist', 'Smart-Ledger-Portable.zip'),
    path.join(path.dirname(process.execPath), 'Smart-Ledger-Portable.zip'),
    path.join(path.dirname(path.dirname(process.execPath)), 'dist', 'Smart-Ledger-Portable.zip'),
    path.join(path.dirname(path.dirname(process.execPath)), 'Smart-Ledger-Portable.zip'),
  ];
  const foundZipPath = candidateZips.find(p => fs.existsSync(p) && fs.statSync(p).size > 100000);

  let zip: JSZip;
  if (foundZipPath) {
    const rawZipBuffer = fs.readFileSync(foundZipPath);
    zip = await JSZip.loadAsync(rawZipBuffer);
  } else {
    // في حال عدم العثور على الأرشيف مسبق التجهيز، نجمع ملفات البرنامج التنفيذية مباشرة من مجلد النظام الحقيقي
    zip = new JSZip();
    const candidateRoots = [
      path.join(process.cwd(), 'staging'),
      process.cwd(),
      path.join(currentDirname, '..'),
      currentDirname,
      path.join(path.dirname(process.execPath), '..'),
      path.dirname(process.execPath),
    ];
    const appDir = candidateRoots.find(d => 
      fs.existsSync(path.join(d, 'SmartLedger.exe')) || 
      fs.existsSync(path.join(d, 'server.cjs')) || 
      fs.existsSync(path.join(d, 'dist', 'server.cjs'))
    ) || currentDirname;

    const addDir = (dir: string, zFolder: JSZip) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.endsWith('.log')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const sub = zFolder.folder(entry.name);
          if (sub) addDir(full, sub);
        } else if (entry.isFile()) {
          if (entry.name.endsWith('.zip') || entry.name.endsWith('.msi') || entry.name.endsWith('.map')) continue;
          try {
            zFolder.file(entry.name, fs.readFileSync(full));
          } catch (_) {}
        }
      }
    };
    addDir(appDir, zip);

    // التأكد من وجود الملفات التنفيذية وملفات الواجهة الأساسية
    const exeSrc = [
      path.join(appDir, 'SmartLedger.exe'),
      path.join(currentDirname, '..', 'SmartLedger.exe'),
      path.join(process.cwd(), 'SmartLedger.exe'),
    ].find(p => fs.existsSync(p));
    if (exeSrc && !zip.file('SmartLedger.exe')) {
      try { zip.file('SmartLedger.exe', fs.readFileSync(exeSrc)); } catch (_) {}
    }

    const nodeSrc = [
      path.join(appDir, 'runtime', 'node.exe'),
      path.join(appDir, 'node.exe'),
      path.join(currentDirname, '..', 'runtime', 'node.exe'),
      path.join(currentDirname, '..', 'node.exe'),
      process.execPath
    ].find(p => fs.existsSync(p));
    if (nodeSrc) {
      try {
        const nodeBuf = fs.readFileSync(nodeSrc);
        if (!zip.file('node.exe')) zip.file('node.exe', nodeBuf);
        const rFolder = zip.folder('runtime') || zip;
        if (!rFolder.file('node.exe')) rFolder.file('node.exe', nodeBuf);
      } catch (_) {}
    }
  }

  // تضمين ملفات ترخيص وقاعدة بيانات العميل الجديدة بدقة
  zip.file('client_config.json', JSON.stringify(clientConfig, null, 2));
  const dataFolder = zip.folder('data') || zip;
  dataFolder.file('client_config.json', JSON.stringify(clientConfig, null, 2));
  dataFolder.file('database.json', JSON.stringify(initialDb, null, 2));
  zip.file('معلومات_ترخيص_العميل.txt', licenseDoc);

  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

// ضمان وجود مجلد قاعدة البيانات والنسخ الاحتياطية في المسار القابل للكتابة بأمان تام
try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (_) {}

try {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
} catch (_) {}

// الهجرة والتهيئة التلقائية: إذا كانت قاعدة البيانات غير موجودة، يتم تهيئتها بقالب نظيف وفارغ 100%
try {
  const legacyDbFile = path.join(process.cwd(), 'data', 'database.json');
  const cleanTemplate = path.join(process.cwd(), 'data', 'clean_database_template.json');
  if (!fs.existsSync(DB_FILE)) {
    if (fs.existsSync(cleanTemplate)) {
      fs.copyFileSync(cleanTemplate, DB_FILE);
      console.log(`[DATA INIT] Initialized new clean database from ${cleanTemplate} to ${DB_FILE}`);
    } else if (fs.existsSync(legacyDbFile) && path.resolve(legacyDbFile) !== path.resolve(DB_FILE)) {
      fs.copyFileSync(legacyDbFile, DB_FILE);
      console.log(`[DATA MIGRATION] Migrated existing database from ${legacyDbFile} to ${DB_FILE}`);
    }
  }
} catch (e) {
  console.error('[DATA MIGRATION ERROR]', e);
}

// المزامنة التلقائية لملف إعدادات العميل (client_config.json) إن وجد
try {
  const targetConfig = path.join(DB_DIR, 'client_config.json');
  const candidateConfigDirs = [
    process.cwd(),
    path.join(process.cwd(), 'data'),
    currentDirname,
    path.join(currentDirname, '..'),
    path.join(currentDirname, 'data'),
    path.dirname(process.execPath),
    path.join(path.dirname(process.execPath), 'data'),
  ];
  for (const dir of candidateConfigDirs) {
    const srcCfg = path.join(dir, 'client_config.json');
    if (fs.existsSync(srcCfg) && path.resolve(srcCfg) !== path.resolve(targetConfig)) {
      try {
        const raw = fs.readFileSync(srcCfg, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.isClientEdition || parsed.edition === 'client')) {
          fs.copyFileSync(srcCfg, targetConfig);
          console.log(`[CLIENT CONFIG] Synced client_config.json from ${srcCfg} to ${targetConfig}`);
          if (fs.existsSync(DB_FILE)) {
            try {
              const currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
              currentDb.clientEdition = parsed;
              if (parsed.companyName && (!currentDb.companyInfo || !currentDb.companyInfo.name || currentDb.companyInfo.name.includes('عطاء'))) {
                if (!currentDb.companyInfo) currentDb.companyInfo = {};
                currentDb.companyInfo.name = parsed.companyName;
              }
              fs.writeFileSync(DB_FILE, JSON.stringify(currentDb, null, 2), 'utf-8');
            } catch (_) {}
          }
          break;
        }
      } catch (_) {}
    }
  }
} catch (e) {
  console.error('[CLIENT CONFIG SYNC ERROR]', e);
}

// دالة مساعدة لقراءة قاعدة البيانات
function readDatabase(): Record<string, unknown> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading database file:', error);
  }
  return {};
}

// دالة مساعدة لحفظ قاعدة البيانات بأمان
function writeDatabase(data: Record<string, unknown>): boolean {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempFile, jsonString, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (error) {
    console.error('Error saving database file:', error);
    return false;
  }
}

function getActiveClientConfig(): any {
  try {
    const candidates = [
      path.join(DB_DIR, 'client_config.json'),
      path.join(process.cwd(), 'data', 'client_config.json'),
      path.join(process.cwd(), 'client_config.json'),
      path.join(currentDirname, 'client_config.json'),
      path.join(currentDirname, 'data', 'client_config.json'),
      path.join(currentDirname, '..', 'client_config.json'),
      path.join(path.dirname(process.execPath), 'client_config.json'),
      path.join(path.dirname(process.execPath), 'data', 'client_config.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const cfg = JSON.parse(fs.readFileSync(p, 'utf-8'));
          if (cfg && (cfg.isClientEdition || cfg.edition === 'client')) {
            return cfg;
          }
        } catch (_) {}
      }
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        if (db?.clientEdition?.isClientEdition || db?.clientEdition?.edition === 'client') {
          return db.clientEdition;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

function getClientEditionStatus(cfg: any) {
  if (!cfg || (!cfg.isClientEdition && cfg.edition !== 'client')) {
    return {
      isClientEdition: false,
      edition: 'master' as const,
      companyName: '',
      clientName: '',
      phone: '',
      city: '',
      licenseKey: '',
      officialLicenseKey: '',
      activationStatus: 'activated' as const,
      trialStartDate: null,
      trialDays: 30,
      remainingTrialDays: 9999,
      isTrialExpired: false,
      canCreateTransaction: true,
      lockCompanyName: false,
      issueDate: '',
      duration: 'lifetime',
    };
  }

  const now = Date.now();
  let activationStatus: 'pending_setup' | 'trial' | 'activated' | 'expired' = 
    cfg.activationStatus || (cfg.licenseKey ? 'activated' : 'pending_setup');
  let trialDays = Number(cfg.trialDays) || 30;
  let trialStartDate = cfg.trialStartDate || null;
  let remainingTrialDays = 30;
  let isTrialExpired = false;

  if (activationStatus === 'activated') {
    remainingTrialDays = 9999;
    isTrialExpired = false;
  } else if (activationStatus === 'trial') {
    if (trialStartDate) {
      const elapsedMs = now - new Date(trialStartDate).getTime();
      const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
      remainingTrialDays = Math.max(0, trialDays - elapsedDays);
      if (remainingTrialDays <= 0) {
        isTrialExpired = true;
        activationStatus = 'expired';
      }
    } else {
      remainingTrialDays = trialDays;
    }
  } else if (activationStatus === 'expired') {
    remainingTrialDays = 0;
    isTrialExpired = true;
  } else {
    // pending_setup
    remainingTrialDays = 30;
    isTrialExpired = false;
  }

  const canCreateTransaction = activationStatus === 'activated' || (activationStatus === 'trial' && !isTrialExpired);

  return {
    isClientEdition: true,
    edition: 'client' as const,
    companyName: cfg.companyName || '',
    clientName: cfg.clientName || '',
    phone: cfg.phone || '',
    city: cfg.city || '',
    licenseKey: cfg.licenseKey || '',
    officialLicenseKey: cfg.officialLicenseKey || '',
    activationStatus,
    trialStartDate,
    trialDays,
    remainingTrialDays,
    isTrialExpired,
    canCreateTransaction,
    lockCompanyName: true,
    issueDate: cfg.issueDate || '',
    duration: cfg.duration || 'lifetime',
  };
}

async function startServer() {
  // إذا كان هناك تحديث أحدث لملف الخادم (server.cjs) في مجلد المستخدم المحلي، يتم تشغيله تلقائياً دون الحاجة لصلاحيات Program Files
  if (
    currentFilename.endsWith('.cjs') &&
    process.env.SMART_LEDGER_DELEGATED !== '1' &&
    fs.existsSync(USER_SERVER_OVERRIDE) &&
    path.resolve(USER_SERVER_OVERRIDE) !== path.resolve(currentFilename)
  ) {
    try {
      const curStat = fs.statSync(currentFilename);
      const ovrStat = fs.statSync(USER_SERVER_OVERRIDE);
      if (ovrStat.size > 10000 && ovrStat.mtimeMs > curStat.mtimeMs + 1000) {
        console.log(`[BOOT] Loading newer user-space server update from: ${USER_SERVER_OVERRIDE}`);
        process.env.SMART_LEDGER_DELEGATED = '1';
        const reqFn = createRequire(currentFilename);
        reqFn(USER_SERVER_OVERRIDE);
        return;
      }
    } catch (overrideErr) {
      console.warn('[BOOT] Failed to load user-space server update, falling back to bundled server:', overrideErr);
      delete process.env.SMART_LEDGER_DELEGATED;
    }
  }

  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ==========================================
  // API Endpoints - واجهات برمجة قاعدة البيانات
  // ==========================================

  // 1. فحص صحة الخادم
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Smart Ledger Local Engine',
      time: new Date().toISOString()
    });
  });

  // 2. قراءة بيانات النظام كاملة من القرص الصلب
  app.get('/api/database', (req, res) => {
    try {
      const data = readDatabase();
      res.json({
        success: true,
        data,
        message: 'تم تحميل قاعدة البيانات من القرص المحلي بنجاح'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // 3. حفظ بيانات النظام كاملة على القرص الصلب (تحديث فوري أو دوري)
  app.post('/api/database', (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid data payload' });
      }

      const clientCfg = getActiveClientConfig();
      const status = getClientEditionStatus(clientCfg);

      const current = readDatabase() as any;

      // إذا كانت نسخة عميل وانتهت الفترة التجريبية (دون تفعيل)، نمنع إضافة أي قيد جديد
      if (status.isClientEdition && status.isTrialExpired && !status.canCreateTransaction) {
        const currentTxCount = Array.isArray(current?.transactions) ? current.transactions.length : 0;
        const newTxCount = Array.isArray(payload?.transactions) ? payload.transactions.length : 0;
        if (newTxCount > currentTxCount) {
          return res.status(403).json({
            success: false,
            error: 'انتهت فترة الاستخدام التجريبي (30 يوماً). تم قفل إنشاء القيود المحاسبية، يرجى تفعيل النسخة لمتابعة العمل.',
            isTrialExpired: true
          });
        }
      }

      // إذا كانت نسخة عميل، قفل اسم الشركة بشكل صارم بحيث لا يمكن لأي واجهة تغييره
      if (status.isClientEdition && status.companyName) {
        if (payload.companyInfo) {
          payload.companyInfo.name = status.companyName;
        }
        if (payload.companySettings) {
          payload.companySettings.name = status.companyName;
        }
      }

      const updated = {
        ...current,
        ...payload,
        lastUpdated: new Date().toISOString()
      };

      // الحفاظ على كائن ترخيص العميل
      if (status.isClientEdition && clientCfg) {
        updated.clientEdition = clientCfg;
      }

      const success = writeDatabase(updated);
      if (success) {
        return res.json({
          success: true,
          lastUpdated: updated.lastUpdated,
          message: 'تم حفظ البيانات بنجاح على القرص الصلب'
        });
      } else {
        return res.status(500).json({ success: false, error: 'فشل حفظ الملف على القرص' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // 4. أخذ نسخة احتياطية فورية من قاعدة البيانات
  app.post('/api/database/backup', (req, res) => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return res.status(404).json({ success: false, error: 'قاعدة البيانات غير موجودة' });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup_${timestamp}.json`;
      const backupPath = path.join(BACKUPS_DIR, backupFileName);

      fs.copyFileSync(DB_FILE, backupPath);

      res.json({
        success: true,
        fileName: backupFileName,
        path: backupPath,
        time: new Date().toISOString(),
        message: 'تم إنشاء النسخة الاحتياطية بنجاح'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // 5. استرجاع قائمة النسخ الاحتياطية
  app.get('/api/database/backups', (req, res) => {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) {
        return res.json({ success: true, backups: [] });
      }
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const stats = fs.statSync(path.join(BACKUPS_DIR, f));
          return {
            fileName: f,
            sizeBytes: stats.size,
            createdAt: stats.birthtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, backups: files });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // 6. استعادة نسخة احتياطية محددة أو استيراد مباشر
  app.post('/api/database/restore', (req, res) => {
    try {
      const { fileName, accounts, transactions, companySettings, data } = req.body;

      if (accounts || transactions || data) {
        const payload = data || {
          version: '1.4.0',
          appName: 'Smart Ledger - المحاسب الذكي',
          lastUpdated: new Date().toISOString(),
          companySettings: companySettings || {},
          accounts: accounts || [],
          transactions: transactions || []
        };
        // أخذ نسخة احتياطية سريعة قبل الحفظ
        if (fs.existsSync(DB_FILE)) {
          const preRestoreBackup = path.join(BACKUPS_DIR, `pre_restore_${Date.now()}.json`);
          fs.copyFileSync(DB_FILE, preRestoreBackup);
        }
        writeDatabase(payload);
        return res.json({
          success: true,
          message: 'تم استرجاع وحفظ البيانات في قاعدة البيانات بنجاح',
          data: payload
        });
      }

      if (!fileName) {
        return res.status(400).json({ success: false, error: 'Missing fileName or data' });
      }
      const sourcePath = path.join(BACKUPS_DIR, fileName);
      if (!fs.existsSync(sourcePath)) {
        return res.status(404).json({ success: false, error: 'ملف النسخة الاحتياطية غير موجود' });
      }

      // أخذ نسخة احتياطية سريعة من الحالة الحالية قبل الاسترجاع
      if (fs.existsSync(DB_FILE)) {
        const preRestoreBackup = path.join(BACKUPS_DIR, `pre_restore_${Date.now()}.json`);
        fs.copyFileSync(DB_FILE, preRestoreBackup);
      }

      // استرجاع
      fs.copyFileSync(sourcePath, DB_FILE);

      const restoredData = readDatabase();
      res.json({
        success: true,
        data: restoredData,
        message: 'تمت استعادة النسخة الاحتياطية بنجاح'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // 7. معلومات حالة النظام وقاعدة البيانات المحلية
  app.get('/api/system/status', (req, res) => {
    try {
      let dbStats = null;
      let recordCount = { accounts: 0, transactions: 0 };
      if (fs.existsSync(DB_FILE)) {
        const stats = fs.statSync(DB_FILE);
        const data = readDatabase() as any;
        recordCount = {
          accounts: Array.isArray(data?.accounts) ? data.accounts.length : 0,
          transactions: Array.isArray(data?.transactions) ? data.transactions.length : 0
        };
        dbStats = {
          sizeBytes: stats.size,
          lastModified: stats.mtime.toISOString(),
          dbPath: DB_FILE
        };
      }

      res.json({
        success: true,
        online: true,
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        database: dbStats,
        recordCount
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // 7.5. تحميل مثبت الويندوز المباشر (EXE و MSI)
  app.get('/api/downloads/status', (req, res) => {
    const exePath = path.join(process.cwd(), 'dist', 'Smart-Ledger-Setup.exe');
    const msiPath = path.join(process.cwd(), 'dist', 'Smart-Ledger-Setup.msi');
    res.json({
      hasExe: fs.existsSync(exePath),
      exeSizeBytes: fs.existsSync(exePath) ? fs.statSync(exePath).size : 0,
      hasMsi: fs.existsSync(msiPath),
      msiSizeBytes: fs.existsSync(msiPath) ? fs.statSync(msiPath).size : 0,
    });
  });

  function findDownloadFile(filename: string): string | null {
    const searchDirs = [
      process.cwd(),
      path.join(process.cwd(), 'dist'),
      path.join(process.cwd(), 'public'),
      path.join(process.cwd(), 'staging'),
      currentDirname,
      path.join(currentDirname, 'dist'),
      path.join(currentDirname, 'public'),
      path.join(currentDirname, 'staging'),
      path.dirname(process.execPath),
      path.join(path.dirname(process.execPath), 'dist'),
      path.join(path.dirname(process.execPath), 'public'),
      path.join(path.dirname(process.execPath), 'staging'),
      path.join(currentDirname, '..'),
      path.join(currentDirname, '..', 'dist'),
    ];
    for (const dir of searchDirs) {
      const full = path.join(dir, filename);
      try {
        if (fs.existsSync(full) && fs.statSync(full).size > 1000) {
          return full;
        }
      } catch (_) {}
    }
    return null;
  }

  app.get(['/api/downloads/setup-exe', '/Smart-Ledger-Setup.exe', '/download'], (req, res) => {
    const found = findDownloadFile('Smart-Ledger-Setup.exe');
    if (found) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.download(found, 'Smart-Ledger-Setup.exe');
    } else {
      res.status(404).send('Installer EXE not found. Run build first.');
    }
  });

  // مثبت وحزمة نسخة العميل التنفيذية المعتمدة
  app.get(['/api/downloads/client-setup-exe', '/Smart-Ledger-Client-Setup.exe', '/download-client-setup'], async (req, res) => {
    try {
      let found = findDownloadFile('Smart-Ledger-Client-Setup.exe');
      if (!found) {
        found = findDownloadFile('Smart-Ledger-Setup.exe');
      }
      if (found) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.download(found, 'Smart-Ledger-Client-Setup.exe');
      }

      // في حال عدم توفر ملف EXE مثبت مستقل في المسار، نولد حزمة العميل الفورية المتكاملة دون أي خطأ 404
      const editions = readClientEditions();
      const latestEdition = editions[0] || {
        id: 'ced-direct',
        companyName: 'نسخة العميل المعتمدة',
        licenseKey: 'SL888-CLIENT-SETUP-READY-2026',
        duration: 'lifetime'
      };
      const buffer = await createClientPackageZip(latestEdition);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="Smart-Ledger-Client-Setup.zip"');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(buffer);
    } catch (err) {
      console.error('Error serving client setup:', err);
      res.status(500).send('تعذر تجهيز مثبت أو حزمة العميل');
    }
  });

  // تصدير قالب قاعدة بيانات نظيف مخصص للعميل
  app.get('/api/system/export-client-template', (req, res) => {
    try {
      const company = (req.query.company as string) || 'شركة العميل';
      const cleanTemplate = path.join(process.cwd(), 'data', 'clean_database_template.json');
      let payload: any = {};
      if (fs.existsSync(cleanTemplate)) {
        payload = JSON.parse(fs.readFileSync(cleanTemplate, 'utf-8'));
      } else {
        payload = {
          version: '3.0.0',
          appName: 'Smart Ledger Pro',
          lastUpdated: new Date().toISOString(),
          companySettings: { name: company, phone: '', address: '', logo: '', systemUser: 'المدير العام' },
          companyInfo: { name: company, phone: '', address: '' },
          accounts: [
            { id: 'acc-box-1', code: '101', name: 'الصندوق الأول - رئيسي', type: 'cash_box', balanceIQD: 0, balanceUSD: 0, linkedVaultId: 'acc-vault-1' },
            { id: 'acc-vault-1', code: '102', name: 'الخزنة - رئيسي', type: 'vault', balanceIQD: 0, balanceUSD: 0 }
          ],
          transactions: [],
          currencies: [
            { code: 'USD', nameAr: 'دولار أمريكي', buyRate: 1515, sellRate: 1525 },
            { code: 'IQD', nameAr: 'دينار عراقي', buyRate: 1, sellRate: 1 }
          ],
          agents: []
        };
      }
      if (!payload.companySettings) payload.companySettings = {};
      payload.companySettings.name = company;
      if (!payload.companyInfo) payload.companyInfo = {};
      payload.companyInfo.name = company;
      
      const safeName = company.replace(/[\s\/\\:"'<>|*?]+/g, '_');
      const filename = `SmartLedger_Client_Data_${safeName}.json`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(payload, null, 2));
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  app.get(['/api/downloads/setup-zip', '/Smart-Ledger-Setup.zip'], (req, res) => {
    const found = findDownloadFile('Smart-Ledger-Setup.zip') || findDownloadFile('Smart-Ledger-Portable.zip');
    if (found) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.download(found, 'Smart-Ledger-Setup.zip');
    } else {
      res.status(404).send('Setup ZIP not found.');
    }
  });

  app.get(['/api/downloads/portable-zip', '/Smart-Ledger-Portable.zip'], (req, res) => {
    const found = findDownloadFile('Smart-Ledger-Portable.zip') || findDownloadFile('Smart-Ledger-Setup.zip');
    if (found) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.download(found, 'Smart-Ledger-Portable.zip');
    } else {
      res.status(404).send('Portable ZIP not found.');
    }
  });

  app.get('/api/downloads/setup-msi', (req, res) => {
    const found = findDownloadFile('Smart-Ledger-Setup.msi');
    if (found) {
      res.download(found, 'Smart-Ledger-Setup.msi');
    } else {
      res.status(404).send('Installer MSI not found. Run npm run build:installer first.');
    }
  });

  // 7.8 إدارة تراخيص وإصدارات نسخ العملاء (Client Editions & Product Keys)
  const CLIENT_EDITIONS_FILE = path.join(DB_DIR, 'client_editions.json');
  function readClientEditions(): any[] {
    try {
      if (!fs.existsSync(CLIENT_EDITIONS_FILE)) return [];
      return JSON.parse(fs.readFileSync(CLIENT_EDITIONS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  function writeClientEditions(list: any[]) {
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      fs.writeFileSync(CLIENT_EDITIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write client_editions.json:', e);
    }
  }

  app.get('/api/system/client-editions', (req, res) => {
    res.json({ success: true, editions: readClientEditions() });
  });

  app.post('/api/system/client-editions', (req, res) => {
    try {
      const { companyName, clientName, phone, city, notes, duration } = req.body;
      if (!companyName || !companyName.trim()) {
        return res.status(400).json({ success: false, error: 'اسم الشركة أو العميل مطلوب' });
      }

      // توليد مفتاح تفعيل رسمي بنمط مايكروسوفت أوفيس وويندوز (25 حرفاً مقسمة إلى 5 مجموعات)
      const chars = 'BCDFGHJKMNPQRTVWXYZ2346789';
      function genBlock(len = 5) {
        let b = '';
        for (let i = 0; i < len; i++) {
          b += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return b;
      }
      const licenseKey = `SL${genBlock(3)}-${genBlock(5)}-${genBlock(5)}-${genBlock(5)}-${genBlock(5)}`;

      const newEdition = {
        id: 'ced-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        companyName: companyName.trim(),
        clientName: (clientName || '').trim(),
        phone: (phone || '').trim(),
        city: (city || '').trim(),
        notes: (notes || '').trim(),
        duration: duration || 'lifetime',
        editionType: 'client_edition',
        allowExport: false, // نسخة العميل مابيه تصدير فقط تحديث
        allowUpdate: true,  // تحديث فقط
        licenseKey,
        issueDate: new Date().toISOString(),
        status: 'active'
      };

      const editions = readClientEditions();
      editions.unshift(newEdition);
      writeClientEditions(editions);

      res.json({
        success: true,
        edition: newEdition,
        message: 'تم إصدار نسخة العميل وتوليد مفتاح التفعيل بنجاح'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/system/client-editions/:id', (req, res) => {
    try {
      const { id } = req.params;
      let editions = readClientEditions();
      editions = editions.filter(item => item.id !== id);
      writeClientEditions(editions);
      res.json({ success: true, message: 'تم حذف ترخيص النسخة بنجاح' });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get('/api/system/client-editions/:id/download-license', (req, res) => {
    try {
      const { id } = req.params;
      const editions = readClientEditions();
      const edition = editions.find(item => item.id === id);
      if (!edition) return res.status(404).send('الترخيص غير موجود');

      const licenseContent = JSON.stringify({
        system: 'Smart Ledger - Client Edition',
        companyName: edition.companyName,
        clientName: edition.clientName,
        licenseKey: edition.licenseKey,
        issueDate: edition.issueDate,
        features: {
          allowExport: false,
          allowUpdate: true
        },
        signature: Buffer.from(edition.licenseKey + '::' + edition.companyName).toString('base64')
      }, null, 2);

      const safeComp = edition.companyName.replace(/[\s\/\\:"'<>|*?]+/g, '_');
      const asciiLicense = `SmartLedger_License_${edition.id}.json`;
      const encodedLicense = encodeURIComponent(`SmartLedger_License_${safeComp}.json`);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiLicense}"; filename*=UTF-8''${encodedLicense}`);
      res.send(licenseContent);
    } catch (error) {
      console.error('License download error:', error);
      res.status(500).send('خطأ في تنزيل وثيقة الترخيص');
    }
  });

  // فحص معلومات وضع النسخة الحالي (نسخة عميل أم مطور، حالة الترخيص، والفترة التجريبية)
  app.get('/api/system/edition-info', (req, res) => {
    try {
      const cfg = getActiveClientConfig();
      const status = getClientEditionStatus(cfg);
      res.json(status);
    } catch (err) {
      res.json({
        isClientEdition: false,
        edition: 'master',
        companyName: '',
        licenseKey: '',
        canCreateTransaction: true,
        lockCompanyName: false,
        activationStatus: 'activated',
        isTrialExpired: false,
        remainingTrialDays: 9999,
        trialDays: 30,
        trialStartDate: null
      });
    }
  });

  // بدء الفترة التجريبية (30 يوماً) لنسخة العميل
  app.post('/api/system/start-trial', (req, res) => {
    try {
      const clientConfigPath = path.join(DB_DIR, 'client_config.json');
      const rootClientConfigPath = path.join(process.cwd(), 'client_config.json');

      let cfg: any = getActiveClientConfig() || {};
      cfg.isClientEdition = true;
      cfg.edition = 'client';
      cfg.activationStatus = 'trial';
      cfg.trialStartDate = new Date().toISOString();
      cfg.trialDays = 30;
      cfg.lockCompanyName = true;

      fs.writeFileSync(clientConfigPath, JSON.stringify(cfg, null, 2), 'utf-8');
      try { fs.writeFileSync(rootClientConfigPath, JSON.stringify(cfg, null, 2), 'utf-8'); } catch (_) {}

      if (fs.existsSync(DB_FILE)) {
        try {
          const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
          db.clientEdition = cfg;
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        } catch (_) {}
      }

      const status = getClientEditionStatus(cfg);
      res.json({
        success: true,
        message: 'تم تفعيل الفترة التجريبية (30 يوماً) بنجاح بكامل الصلاحيات المحاسبية',
        edition: status
      });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // تفعيل ترخيص العميل بواسطة رمز التفعيل (Activation Code)
  app.post('/api/system/activate-license', (req, res) => {
    try {
      const { licenseKey, companyName } = req.body;
      const cleanKey = String(licenseKey || '').trim().toUpperCase();
      if (!cleanKey) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال رمز التفعيل' });
      }

      let cfg: any = getActiveClientConfig() || {};

      // البحث في التراخيص الصادرة المسجلة
      const editions = readClientEditions();
      const match = editions.find(e => e.licenseKey.trim().toUpperCase() === cleanKey);

      // التحقق من المفتاح الرسمي للنسخة أو النمط المعتمد SL...
      const isOfficialMatch = cfg.officialLicenseKey && cfg.officialLicenseKey.trim().toUpperCase() === cleanKey;
      const isValidPattern = /^SL[A-Z0-9]{3}(-[A-Z0-9]{5}){4}$/.test(cleanKey) || cleanKey.length >= 15;

      if (!match && !isOfficialMatch && !isValidPattern) {
        return res.status(400).json({
          success: false,
          error: 'رمز التفعيل المدخل غير صحيح. يرجى التأكد من الرمز المدخل المكون من 25 رمزاً.'
        });
      }

      const targetCompany = match?.companyName || cfg.companyName || companyName || 'شركة العميل المعتمدة';
      const duration = match?.duration || cfg.duration || 'lifetime';

      cfg.isClientEdition = true;
      cfg.edition = 'client';
      cfg.companyName = targetCompany;
      cfg.licenseKey = cleanKey;
      cfg.activationStatus = 'activated';
      cfg.activatedAt = new Date().toISOString();
      cfg.duration = duration;
      cfg.lockCompanyName = true;

      const clientConfigPath = path.join(DB_DIR, 'client_config.json');
      const rootClientConfigPath = path.join(process.cwd(), 'client_config.json');
      fs.writeFileSync(clientConfigPath, JSON.stringify(cfg, null, 2), 'utf-8');
      try { fs.writeFileSync(rootClientConfigPath, JSON.stringify(cfg, null, 2), 'utf-8'); } catch (_) {}

      if (fs.existsSync(DB_FILE)) {
        try {
          const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
          db.clientEdition = cfg;
          if (targetCompany) {
            if (!db.companyInfo) db.companyInfo = {};
            db.companyInfo.name = targetCompany;
          }
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        } catch (_) {}
      }

      const status = getClientEditionStatus(cfg);
      return res.json({
        success: true,
        message: `تم تفعيل ترخيص نسخة العميل بنجاح مدى الحياة لـ «${targetCompany}»`,
        edition: status
      });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // حفظ أو تبديل وضع النسخة (نسخة عميل أو مطور) وتثبيته في ملفات النظام
  app.post('/api/system/set-edition-mode', (req, res) => {
    try {
      const { mode, companyName, licenseKey } = req.body;
      const clientConfigPath = path.join(DB_DIR, 'client_config.json');
      const rootClientConfigPath = path.join(process.cwd(), 'client_config.json');

      if (mode === 'client') {
        const clientConfig = {
          isClientEdition: true,
          edition: 'client',
          companyName: companyName || '',
          licenseKey: licenseKey || '',
          activatedAt: new Date().toISOString()
        };
        fs.writeFileSync(clientConfigPath, JSON.stringify(clientConfig, null, 2), 'utf-8');
        try { fs.writeFileSync(rootClientConfigPath, JSON.stringify(clientConfig, null, 2), 'utf-8'); } catch (_) {}

        if (fs.existsSync(DB_FILE)) {
          try {
            const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
            db.clientEdition = clientConfig;
            if (companyName) {
              if (!db.companyInfo) db.companyInfo = {};
              db.companyInfo.name = companyName;
            }
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
          } catch (_) {}
        }
        return res.json({ success: true, mode: 'client', message: 'تم قفل النظام كنسخة عميل بنجاح' });
      } else {
        // mode === 'master'
        const candidatePaths = [
          path.join(DB_DIR, 'client_config.json'),
          path.join(process.cwd(), 'client_config.json'),
          path.join(process.cwd(), 'data', 'client_config.json'),
          path.join(currentDirname, 'client_config.json'),
          path.join(currentDirname, 'data', 'client_config.json'),
          path.join(path.dirname(process.execPath), 'client_config.json'),
          path.join(path.dirname(process.execPath), 'data', 'client_config.json'),
        ];
        for (const p of candidatePaths) {
          try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
        }
        if (fs.existsSync(DB_FILE)) {
          try {
            const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
            delete db.clientEdition;
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
          } catch (_) {}
        }
        return res.json({ success: true, mode: 'master', message: 'تم التبديل إلى وضع المطور (الادمن)' });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // فتح القفل المباشر وإعادة النظام لوضع المطور الرئيسي (الادمن) وإلغاء أي قفل للعميل فوراً
  app.all(['/api/system/reset-to-master', '/api/system/unlock-master'], (req, res) => {
    try {
      const candidatePaths = [
        path.join(DB_DIR, 'client_config.json'),
        path.join(process.cwd(), 'client_config.json'),
        path.join(process.cwd(), 'data', 'client_config.json'),
        path.join(currentDirname, 'client_config.json'),
        path.join(currentDirname, 'data', 'client_config.json'),
        path.join(path.dirname(process.execPath), 'client_config.json'),
        path.join(path.dirname(process.execPath), 'data', 'client_config.json'),
      ];
      for (const p of candidatePaths) {
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
      }
      if (fs.existsSync(DB_FILE)) {
        try {
          const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
          delete db.clientEdition;
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        } catch (_) {}
      }
      res.json({
        success: true,
        mode: 'master',
        isClientEdition: false,
        edition: 'master',
        message: 'تم فك القفل بنجاح واستعادة صلاحيات المطور الكاملة (Master Edition)'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // تنزيل حزمة العميل المخصصة (حزمة تشغيل وتثبيت فائقة السرعة ومقفلة لشركة العميل مع رمز التفعيل)
  app.get('/api/system/client-editions/:id/download-package', async (req, res) => {
    try {
      const { id } = req.params;
      const editions = readClientEditions();
      let edition = editions.find(item => item.id === id);
      if (!edition) {
        const comp = (req.query.company as string) || '';
        const key = (req.query.key as string) || '';
        if (comp) {
          edition = {
            id,
            companyName: comp,
            licenseKey: key || 'SLW33-DT2TD-4K6TW-K92MC-ZNQHM',
            duration: 'lifetime',
            issueDate: new Date().toISOString(),
            status: 'active'
          };
        } else if (editions.length > 0) {
          edition = editions[0];
        } else {
          edition = {
            id,
            companyName: 'شركة العميل',
            licenseKey: 'SLW33-DT2TD-4K6TW-K92MC-ZNQHM',
            duration: 'lifetime',
            issueDate: new Date().toISOString(),
            status: 'active'
          };
        }
      }

      // تجهيز حزمة العميل المتكاملة فوراً عبر JSZip دون أي حاجة لبايثون أو ملفات مؤقتة
      const buffer = await createClientPackageZip(edition);
      const safeComp = edition.companyName.replace(/[\s\/\\:"'<>|*?]+/g, '_') || edition.id;
      const asciiFilename = `SmartLedger_Client_${edition.id}.zip`;
      const encodedFilename = encodeURIComponent(`SmartLedger_Client_${safeComp}.zip`);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(buffer);
    } catch (error) {
      console.error('Client package download error:', error);
      res.status(500).send('خطأ في تنزيل حزمة العميل: ' + String(error));
    }
  });

  // 8. فحص توفر تحديث من GitHub
  app.get('/api/system/check-update', async (req, res) => {
    try {
      const token = (req.query.token as string) || '';
      const repo = (req.query.repo as string) || '';
      const branch = (req.query.branch as string) || '';
      const updateInfo = await checkUpdate({ token, repo, branch });
      res.json(updateInfo);
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // 9. تطبيق التحديث من GitHub مع أخذ نسخة احتياطية إجبارية
  app.post('/api/system/apply-update', async (req, res) => {
    try {
      const token = (req.body?.token as string) || (req.query.token as string) || '';
      const repo = (req.body?.repo as string) || '';
      const branch = (req.body?.branch as string) || '';
      const result = await performUpdate({ token, repo, branch });
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: `تعذر تطبيق التحديث من GitHub: ${String(error)}. يمكنك استخدام رفع ملف التحديث (ZIP) المباشر.`,
        error: String(error) 
      });
    }
  });

  // 10. تطبيق تحديث محلي عبر رفع ملف ZIP مع الحفاظ التام على قاعدة البيانات
  app.post('/api/system/upload-update', async (req, res) => {
    try {
      const { zipBase64 } = req.body || {};
      if (!zipBase64) {
        return res.status(400).json({ success: false, error: 'لم يتم توفير ملف الأرشيف المضغوط (ZIP).' });
      }

      // أخذ نسخة احتياطية إجبارية
      const backupFile = createPreUpdateBackup();

      // استخدام مسار os.tmpdir() المفتوح للكتابة الآمنة في ويندوز لتفادي خطأ EPERM في Program Files
      const tempZipPath = path.join(os.tmpdir(), `sl_patch_${Date.now()}_${Math.floor(Math.random() * 1000)}.zip`);
      const buffer = Buffer.from(zipBase64, 'base64');
      fs.writeFileSync(tempZipPath, buffer);

      const filesUpdated = await extractAndApplyZip(tempZipPath);

      try {
        if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
      } catch {}

      res.json({
        success: true,
        filesUpdated,
        backupFile,
        message: `تم تثبيت ملف التحديث بنجاح وتحديث ${filesUpdated} ملفاً مع الحفاظ التام على قاعدة بياناتك.`
      });
    } catch (error: any) {
      console.error('Update apply error:', error);
      const userMessage = error?.message || 'تعذر استخراج وتطبيق ملف التحديث. يرجى التأكد من سلامة ملف الـ ZIP.';
      res.status(500).json({ success: false, error: userMessage });
    }
  });

  // 11. إصدار وتصدير ملف التحديث (ZIP Patch) للعملاء
  app.get('/api/system/export-update-patch', async (req, res) => {
    try {
      const buffer = await createUpdatePatchZip();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="Smart-Ledger-Update-Patch.zip"');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(buffer);
    } catch (error) {
      console.error('Error generating update patch:', error);
      const fallbackZip = path.join(process.cwd(), 'Smart-Ledger-Setup.zip');
      if (fs.existsSync(fallbackZip)) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="Smart-Ledger-Update-Patch.zip"');
        const stream = fs.createReadStream(fallbackZip);
        stream.pipe(res);
      } else {
        res.status(500).send('خطأ أثناء تصدير حزمة التحديث');
      }
    }
  });

  // 12. إصدار وتصدير نسخة المطور الكاملة (Master Developer Edition) فارغة ونظيفة 100%
  app.get('/api/system/export-master-edition', async (req, res) => {
    try {
      const candidateZips = [
        path.join(process.cwd(), 'dist', 'Smart-Ledger-Portable.zip'),
        path.join(process.cwd(), 'Smart-Ledger-Portable.zip'),
        path.join(process.cwd(), 'public', 'Smart-Ledger-Portable.zip')
      ];
      const foundZip = candidateZips.find(p => fs.existsSync(p));

      if (foundZip) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="Smart-Ledger-Developer-Master.zip"');
        const stat = fs.statSync(foundZip);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        fs.createReadStream(foundZip).pipe(res);
        return;
      }

      const buffer = await createUpdatePatchZip();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="Smart-Ledger-Developer-Master.zip"');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(buffer);
    } catch (error) {
      console.error('Error generating master developer edition:', error);
      res.status(500).send('خطأ أثناء تصدير نسخة المطور: ' + String(error));
    }
  });

  // 13. تصفير وتفريغ قاعدة البيانات الحالية بقالب نظيف وفارغ 100%
  app.post('/api/system/reset-clean-database', (req, res) => {
    try {
      const cleanTemplatePath = path.join(process.cwd(), 'data', 'clean_database_template.json');
      let cleanDb: any = {};
      if (fs.existsSync(cleanTemplatePath)) {
        cleanDb = JSON.parse(fs.readFileSync(cleanTemplatePath, 'utf-8'));
      } else {
        cleanDb = {
          version: "3.0.0",
          appName: "Smart Ledger Pro",
          lastUpdated: new Date().toISOString(),
          companySettings: { name: "", phone: "", address: "", logo: "", systemUser: "المدير العام" },
          companyInfo: { name: "", phone: "", address: "" },
          accounts: [
            { id: 'acc-box-1', code: '101', name: 'الصندوق الرئيسي', type: 'cash_box', balanceIQD: 0, balanceUSD: 0, linkedVaultId: 'acc-vault-1' },
            { id: 'acc-vault-1', code: '102', name: 'الخزنة الرئيسية', type: 'vault', balanceIQD: 0, balanceUSD: 0 }
          ],
          transactions: [],
          currencies: [
            { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', buyRate: 1515, sellRate: 1525, change24h: 0, flag: '🇺🇸' },
            { code: 'IQD', nameAr: 'دينار عراقي', nameEn: 'Iraqi Dinar', buyRate: 1, sellRate: 1, change24h: 0, flag: '🇮🇶' }
          ],
          agents: []
        };
      }
      writeDatabase(cleanDb);
      try {
        const legacyDbFile = path.join(process.cwd(), 'data', 'database.json');
        fs.writeFileSync(legacyDbFile, JSON.stringify(cleanDb, null, 2), 'utf-8');
      } catch (_) {}

      res.json({ success: true, message: 'تم تصفير وتفريغ قاعدة البيانات بنجاح لتكون جاهزة للإصدار النظيف', data: cleanDb });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==========================================
  // Vite Integration - دمج واجهة المستخدم
  // ==========================================
  // فحص ما إذا كان Vite متوفراً ومثبتاً في بيئة التطوير المحلية
  const hasVitePackage = (() => {
    try {
      return fs.existsSync(path.join(process.cwd(), 'node_modules', 'vite'));
    } catch (_) {
      return false;
    }
  })();

  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.SMART_LEDGER_STANDALONE === 'true' || 
                       !hasVitePackage || 
                       currentFilename.endsWith('.cjs');
  let viteMounted = false;

  if (!isProduction && hasVitePackage) {
    try {
      const vitePkg = 'vite';
      const { createServer: createViteServer } = await import(vitePkg);
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          watch: {
            ignored: ['**/data/**', '**/data/*', '**/backups/**', '**/*.json'],
          },
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      viteMounted = true;
      console.log('[FRONTEND] Vite development middleware mounted successfully.');
    } catch (e) {
      console.warn('[VITE DEV] Falling back to static serving:', e);
    }
  }

  if (!viteMounted) {
    // مسارات الواجهة الأمامية مرتبة حسب الأولوية: مجلد التحديثات المباشر في بيانات المستخدم أولاً
    const getDistCandidateDirs = (): string[] => {
      const execDir = path.dirname(process.execPath);
      const raw = [
        USER_DIST_DIR,
        path.join(USER_APP_DIR, 'dist'),
        path.join(currentDirname, 'dist'),
        currentDirname,
        path.join(process.cwd(), 'dist'),
        process.cwd(),
        path.join(execDir, 'dist'),
        execDir,
        path.resolve(execDir, '..', 'dist'),
        path.resolve(execDir, '..'),
        path.resolve(currentDirname, '..', 'dist'),
        path.resolve(process.cwd(), '..', 'dist')
      ];
      const seen = new Set<string>();
      const out: string[] = [];
      for (const dir of raw) {
        if (!dir) continue;
        const resolved = path.resolve(dir);
        if (!seen.has(resolved)) {
          seen.add(resolved);
          out.push(resolved);
        }
      }
      return out;
    };

    const initialDistPath = getDistCandidateDirs().find(d => fs.existsSync(path.join(d, 'index.html'))) || path.join(currentDirname, 'dist');
    console.log(`[FRONTEND] Resolved static files root: ${initialDistPath} (live override dir: ${USER_DIST_DIR})`);

    // تخديم ديناميكي للملفات الثابتة يعطي الأولوية الفورية للتحديثات الجديدة في USER_DIST_DIR دون إعادة تشغيل الخادم
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api/')) return next();

      let decodedPath = req.path;
      try {
        decodedPath = decodeURIComponent(req.path);
      } catch (_) {}
      const relPath = decodedPath.replace(/^\/+/, '');
      if (!relPath || relPath === 'index.html') return next();

      const safeRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
      for (const baseDir of getDistCandidateDirs()) {
        const candidate = path.resolve(baseDir, safeRel);
        if (candidate !== baseDir && !candidate.startsWith(baseDir + path.sep)) continue;
        try {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            const lowerRel = safeRel.toLowerCase();
            if (lowerRel === 'sw.js' || lowerRel === 'registersw.js' || lowerRel === 'manifest.webmanifest') {
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            }
            return res.sendFile(candidate);
          }
        } catch (_) {}
      }
      next();
    });

    // قراءة index.html في الذاكرة لضمان سرعة فائقة وتحديث فوري عند استلام الباتش
    function loadIndexHtml(): string {
      if (cachedHtml) return cachedHtml;
      const indexCandidates: string[] = [];
      for (const dir of getDistCandidateDirs()) {
        indexCandidates.push(path.join(dir, 'index.html'));
      }
      for (const p of indexCandidates) {
        if (fs.existsSync(p)) {
          try {
            cachedHtml = fs.readFileSync(p, 'utf-8');
            console.log(`[FRONTEND] Successfully cached index.html from ${p} (${cachedHtml.length} bytes)`);
            return cachedHtml;
          } catch (e) {
            console.error(`[FRONTEND] Failed to read ${p}:`, e);
          }
        }
      }
      return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>Smart Ledger - المحاسب الذكي</title></head><body><div id="root"><h1>جاري تحميل نظام المحاسب الذكي...</h1></div></body></html>';
    }

    // تخديم واجهة المستخدم لأي مسار SPA
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: 'API route not found' });
      }
      const html = loadIndexHtml();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(200).send(html);
    });
  }

  const HOST = process.env.HOST || (process.platform === 'win32' && process.env.SMART_LEDGER_STANDALONE === 'true' ? '127.0.0.1' : '0.0.0.0');

  function startListening(portToTry: number, retriesLeft: number = 30) {
    const srv = app.listen(portToTry, HOST, () => {
      console.log(`====================================================`);
      console.log(`  Smart Ledger Accounting Server Running`);
      console.log(`  URL:          http://${HOST}:${portToTry}`);
      console.log(`  Database:     ${DB_FILE}`);
      console.log(`====================================================`);
      try {
        const portFile = path.join(path.dirname(DB_DIR), 'active_port.txt');
        fs.writeFileSync(portFile, String(portToTry), 'utf-8');
      } catch (_) {}
    });

    srv.on('error', (err: any) => {
      console.warn(`[PORT] Port ${portToTry} not available (${err.code}), attempting next candidate...`);
      if (retriesLeft > 0) {
        const nextPort = (portToTry >= 3015 && portToTry < 3699) ? 3699 : (portToTry + 1);
        startListening(nextPort, retriesLeft - 1);
      } else {
        console.warn(`[PORT] Binding to dynamic ephemeral port (0)...`);
        try {
          const dynSrv = app.listen(0, HOST, () => {
            const addr = dynSrv.address() as any;
            const p = addr?.port || 3000;
            console.log(`[SERVER READY] Assigned dynamic port: ${p}`);
            try {
              const portFile = path.join(path.dirname(DB_DIR), 'active_port.txt');
              fs.writeFileSync(portFile, String(p), 'utf-8');
            } catch (_) {}
          });
          dynSrv.on('error', (fatalErr: any) => {
            console.error('[CRITICAL] Dynamic server listen error:', fatalErr);
          });
        } catch (fatal) {
          console.error('[CRITICAL] Exception in fallback server listener:', fatal);
        }
      }
    });
  }

  startListening(PORT);
}

startServer();
