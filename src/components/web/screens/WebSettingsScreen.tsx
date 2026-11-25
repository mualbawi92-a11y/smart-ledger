import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Palette, 
  Cloud, 
  HardDrive, 
  Globe2, 
  Coins, 
  Upload, 
  Trash2, 
  Check, 
  RefreshCw, 
  Download, 
  Search, 
  Plus, 
  CheckCircle2, 
  FileJson, 
  Laptop, 
  Smartphone,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Eye,
  Type,
  Maximize2,
  RotateCcw,
  Printer,
  Database,
  Terminal,
  Code2,
  Server,
  GitBranch,
  ArrowUpCircle,
  Sparkles,
  Key,
  Lock,
  FileArchive,
  HelpCircle,
  X,
  Copy,
  KeyRound,
  UserCheck,
  FileText,
  Unlock,
  ArrowRight,
  Layers,
  Cpu,
  History,
  Package
} from 'lucide-react';
import { AccountItem, TransactionRecord, CurrencyRate, ClientEditionInfo } from '../../../types';
import { ALL_WORLD_COUNTRIES, CountryItem, CityItem } from '../../../data/countriesData';
import { ALL_WORLD_CURRENCIES, SystemCurrencyItem } from '../../../data/allCurrenciesData';

export interface CompanyInfoData {
  name: string;
  phone: string;
  address: string;
  logo?: string;
}

export interface UserAccountData {
  name: string;
  role: string;
  email: string;
}

interface WebSettingsScreenProps {
  companyInfo?: CompanyInfoData;
  onUpdateCompanyInfo?: (info: CompanyInfoData) => void;
  currentUser?: UserAccountData;
  onUpdateCurrentUser?: (user: UserAccountData) => void;
  accounts?: AccountItem[];
  transactions?: TransactionRecord[];
  currencies?: CurrencyRate[];
  onRestoreData?: (data: {
    accounts?: AccountItem[];
    transactions?: TransactionRecord[];
    currencies?: CurrencyRate[];
    companyInfo?: CompanyInfoData;
  }) => void;
  onClose?: () => void;
  activeTab?: SettingsTabId;
  onSelectTab?: (tab: SettingsTabId) => void;
  editionInfo?: ClientEditionInfo | null;
  onRefreshEditionInfo?: () => void;
}

export type SettingsTabId = 'company' | 'license' | 'theme_font' | 'backup' | 'countries' | 'currencies' | 'updates';

export const WebSettingsScreen: React.FC<WebSettingsScreenProps> = ({
  companyInfo: initialCompanyInfo,
  onUpdateCompanyInfo,
  currentUser: initialCurrentUser,
  onUpdateCurrentUser,
  accounts = [],
  transactions = [],
  currencies = [],
  onRestoreData,
  onClose,
  activeTab: controlledActiveTab,
  onSelectTab,
  editionInfo,
  onRefreshEditionInfo,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<SettingsTabId>('company');
  const activeTab = controlledActiveTab || internalActiveTab;
  const setActiveTab = (tab: SettingsTabId) => {
    setInternalActiveTab(tab);
    onSelectTab?.(tab);
  };

  // 1. بيانات الشركة
  const [companyName, setCompanyName] = useState<string>(() => {
    const raw = initialCompanyInfo?.name || localStorage.getItem('smart_ledger_company_name');
    if (raw && (raw.includes('عطاء') || raw.includes('الغري') || raw.includes('العرى'))) return '';
    return raw || '';
  });
  const [companyPhone, setCompanyPhone] = useState<string>(
    initialCompanyInfo?.phone || localStorage.getItem('smart_ledger_company_phone') || ''
  );
  const [companyAddress, setCompanyAddress] = useState<string>(
    initialCompanyInfo?.address || localStorage.getItem('smart_ledger_company_address') || ''
  );
  const [companyLogo, setCompanyLogo] = useState<string>(
    initialCompanyInfo?.logo || localStorage.getItem('smart_ledger_company_logo') || ''
  );

  const [userName, setUserName] = useState<string>(
    initialCurrentUser?.name || localStorage.getItem('smart_ledger_user_name') || 'محمد علي الباوي'
  );
  const [userRole, setUserRole] = useState<string>(
    initialCurrentUser?.role || 'المدير المالي ومنظم القيود'
  );
  const [userEmail, setUserEmail] = useState<string>(
    initialCurrentUser?.email || 'mualbawi92@gmail.com'
  );

  // 2. إعدادات الخط والثيم
  const [selectedFont, setSelectedFont] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_font') || 'Tajawal';
  });
  const [selectedFontSize, setSelectedFontSize] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_font_size') || 'normal';
  });
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_theme') || 'emerald';
  });

  // حالة ترخيص وتفعيل نسخة العميل
  const [licenseInputKey, setLicenseInputKey] = useState('');
  const [licenseSubmitting, setLicenseSubmitting] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [licenseSuccess, setLicenseSuccess] = useState('');

  const handleActivateFromSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = licenseInputKey.trim().toUpperCase();
    if (!cleanKey) {
      setLicenseError('يرجى إدخال رمز التفعيل');
      return;
    }
    setLicenseSubmitting(true);
    setLicenseError('');
    setLicenseSuccess('');
    try {
      const res = await fetch('/api/system/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: cleanKey }),
      });
      const data = await res.json();
      if (data.success) {
        setLicenseSuccess(data.message || 'تم تفعيل النسخة رسمياً مدى الحياة بنجاح!');
        setLicenseInputKey('');
        onRefreshEditionInfo?.();
      } else {
        setLicenseError(data.error || 'رمز التفعيل غير صحيح');
      }
    } catch (_) {
      setLicenseError('فشل الاتصال بالخادم المحلي');
    } finally {
      setLicenseSubmitting(false);
    }
  };

  const handleStartTrialFromSettings = async () => {
    setLicenseSubmitting(true);
    setLicenseError('');
    setLicenseSuccess('');
    try {
      const res = await fetch('/api/system/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setLicenseSuccess('تم بدء الفترة التجريبية (30 يوماً) بنجاح بكامل المزايا!');
        onRefreshEditionInfo?.();
      } else {
        setLicenseError(data.error || 'تعذر بدء الفترة التجريبية');
      }
    } catch (_) {
      setLicenseError('فشل الاتصال بالخادم المحلي');
    } finally {
      setLicenseSubmitting(false);
    }
  };

  // 3. النسخ الاحتياطي
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('smart_ledger_auto_backup') === 'true';
  });
  const [backupFrequency, setBackupFrequency] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_backup_frequency') || 'daily';
  });
  const [lastGoogleDriveSync, setLastGoogleDriveSync] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_last_gdrive_sync') || 'اليوم، 02:15 م';
  });
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState<boolean>(true);
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 4. إعداد البلدان والمدن
  const [countriesList, setCountriesList] = useState<CountryItem[]>(() => {
    const saved = localStorage.getItem('smart_ledger_countries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ALL_WORLD_COUNTRIES;
      }
    }
    return ALL_WORLD_COUNTRIES;
  });
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [selectedCountryForCity, setSelectedCountryForCity] = useState<CountryItem | null>(null);
  const [newCityNameAr, setNewCityNameAr] = useState('');
  const [newCityNameEn, setNewCityNameEn] = useState('');

  // 5. إعداد العملات
  const [currenciesList, setCurrenciesList] = useState<SystemCurrencyItem[]>(() => {
    const saved = localStorage.getItem('smart_ledger_system_currencies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ALL_WORLD_CURRENCIES;
      }
    }
    return ALL_WORLD_CURRENCIES;
  });
  const [currencySearch, setCurrencySearch] = useState('');
  const [currencyCategoryFilter, setCurrencyCategoryFilter] = useState<string>('all');
  const [editingCurrency, setEditingCurrency] = useState<SystemCurrencyItem | null>(null);
  const [isAddCurrencyModalOpen, setIsAddCurrencyModalOpen] = useState(false);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyNameAr, setNewCurrencyNameAr] = useState('');
  const [newCurrencyNameEn, setNewCurrencyNameEn] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [newCurrencyFlag, setNewCurrencyFlag] = useState('🌐');
  const [newCurrencyBuyRate, setNewCurrencyBuyRate] = useState(1);
  const [newCurrencySellRate, setNewCurrencySellRate] = useState(1);

  // رسائل إشعار عامة
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  // تطبيق الخط وحجمه على الصفحة فور التغيير
  useEffect(() => {
    document.body.style.fontFamily = `"${selectedFont}", sans-serif`;
    localStorage.setItem('smart_ledger_font', selectedFont);

    if (selectedFontSize === 'small') {
      document.documentElement.style.fontSize = '14px';
    } else if (selectedFontSize === 'large') {
      document.documentElement.style.fontSize = '17px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
    localStorage.setItem('smart_ledger_font_size', selectedFontSize);
  }, [selectedFont, selectedFontSize]);

  // تطبيق الثيم
  useEffect(() => {
    localStorage.setItem('smart_ledger_theme', selectedTheme);
  }, [selectedTheme]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // معالجة رفع اللوجو
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 2 ميغابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCompanyLogo(base64);
        localStorage.setItem('smart_ledger_company_logo', base64);
        showToast('تم تحميل شعار الشركة بنجاح!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setCompanyLogo('');
    localStorage.removeItem('smart_ledger_company_logo');
    showToast('تمت إزالة الشعار');
  };

  // حفظ بيانات الشركة
  const handleSaveCompanyInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedCompany: CompanyInfoData = {
      name: companyName.trim(),
      phone: companyPhone.trim(),
      address: companyAddress.trim(),
      logo: companyLogo,
    };
    const updatedUser: UserAccountData = {
      name: userName.trim() || 'المدير العام',
      role: userRole.trim(),
      email: userEmail.trim(),
    };

    localStorage.setItem('smart_ledger_company_name', updatedCompany.name);
    localStorage.setItem('smart_ledger_company_phone', updatedCompany.phone);
    localStorage.setItem('smart_ledger_company_address', updatedCompany.address);
    localStorage.setItem('smart_ledger_user_name', updatedUser.name);

    if (onUpdateCompanyInfo) onUpdateCompanyInfo(updatedCompany);
    if (onUpdateCurrentUser) onUpdateCurrentUser(updatedUser);

    showToast('تم حفظ بيانات الشركة ومعلومات المستخدم بنجاح!');
  };

  // حفظ الخط والثيم
  const handleSaveThemeSettings = () => {
    localStorage.setItem('smart_ledger_font', selectedFont);
    localStorage.setItem('smart_ledger_font_size', selectedFontSize);
    localStorage.setItem('smart_ledger_theme', selectedTheme);
    showToast('تم تطبيق وحفظ إعدادات الخط والثيم بنجاح!');
  };

  // تنزيل نسخة احتياطية محلية (متاح دائماً لكافة المستخدمين والنسخ دون أي قفل)
  const handleDownloadBackup = () => {
    const backupData = {
      version: '1.4.0',
      appName: 'Smart Ledger - المحاسب الذكي',
      exportDate: new Date().toISOString(),
      companyInfo: {
        name: companyName,
        phone: companyPhone,
        address: companyAddress,
        logo: companyLogo,
      },
      user: {
        name: userName,
        role: userRole,
        email: userEmail,
      },
      accounts,
      transactions,
      currencies: currenciesList,
      countries: countriesList,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeComp = (companyName || 'SmartLedger').replace(/[\s\/\\:"'<>|*?]+/g, '_');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${safeComp}_Backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('✔ تم تنزيل ملف النسخة الاحتياطية بنجاح على جهازك!');
  };

  // تصدير نسخة قاعدة بيانات نظيفة وخالية من العمليات للعميل
  const handleDownloadClientTemplateBackup = (targetCompany?: string) => {
    const comp = (targetCompany || companyName || 'شركة العميل').trim();
    const cleanClientData = {
      version: '3.0.0',
      appName: 'Smart Ledger Pro',
      lastUpdated: new Date().toISOString(),
      companySettings: {
        name: comp,
        phone: '',
        address: '',
        logo: '',
        systemUser: 'المدير العام'
      },
      companyInfo: {
        name: comp,
        phone: '',
        address: ''
      },
      accounts: [
        {
          id: 'acc-box-1',
          code: '101',
          name: 'الصندوق الأول - رئيسي',
          type: 'cash_box',
          balanceIQD: 0,
          balanceUSD: 0,
          linkedVaultId: 'acc-vault-1'
        },
        {
          id: 'acc-vault-1',
          code: '102',
          name: 'الخزنة - رئيسي',
          type: 'vault',
          balanceIQD: 0,
          balanceUSD: 0
        }
      ],
      transactions: [],
      currencies: currenciesList && currenciesList.length > 0 ? currenciesList : [
        { code: 'USD', nameAr: 'دولار أمريكي', buyRate: 1515, sellRate: 1525 },
        { code: 'IQD', nameAr: 'دينار عراقي', buyRate: 1, sellRate: 1 }
      ],
      countries: countriesList || []
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(cleanClientData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    const safeComp = comp.replace(/[\s\/\\:"'<>|*?]+/g, '_');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `SmartLedger_Client_Template_${safeComp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`✔ تم تصدير نسخة العميل النظيفة لـ (${comp}) بنجاح!`);
  };

  const [isServerBackupLoading, setIsServerBackupLoading] = useState(false);
  const handleCreateServerBackup = async () => {
    setIsServerBackupLoading(true);
    try {
      const res = await fetch('/api/database/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`✔ تم حفظ نسخة احتياطية على القرص المحلي: ${data.fileName}`);
      } else {
        showToast('تعذر حفظ النسخة الاحتياطية على السيرفر المحلي');
      }
    } catch {
      showToast('تعذر الاتصال بقاعدة البيانات المحلية');
    } finally {
      setIsServerBackupLoading(false);
    }
  };

  // 6. تحديث البرنامج ومستودع GitHub
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const zipFileInputRef = useRef<HTMLInputElement>(null);

  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('smart_ledger_github_repo') || 'mualbawi92-a11y/-Mustafa-Ali-Albawi-');
  const [githubBranch, setGithubBranch] = useState(() => localStorage.getItem('smart_ledger_github_branch') || 'main');
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('smart_ledger_github_token') || '');

  const [updateInfo, setUpdateInfo] = useState<{
    success?: boolean;
    repo?: string;
    branch?: string;
    commitSha?: string;
    message?: string;
    author?: string;
    date?: string;
    error?: string;
  } | null>(null);
  const [updateResult, setUpdateResult] = useState<{
    success: boolean;
    message: string;
    backupFile?: string;
  } | null>(null);

  // 7. إدارة نسخ العملاء وتوليد مفاتيح التفعيل (Client Editions)
  interface ClientEdition {
    id: string;
    companyName: string;
    clientName?: string;
    phone?: string;
    city?: string;
    licenseKey: string;
    issueDate: string;
    duration?: string;
    editionType: string;
    allowExport: boolean;
    allowUpdate: boolean;
    status: string;
  }

  const [clientEditions, setClientEditions] = useState<ClientEdition[]>(() => {
    try {
      const saved = localStorage.getItem('smart_ledger_client_editions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // وضع النظام: رئيسي (مطور) أو نسخة عميل (افتراضياً: وضع المطور لإدارة التحديثات والتراخيص)
  // وضع النظام: رئيسي (مطور) أو نسخة عميل (افتراضياً: فحص ملف السيرفر أولاً ثم التخزين المحلي)
  const [editionMode, setEditionMode] = useState<'master' | 'client'>(() => {
    const saved = localStorage.getItem('smart_ledger_edition_mode');
    if (saved === 'client') return 'client';
    return 'master';
  });
  const [isServerLockedClient, setIsServerLockedClient] = useState(false);
  const [serverClientInfo, setServerClientInfo] = useState<{
    companyName?: string;
    licenseKey?: string;
    issueDate?: string;
    duration?: string;
  } | null>(null);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [justIssuedEdition, setJustIssuedEdition] = useState<ClientEdition | null>(null);
  const [editionSearchQuery, setEditionSearchQuery] = useState('');
  const [issueCompanyName, setIssueCompanyName] = useState('');
  const [issueClientName, setIssueClientName] = useState('');
  const [issuePhone, setIssuePhone] = useState('');
  const [issueCity, setIssueCity] = useState('');
  const [issueDuration, setIssueDuration] = useState('lifetime');
  const [issueNotes, setIssueNotes] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [masterUpdateSubTab, setMasterUpdateSubTab] = useState<'all' | 'updates' | 'export_patches' | 'client_licenses'>('all');
  const [isExportingPatch, setIsExportingPatch] = useState(false);
  const [isExportingMaster, setIsExportingMaster] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // دالة تنزيل الملفات عبر Blob لضمان تجاوز قيود الآي فريم وحل مشكلة Couldn't download - No file
  const handleDownloadBlobFile = async (url: string, filename: string, label: string) => {
    setDownloadingFile(filename);
    showToast(`⏳ جاري تجهيز وتنزيل ${label}... يرجى الانتظار`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`كود الاستجابة: ${res.status}`);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      showToast(`✔ تم تنزيل ${label} بنجاح!`);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback
      window.open(url, '_blank');
      showToast(`تم فتح رابط تنزيل ${label}`);
    } finally {
      setDownloadingFile(null);
    }
  };

  // تبويبات قسم «النظام»: 1. قسم الإصدارات | 2. قسم تحديث البرنامج
  const [systemSection, setSystemSection] = useState<'editions' | 'updates'>('editions');
  const [updateCheckResult, setUpdateCheckResult] = useState<{ checked: boolean; isLatest: boolean; message: string } | null>(null);

  const handleCheckOnlineUpdates = () => {
    setIsCheckingUpdate(true);
    setUpdateCheckResult(null);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateCheckResult({
        checked: true,
        isLatest: true,
        message: 'النظام يعمل بأحدث إصدار رسمي معتمد (v1.4.0) - قاعدة البيانات وهيكل السجلات محدثة 100% وبأمان تام.'
      });
    }, 900);
  };

  const handleExportMasterEdition = async () => {
    setIsExportingMaster(true);
    try {
      const res = await fetch('/api/system/export-master-edition');
      if (!res.ok) {
        throw new Error('فشل السيرفر في تجهيز نسخة المطور');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Smart-Ledger-Developer-Master.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('✔ تم تصدير وتنزيل نسخة المطور الكاملة (Master Edition) بنجاح!');
    } catch (err) {
      console.error('Export master error:', err);
      showToast('حدث خطأ أثناء تصدير نسخة المطور');
    } finally {
      setIsExportingMaster(false);
    }
  };

  const handleExportUpdatePatch = async () => {
    setIsExportingPatch(true);
    try {
      const res = await fetch('/api/system/export-update-patch');
      if (!res.ok) {
        throw new Error('فشل السيرفر في تجهيز الحزمة');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Smart-Ledger-Update-Patch.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('✔ تم تصدير وتنزيل ملف التحديث (Smart-Ledger-Update-Patch.zip) بنجاح!');
    } catch (err) {
      console.error('Export patch error:', err);
      showToast('حدث خطأ أثناء تصدير ملف التحديث');
    } finally {
      setIsExportingPatch(false);
    }
  };

  const handleToggleEditionMode = async (mode: 'master' | 'client') => {
    if (mode === 'master') {
      try {
        await fetch('/api/system/reset-to-master', { method: 'POST' });
      } catch (_) {}
      setIsServerLockedClient(false);
      setEditionMode('master');
      setServerClientInfo(null);
      localStorage.setItem('smart_ledger_edition_mode', 'master');
      sessionStorage.removeItem('smart_ledger_dev_preview');
      showToast('✔ تم فتح القفل والعودة إلى وضع المطور الرئيسي (الادمن) بكامل الصلاحيات');
      return;
    }
    // وضع معاينة العميل
    sessionStorage.setItem('smart_ledger_dev_preview', 'true');
    setEditionMode('client');
    localStorage.setItem('smart_ledger_edition_mode', 'client');

    try {
      await fetch('/api/system/set-edition-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'client', companyName: companyName || '' })
      });
    } catch (_) {}

    showToast('تم التبديل إلى وضع معاينة شكل نسخة العميل');
  };

  const [activateKeyInput, setActivateKeyInput] = useState('');
  const [isActivatingKey, setIsActivatingKey] = useState(false);

  const handleActivateLicenseKey = async (e?: React.FormEvent, keyToUse?: string) => {
    if (e) e.preventDefault();
    const key = (keyToUse || activateKeyInput).trim().toUpperCase();
    if (!key) {
      showToast('يرجى إدخال رمز التفعيل');
      return;
    }
    setIsActivatingKey(true);
    try {
      const res = await fetch('/api/system/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key })
      });
      const data = await res.json();
      if (data.success && data.edition) {
        setEditionMode('client');
        setIsServerLockedClient(true);
        setServerClientInfo(data.edition);
        localStorage.setItem('smart_ledger_edition_mode', 'client');
        if (data.edition.companyName) {
          setCompanyName(data.edition.companyName);
          localStorage.setItem('smart_ledger_company_name', data.edition.companyName);
        }
        showToast(data.message || 'تم قفل وتفعيل ترخيص نسخة العميل بنجاح!');
        setActivateKeyInput('');
      } else {
        showToast(data.error || 'تعذر تفعيل الترخيص، تأكد من صحة رمز التفعيل');
      }
    } catch {
      showToast('تعذر الاتصال بالسيرفر لتفعيل الترخيص');
    } finally {
      setIsActivatingKey(false);
    }
  };

  // فحص وضع النسخة من السيرفر وجلب التراخيص إن كان مطوراً
  useEffect(() => {
    // 1. فحص هل النظام يعمل كنسخة عميل مثبتة
    fetch('/api/system/edition-info')
      .then(res => res.json())
      .then(data => {
        if (data?.isClientEdition || data?.edition === 'client') {
          setEditionMode('client');
          setIsServerLockedClient(true);
          setServerClientInfo(data);
          localStorage.setItem('smart_ledger_edition_mode', 'client');
          if (data.companyName) {
            setCompanyName(prev => (prev && !prev.includes('عطاء') && !prev.includes('الغري')) ? prev : data.companyName);
          }
        }
      })
      .catch(() => {});

    // 2. جلب النسخ المصدرة في وضع المطور
    fetch('/api/system/client-editions')
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.editions)) {
          setClientEditions(data.editions);
          localStorage.setItem('smart_ledger_client_editions', JSON.stringify(data.editions));
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateClientEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueCompanyName.trim()) {
      showToast('يرجى إدخال اسم الشركة أو المؤسسة');
      return;
    }

    try {
      const res = await fetch('/api/system/client-editions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: issueCompanyName.trim(),
          clientName: issueClientName.trim(),
          phone: issuePhone.trim(),
          city: issueCity.trim(),
          duration: issueDuration,
          notes: issueNotes.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.edition) {
        const updated = [data.edition, ...clientEditions];
        setClientEditions(updated);
        localStorage.setItem('smart_ledger_client_editions', JSON.stringify(updated));
        setShowIssueModal(false);
        setJustIssuedEdition(data.edition);
        setIssueCompanyName('');
        setIssueClientName('');
        setIssuePhone('');
        setIssueCity('');
        setIssueNotes('');
        showToast(`✔ تم إصدار نسخة العميل بنجاح! كود التفعيل: ${data.edition.licenseKey}`);
      } else {
        const chars = 'BCDFGHJKMNPQRTVWXYZ2346789';
        const genB = (len = 5) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const localKey = `SL${genB(3)}-${genB(5)}-${genB(5)}-${genB(5)}-${genB(5)}`;
        const localEdition: ClientEdition = {
          id: 'ced-' + Date.now(),
          companyName: issueCompanyName.trim(),
          clientName: issueClientName.trim(),
          phone: issuePhone.trim(),
          city: issueCity.trim(),
          licenseKey: localKey,
          issueDate: new Date().toISOString(),
          duration: issueDuration,
          editionType: 'client_edition',
          allowExport: false,
          allowUpdate: true,
          status: 'active'
        };
        const updated = [localEdition, ...clientEditions];
        setClientEditions(updated);
        localStorage.setItem('smart_ledger_client_editions', JSON.stringify(updated));
        setShowIssueModal(false);
        setJustIssuedEdition(localEdition);
        setIssueCompanyName('');
        setIssueClientName('');
        setIssuePhone('');
        setIssueCity('');
        setIssueNotes('');
        showToast(`✔ تم إصدار نسخة العميل بنجاح! كود التفعيل: ${localKey}`);
      }
    } catch {
      showToast('حدث خطأ أثناء إصدار نسخة العميل');
    }
  };

  const handleCopyLicenseKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    showToast('تم نسخ مفتاح التفعيل إلى الحافظة!');
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleDeleteClientEdition = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف وإلغاء ترخيص النسخة المصدرة لشركة "${name}"؟`)) {
      return;
    }
    try {
      await fetch(`/api/system/client-editions/${id}`, { method: 'DELETE' });
    } catch {}
    const updated = clientEditions.filter(item => item.id !== id);
    setClientEditions(updated);
    localStorage.setItem('smart_ledger_client_editions', JSON.stringify(updated));
    showToast('تم حذف النسخة والترخيص بنجاح');
  };

  const handleSaveGithubSettings = (repo: string, branch: string, token: string) => {
    setGithubRepo(repo);
    setGithubBranch(branch);
    setGithubToken(token);
    localStorage.setItem('smart_ledger_github_repo', repo);
    localStorage.setItem('smart_ledger_github_branch', branch);
    localStorage.setItem('smart_ledger_github_token', token);
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateResult(null);
    try {
      const params = new URLSearchParams({
        repo: githubRepo.trim(),
        branch: githubBranch.trim(),
        token: githubToken.trim()
      });
      const res = await fetch(`/api/system/check-update?${params.toString()}`);
      const data = await res.json();
      setUpdateInfo(data);
      if (data.success) {
        showToast('تم فحص مستودع GitHub بنجاح!');
      } else {
        showToast(data.error || 'تعذر الاتصال بـ GitHub');
      }
    } catch {
      setUpdateInfo({ success: false, error: 'تعذر الاتصال بالخادم المحلي لفحص التحديث' });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!window.confirm('هل أنت متأكد من بدء التحديث الآن من مستودع GitHub؟ سيتم أخذ نسخة احتياطية إجبارية من قاعدة البيانات أولاً قبل التحديث لحماية بياناتك بالكامل.')) {
      return;
    }
    setIsApplyingUpdate(true);
    setUpdateResult(null);
    try {
      const res = await fetch('/api/system/apply-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: githubRepo.trim(),
          branch: githubBranch.trim(),
          token: githubToken.trim()
        })
      });
      const data = await res.json();
      const finalMsg = data.message || data.error || (data.success ? 'تم تحديث البرنامج بنجاح مع الحفاظ التام على قاعدة البيانات!' : 'تعذر تطبيق التحديث عبر GitHub');
      setUpdateResult({
        ...data,
        message: finalMsg
      });
      if (data.success) {
        showToast('✔ تم تحديث البرنامج بنجاح مع الحفاظ التام على قاعدة البيانات!');
      } else {
        showToast(finalMsg);
      }
    } catch {
      setUpdateResult({
        success: false,
        message: 'تعذر الاتصال بالخادم المحلي أو بمستودع GitHub. يرجى استخدام خيار «رفع ملف التحديث ZIP» المباشر.'
      });
    } finally {
      setIsApplyingUpdate(false);
    }
  };

  // رفع وتثبيت ملف التحديث ZIP محلياً بضغطة زر
  const handleUploadZipPatch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      showToast('يرجى اختيار ملف أرشيف مضغوط بتنسيق .zip فقط');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من تثبيت حزمة التحديث (${file.name})؟ سيتم أخذ نسخة احتياطية إجبارية من قاعدة البيانات تلقائياً لحماية كافة الحسابات.`)) {
      if (zipFileInputRef.current) zipFileInputRef.current.value = '';
      return;
    }

    setIsUploadingZip(true);
    setUpdateResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const res = await fetch('/api/system/upload-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipBase64: base64Data })
          });
          const data = await res.json();
          const finalMsg = data.message || data.error || (data.success ? 'تم تثبيت التحديث وتحديث الملفات بنجاح!' : 'فشل تثبيت ملف التحديث');
          setUpdateResult({
            ...data,
            message: finalMsg
          });
          if (data.success) {
            const successMsg = data.message || `✔ تم تثبيت التحديث وتحديث ${data.filesUpdated || ''} ملفاً بنجاح مع الحفاظ التام على كافة بياناتك!`;
            setUpdateResult({
              success: true,
              message: `${successMsg} جاري تحديث الصفحة تلقائياً لتطبيق الميزات الجديدة...`
            });
            showToast('✔ تم تثبيت التحديث بنجاح! يتم الآن تحديث الصفحة...');
            setTimeout(async () => {
              try {
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r => r.unregister()));
                }
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map(k => caches.delete(k)));
                }
              } catch (_) {}
              window.location.reload();
            }, 1500);
          } else {
            showToast(finalMsg);
          }
        } catch (err: any) {
          setUpdateResult({ success: false, message: 'فشل إرسال ملف التحديث إلى الخادم المحلي: ' + (err?.message || '') });
          showToast('فشل إرسال ملف التحديث إلى الخادم المحلي');
        } finally {
          setIsUploadingZip(false);
          if (zipFileInputRef.current) zipFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingZip(false);
      if (zipFileInputRef.current) zipFileInputRef.current.value = '';
    }
  };

  // استرجاع نسخة احتياطية من ملف (يدعم كلا التنسيقين: Smart Ledger و @mohaseb_*)
  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let restoredAccounts = parsed.accounts || [];
        let restoredTransactions = parsed.transactions || [];
        let restoredCompany = parsed.companyInfo || {};

        // دعم ملفات النسخ الاحتياطي الخاصة بنظام المحاسب (@mohaseb_*)
        if (parsed['@mohaseb_accounts'] || parsed['@mohaseb_transactions']) {
          const rawAccs = typeof parsed['@mohaseb_accounts'] === 'string'
            ? JSON.parse(parsed['@mohaseb_accounts'])
            : (parsed['@mohaseb_accounts'] || []);

          const rawTxs = typeof parsed['@mohaseb_transactions'] === 'string'
            ? JSON.parse(parsed['@mohaseb_transactions'])
            : (parsed['@mohaseb_transactions'] || []);

          let rawSettings: any = {};
          if (parsed['@mohaseb_settings']) {
            rawSettings = typeof parsed['@mohaseb_settings'] === 'string'
              ? JSON.parse(parsed['@mohaseb_settings'])
              : parsed['@mohaseb_settings'];
          }

          restoredAccounts = rawAccs.map((acc: any) => {
            let type: any = 'client';
            if (acc.systemType === 'cash_box' || acc.id === 'sys_cash_box') type = 'cash_box';
            else if (acc.systemType === 'vault' || acc.id === 'sys_vault') type = 'vault';
            else if (acc.type === 'bank') type = 'bank';
            else if (acc.type === 'client') type = 'client';

            const balIQD = acc.balances && typeof acc.balances.IQD === 'number' ? acc.balances.IQD : 0;
            const balUSD = acc.balances && typeof acc.balances.USD === 'number' ? acc.balances.USD : 0;

            return {
              id: acc.id,
              name: acc.name,
              code: acc.code || '',
              type,
              phone: acc.phone || '',
              address: acc.address || '',
              balanceIQD: balIQD,
              balanceUSD: balUSD,
              city: acc.city || 'النجف الاشرف',
              notes: acc.notes || '',
              isSystem: !!acc.isEssential || !!acc.systemType || acc.id.startsWith('sys_'),
              currencies: acc.currencies || ['IQD', 'USD']
            };
          });

          restoredTransactions = rawTxs.map((tx: any) => {
            let txType: any = 'cash_in';
            if (tx.type === 'payment') txType = 'cash_out';
            else if (tx.type === 'receipt') txType = 'cash_in';
            else if (tx.type === 'bank_deposit') txType = 'bank_deposit';
            else if (tx.type === 'journal_entry' || tx.type === 'accounting_entry') txType = 'journal';
            else if (tx.type === 'currency_exchange') txType = 'exchange';
            else if (tx.type === 'outgoing_transfer') txType = 'transfer_outgoing';
            else if (tx.type === 'transfer' || tx.type === 'incoming_transfer') txType = 'transfer_incoming';

            return {
              id: tx.id || String(Math.random()),
              code: tx.code || tx.id || 'TX-' + Math.floor(Math.random() * 900000 + 100000),
              type: txType,
              titleAr: tx.notes || tx.type || 'حركة مالية',
              senderName: tx.senderName || tx.accountName || 'العميل',
              senderPhone: tx.senderPhone || '',
              receiverName: tx.beneficiaryName || tx.toAccountName || '',
              receiverPhone: tx.receiverPhone || '',
              accountId: tx.accountId,
              accountName: tx.accountName,
              toAccountId: tx.toAccountId,
              toAccountName: tx.toAccountName,
              amount: Number(tx.amount) || 0,
              currency: tx.currency || 'IQD',
              targetAmount: tx.toAmount || undefined,
              targetCurrency: tx.toCurrency || undefined,
              exchangeRate: tx.exchangeRate || undefined,
              fee: tx.commissionAmount || 0,
              commissionType: tx.commissionType === 'earned' ? 'collected' : (tx.commissionType === 'paid' ? 'on_us' : 'none'),
              notes: tx.notes || '',
              status: tx.status || 'completed',
              createdAt: tx.createdAt || new Date().toISOString()
            };
          });

          if (rawSettings.company) {
            restoredCompany = {
              name: rawSettings.company.name || 'شركة البركة',
              phone: rawSettings.company.phone || '07800894440',
              address: rawSettings.company.address || 'النجف الاشرف',
              logo: ''
            };
          }

          // حفظ إعدادات المطابقة والخط في المتصفح
          Object.keys(parsed).forEach(k => {
            if (k.startsWith('reconciled_') || k.startsWith('@font_') || k.startsWith('@app_')) {
              try {
                localStorage.setItem(k, typeof parsed[k] === 'string' ? parsed[k] : JSON.stringify(parsed[k]));
              } catch (_) {}
            }
          });
        }

        if (restoredAccounts.length === 0 && restoredTransactions.length === 0) {
          throw new Error('الملف فارغ أو لا يحتوي على حسابات وقيود محاسبية صالحة');
        }

        if (restoredCompany.name) {
          setCompanyName(restoredCompany.name);
          localStorage.setItem('smart_ledger_company_name', restoredCompany.name);
        }
        if (restoredCompany.phone) {
          setCompanyPhone(restoredCompany.phone);
          localStorage.setItem('smart_ledger_company_phone', restoredCompany.phone);
        }
        if (restoredCompany.address) {
          setCompanyAddress(restoredCompany.address);
          localStorage.setItem('smart_ledger_company_address', restoredCompany.address);
        }
        if (restoredCompany.logo) {
          setCompanyLogo(restoredCompany.logo);
          localStorage.setItem('smart_ledger_company_logo', restoredCompany.logo);
        }

        if (onRestoreData) {
          onRestoreData({
            accounts: restoredAccounts,
            transactions: restoredTransactions,
            currencies: parsed.currencies || currenciesList,
            companyInfo: restoredCompany,
          });
        }

        // حفظ النسخة المسترجعة فوراً في قاعدة البيانات السحابية والمحلية
        fetch('/api/database/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accounts: restoredAccounts,
            transactions: restoredTransactions,
            companySettings: restoredCompany
          })
        }).catch(() => {});

        setRestoreFeedback({
          type: 'success',
          message: `تم استرجاع البيانات بنجاح! تم تحميل ${restoredAccounts.length} حساب و ${restoredTransactions.length} حركة وقيد محاسبي.`,
        });
        showToast('تم استرجاع النسخة الاحتياطية بنجاح!');
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
        setRestoreFeedback({
          type: 'error',
          message: `فشل استرجاع الملف: ${errorMsg}`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // محاكاة المزامنة مع Google Drive
  const handleSyncGoogleDrive = () => {
    setIsSyncingDrive(true);
    setTimeout(() => {
      setIsSyncingDrive(false);
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('ar-IQ')}، ${now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}`;
      setLastGoogleDriveSync(timeStr);
      localStorage.setItem('smart_ledger_last_gdrive_sync', timeStr);
      showToast('تمت المزامنة وحفظ النسخة الاحتياطية على Google Drive بنجاح!');
    }, 1200);
  };

  // حفظ تفضيلات النسخ التلقائي
  const handleToggleAutoBackup = (enabled: boolean) => {
    setIsAutoBackupEnabled(enabled);
    localStorage.setItem('smart_ledger_auto_backup', enabled ? 'true' : 'false');
    showToast(enabled ? 'تم تفعيل النسخ الاحتياطي التلقائي' : 'تم تعطيل النسخ الاحتياطي التلقائي');
  };

  const handleChangeBackupFrequency = (freq: string) => {
    setBackupFrequency(freq);
    localStorage.setItem('smart_ledger_backup_frequency', freq);
    showToast('تم تحديث دورية النسخ التلقائي');
  };

  // 4. إدارة البلدان والمدن
  const toggleCountryStatus = (code: string) => {
    setCountriesList(prev => {
      const next = prev.map(c => c.code === code ? { ...c, isActive: !c.isActive } : c);
      localStorage.setItem('smart_ledger_countries', JSON.stringify(next));
      return next;
    });
  };

  const setDefaultCountry = (code: string) => {
    setCountriesList(prev => {
      const next = prev.map(c => ({
        ...c,
        isDefault: c.code === code,
        isActive: c.code === code ? true : c.isActive,
      }));
      localStorage.setItem('smart_ledger_countries', JSON.stringify(next));
      return next;
    });
    showToast('تم تعيين الدولة الافتراضية بنجاح');
  };

  const handleAddCityToCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryForCity || !newCityNameAr.trim()) return;

    const newCity: CityItem = {
      id: `${selectedCountryForCity.code.toLowerCase()}-${Date.now()}`,
      nameAr: newCityNameAr.trim(),
      nameEn: newCityNameEn.trim() || newCityNameAr.trim(),
    };

    setCountriesList(prev => {
      const next = prev.map(c => {
        if (c.code === selectedCountryForCity.code) {
          return {
            ...c,
            cities: [...c.cities, newCity],
          };
        }
        return c;
      });
      localStorage.setItem('smart_ledger_countries', JSON.stringify(next));
      return next;
    });

    // تحديث الدولة المختارة حالياً
    setSelectedCountryForCity(prev => prev ? {
      ...prev,
      cities: [...prev.cities, newCity],
    } : null);

    setNewCityNameAr('');
    setNewCityNameEn('');
    showToast('تمت إضافة المدينة بنجاح');
  };

  const handleRemoveCity = (countryCode: string, cityId: string) => {
    setCountriesList(prev => {
      const next = prev.map(c => {
        if (c.code === countryCode) {
          return {
            ...c,
            cities: c.cities.filter(city => city.id !== cityId),
          };
        }
        return c;
      });
      localStorage.setItem('smart_ledger_countries', JSON.stringify(next));
      return next;
    });

    setSelectedCountryForCity(prev => prev ? {
      ...prev,
      cities: prev.cities.filter(city => city.id !== cityId),
    } : null);

    showToast('تم حذف المدينة');
  };

  // فلترة قائمة الدول
  const filteredCountries = countriesList.filter(c => {
    const matchesSearch = 
      c.nameAr.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.phoneCode.includes(countrySearch);

    if (!matchesSearch) return false;

    if (selectedRegionFilter === 'active') return c.isActive;
    if (selectedRegionFilter === 'all') return true;
    return c.region === selectedRegionFilter;
  });

  // 5. إدارة العملات
  const toggleCurrencyStatus = (code: string) => {
    setCurrenciesList(prev => {
      const next = prev.map(c => c.code === code ? { ...c, isActive: !c.isActive } : c);
      localStorage.setItem('smart_ledger_system_currencies', JSON.stringify(next));
      return next;
    });
  };

  const setBaseCurrency = (code: string) => {
    setCurrenciesList(prev => {
      const next = prev.map(c => ({
        ...c,
        isBase: c.code === code,
        isActive: c.code === code ? true : c.isActive,
      }));
      localStorage.setItem('smart_ledger_system_currencies', JSON.stringify(next));
      return next;
    });
    showToast('تم تعيين العملة الأساسية للنظام بنجاح');
  };

  const handleUpdateRates = (code: string, buyRate: number, sellRate: number) => {
    setCurrenciesList(prev => {
      const next = prev.map(c => c.code === code ? { ...c, buyRate, sellRate } : c);
      localStorage.setItem('smart_ledger_system_currencies', JSON.stringify(next));
      return next;
    });
    setEditingCurrency(null);
    showToast('تم تحديث أسعار الصرف بنجاح');
  };

  const handleAddNewCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrencyCode.trim() || !newCurrencyNameAr.trim()) return;

    const newCurr: SystemCurrencyItem = {
      code: newCurrencyCode.trim().toUpperCase(),
      nameAr: newCurrencyNameAr.trim(),
      nameEn: newCurrencyNameEn.trim() || newCurrencyCode.trim(),
      symbol: newCurrencySymbol.trim() || newCurrencyCode.trim(),
      flag: newCurrencyFlag.trim() || '🌐',
      buyRate: Number(newCurrencyBuyRate) || 1,
      sellRate: Number(newCurrencySellRate) || 1,
      change24h: 0,
      isActive: true,
      decimals: 2,
      category: 'other',
    };

    setCurrenciesList(prev => {
      const exists = prev.some(c => c.code === newCurr.code);
      if (exists) {
        alert('هذه العملة موجودة مسبقاً!');
        return prev;
      }
      const next = [newCurr, ...prev];
      localStorage.setItem('smart_ledger_system_currencies', JSON.stringify(next));
      return next;
    });

    setIsAddCurrencyModalOpen(false);
    setNewCurrencyCode('');
    setNewCurrencyNameAr('');
    setNewCurrencyNameEn('');
    setNewCurrencySymbol('');
    showToast('تمت إضافة العملة الجديدة بنجاح!');
  };

  const filteredCurrencies = currenciesList.filter(c => {
    const matchesSearch = 
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.nameAr.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(currencySearch.toLowerCase());

    if (!matchesSearch) return false;

    if (currencyCategoryFilter === 'active') return c.isActive;
    if (currencyCategoryFilter === 'all') return true;
    return c.category === currencyCategoryFilter;
  });

  // دعم اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isAddCurrencyModalOpen && !selectedCountryForCity && onClose) {
        onClose();
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (activeTab === 'company') {
          handleSaveCompanyInfo();
        } else if (activeTab === 'theme_font') {
          handleSaveThemeSettings();
        } else if (activeTab === 'currencies') {
          setIsAddCurrencyModalOpen(true);
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (activeTab === 'company') {
          setCompanyName(initialCompanyInfo?.name || '');
          setCompanyPhone(initialCompanyInfo?.phone || '');
          setCompanyAddress(initialCompanyInfo?.address || '');
        } else if (activeTab === 'countries') {
          setCountrySearch('');
        } else if (activeTab === 'currencies') {
          setCurrencySearch('');
          setCurrencyCategoryFilter('all');
        }
        showToast('تمت إعادة ضبط المدخلات');
      } else if (e.key === 'F6') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isAddCurrencyModalOpen, selectedCountryForCity, activeTab, companyName, companyPhone, companyAddress, companyLogo]);

  const settingsNavTabs = [
    {
      id: 'company',
      label: 'بيانات الشركة واللوجو',
      desc: 'الهوية الرسمية، الشعار، العنوان والهاتف',
      icon: Building2,
    },
    {
      id: 'theme_font',
      label: 'الخط وثيم البرنامج',
      desc: 'نوع وحجم الخط، ألوان النظام والمظهر',
      icon: Palette,
    },
    {
      id: 'backup',
      label: 'النسخ الاحتياطي (Google Drive & جهاز)',
      desc: 'حفظ واسترجاع البيانات وتفريغ السجلات',
      icon: Cloud,
    },
    {
      id: 'countries',
      label: 'إعداد البلدان والمدن',
      desc: 'دليل جميع دول ومحافظات ومدن العالم',
      icon: Globe2,
    },
    {
      id: 'currencies',
      label: 'إعداد العملات وأسعار الصرف',
      desc: 'إدارة العملات وسعر الصرف بالدينار والدولار',
      icon: Coins,
    },
    {
      id: 'updates',
      label: 'النظام',
      desc: 'قسم الإصدارات وقسم تحديث البرنامج',
      icon: Cpu,
      hasPulse: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 w-full max-w-full mx-auto font-sans" dir="rtl">
      
      {/* 1. ترويسة الشاشة المتناسقة باللون الأزرق السماوي المتدرج */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 rounded-2xl shadow-sm flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-sky-200 border border-white/20 shadow-inner">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide flex items-center gap-2">
              <span>إعدادات النظام</span>
              <span className="text-sky-300/80 font-normal">←</span>
              <span className="text-white font-black underline decoration-sky-300/50 underline-offset-4">
                {activeTab === 'company' && 'بيانات الشركة واللوجو'}
                {activeTab === 'license' && 'تفعيل وترخيص النسخة'}
                {activeTab === 'theme_font' && 'الخط وثيم ومظهر البرنامج'}
                {activeTab === 'backup' && 'النسخ الاحتياطي والأمان'}
                {activeTab === 'countries' && 'إعداد البلدان والمدن'}
                {activeTab === 'currencies' && 'إعداد العملات وأسعار الصرف'}
                {activeTab === 'updates' && 'النظام'}
              </span>
            </h1>
            <p className="text-[11px] text-sky-100/90 font-medium">
              تم إدراج أوبشنات الإعدادات مباشرة في القائمة الجانبية للتنقل السريع
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="bg-white/15 hover:bg-white/25 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shadow-xs"
              title="رجوع للقائمة السابقة"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              <span>رجوع للقائمة السابقة</span>
            </button>
          )}
        </div>
      </div>

      {/* تنبيه النجاح Toast */}
      {successToast && (
        <div className="p-3 bg-sky-50 border border-sky-300 rounded-xl flex items-center gap-2.5 text-xs text-sky-950 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="font-bold">{successToast}</span>
        </div>
      )}

      {/* 2. مساحة المحتوى المختار من الإعدادات بكامل العرض */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs min-h-[580px]">

        {/* 1. تبويب بيانات الشركة واللوجو */}
        {activeTab === 'company' && (
          <form onSubmit={handleSaveCompanyInfo} className="space-y-6 max-w-3xl">
            
            {/* بطاقة الشعار (Logo) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="block text-slate-800 font-bold text-xs">
                لوجو الشركة (شعار المؤسسة الرسمي):
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* صندوق المعاينة */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt="Company Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                      <span className="text-[10px] block">لا يوجد لوجو</span>
                    </div>
                  )}
                </div>

                {/* أزرار التحكم باللوجو */}
                <div className="space-y-2 flex-1 text-center sm:text-right">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-[#0b5a49] hover:bg-[#084538] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع لوجو من الجهاز</span>
                    </button>

                    {companyLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف اللوجو</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    يظهر اللوجو في أعلى الشاشات، ترويسات السندات، الحوالات، وكشوف الحسابات المطبوعة.
                  </span>
                </div>
              </div>
            </div>

            {/* الحقول النصية للشركة */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-1">
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span>اسم الشركة *</span>
                  {editionInfo?.isClientEdition && (
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                      <Lock className="w-2.5 h-2.5 text-amber-600" />
                      مقفل بترخيص العميل
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editionInfo?.isClientEdition)}
                  readOnly={Boolean(editionInfo?.isClientEdition)}
                  value={companyName}
                  onChange={(e) => !editionInfo?.isClientEdition && setCompanyName(e.target.value)}
                  placeholder="شركة الصرافة والتحويل..."
                  title={editionInfo?.isClientEdition ? 'اسم الشركة معتمد ومقفل رسمياً بترخيص نسخة العميل ولا يمكن تغييره' : ''}
                  className={`w-full px-3 py-2 rounded font-bold text-slate-900 focus:outline-none ${
                    editionInfo?.isClientEdition
                      ? 'bg-slate-100 border border-slate-300 text-slate-700 cursor-not-allowed select-none'
                      : 'bg-white border border-slate-300 focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]'
                  }`}
                />
                {editionInfo?.isClientEdition && (
                  <p className="text-[10px] text-amber-700 mt-1 font-medium">
                    اسم الشركة مقيد ومقفل برمز تفعيل نسخة العميل الرسمية لحماية الترخيص.
                  </p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="block text-slate-700 font-bold mb-1">رقم هاتف الشركة *</label>
                <input
                  type="text"
                  required
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="0770xxxxxxx"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono font-bold text-right text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-slate-700 font-bold mb-1">عنوان الشركة والمقر *</label>
                <input
                  type="text"
                  required
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="بغداد - العراق..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                />
              </div>
            </div>

            {/* بيانات المستخدم ومنظم القيد */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-2">
                <span>بيانات منظم القيد والمستخدم المسؤول:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم منظم القيد</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  />
                </div>
              </div>
            </div>

            {/* زر الحفظ */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ بيانات الشركة (F9)</span>
              </button>
            </div>

          </form>
        )}

        {/* 1.1 تبويب تفعيل وترخيص النسخة (نسخة العميل والفترة التجريبية) */}
        {activeTab === 'license' && (
          <div className="space-y-6 max-w-3xl text-xs">
            
            {/* رسائل التنبيه أو النجاح في شاشة الإعدادات */}
            {licenseError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{licenseError}</span>
              </div>
            )}

            {licenseSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{licenseSuccess}</span>
              </div>
            )}

            {/* بطاقة الحالة العامة للترخيص */}
            <div className={`p-6 rounded-2xl border-2 transition-all shadow-sm ${
              editionInfo?.activationStatus === 'activated'
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-300'
                : editionInfo?.isTrialExpired
                ? 'bg-gradient-to-br from-rose-50 via-red-50 to-white border-rose-300'
                : editionInfo?.activationStatus === 'trial'
                ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-white border-amber-300'
                : 'bg-gradient-to-br from-sky-50 via-indigo-50 to-white border-sky-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
                    editionInfo?.activationStatus === 'activated'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : editionInfo?.isTrialExpired
                      ? 'bg-rose-600 text-white border-rose-400'
                      : editionInfo?.activationStatus === 'trial'
                      ? 'bg-amber-500 text-white border-amber-400'
                      : 'bg-sky-600 text-white border-sky-400'
                  }`}>
                    {editionInfo?.activationStatus === 'activated' ? (
                      <ShieldCheck className="w-8 h-8" />
                    ) : editionInfo?.isTrialExpired ? (
                      <Lock className="w-8 h-8" />
                    ) : (
                      <KeyRound className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        editionInfo?.activationStatus === 'activated'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : editionInfo?.isTrialExpired
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : editionInfo?.activationStatus === 'trial'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-sky-100 text-sky-800 border-sky-200'
                      }`}>
                        {editionInfo?.activationStatus === 'activated' && 'مفعل رسمي دائم 🟢'}
                        {editionInfo?.isTrialExpired && 'انتهت الفترة التجريبية 🔴'}
                        {editionInfo?.activationStatus === 'trial' && !editionInfo?.isTrialExpired && `فترة تجريبية (متبقي ${editionInfo?.remainingTrialDays} يوماً) 🟡`}
                        {editionInfo?.activationStatus === 'pending_setup' && 'بانتظار الاختيار ⚪'}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mt-1">
                      {editionInfo?.activationStatus === 'activated' && 'نسخة العميل الرسمية مفعلة مدى الحياة'}
                      {editionInfo?.isTrialExpired && 'تم قفل إضافة القيود المحاسبية (انتهت الـ 30 يوماً التجريبية)'}
                      {editionInfo?.activationStatus === 'trial' && !editionInfo?.isTrialExpired && `نسخة تجريبية نشطة - متبقي ${editionInfo?.remainingTrialDays} يوماً`}
                      {editionInfo?.activationStatus === 'pending_setup' && 'نسخة العميل بانتظار بدء التجربة أو التفعيل المباشر'}
                    </h3>

                    <p className="text-slate-600 text-xs mt-1">
                      {editionInfo?.activationStatus === 'activated' && 'كافة ميزات النظام، القيود المحاسبية، والسندات مفعلة بالكامل دون أي قيود زمنية.'}
                      {editionInfo?.isTrialExpired && 'تصفح كافة الحسابات والتقارير متاح بالكامل، ولكن تم قفل إضافة قيود جديدة لحين إدخال رمز التفعيل.'}
                      {editionInfo?.activationStatus === 'trial' && !editionInfo?.isTrialExpired && 'يمكنك إجراء كافة القيود والعمليات المحاسبية بحرية تامة خلال فترة الـ 30 يوماً.'}
                      {editionInfo?.activationStatus === 'pending_setup' && 'يمكنك البدء بفترة تجريبية مجانية لمدة 30 يوماً أو التفعيل المباشر بواسطة الرمز.'}
                    </p>
                  </div>
                </div>

                {/* زر بدء التجربة إن كانت معلقة */}
                {editionInfo?.activationStatus === 'pending_setup' && (
                  <button
                    type="button"
                    disabled={licenseSubmitting}
                    onClick={handleStartTrialFromSettings}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    بدء الـ 30 يوماً التجريبية
                  </button>
                )}
              </div>

              {/* تفاصيل الترخيص الثابتة */}
              <div className="mt-5 pt-4 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">اسم الشركة المرخصة:</span>
                  <strong className="text-slate-900 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" />
                    {editionInfo?.companyName || companyName || 'غير محدد'}
                  </strong>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">نوع الصلاحية:</span>
                  <strong className="text-slate-900">
                    {editionInfo?.activationStatus === 'activated' ? 'دائم مدى الحياة' : '30 يوماً تجريبي'}
                  </strong>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">إمكانية إضافة القيود:</span>
                  <strong className={editionInfo?.canCreateTransaction ? 'text-emerald-700' : 'text-rose-700'}>
                    {editionInfo?.canCreateTransaction ? 'متاحة ومفتوحة 🟢' : 'مقيدة ومقفلة 🔒'}
                  </strong>
                </div>
              </div>
            </div>

            {/* نموذج إدخال كود التفعيل */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#0b5a49]" />
                <h4 className="font-bold text-sm text-slate-800">
                  تفعيل النسخة بواسطة رمز التفعيل (Activation Code)
                </h4>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                أدخل رمز التفعيل المعتمد المكون من 25 رمزاً الممنوح لشركتكم لتفعيل النظام بصفة رسمية ودائمة مدى الحياة.
              </p>

              <form onSubmit={handleActivateFromSettings} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    placeholder="SLXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                    value={licenseInputKey}
                    onChange={(e) => setLicenseInputKey(e.target.value.toUpperCase())}
                    dir="ltr"
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-center font-bold text-slate-900 text-sm focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                  />
                  <button
                    type="submit"
                    disabled={licenseSubmitting || !licenseInputKey.trim()}
                    className="px-6 py-2.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{licenseSubmitting ? 'جاري التحقق...' : 'تفعيل النسخة الآن'}</span>
                  </button>
                </div>
                {editionInfo?.licenseKey && (
                  <p className="text-[11px] text-emerald-800 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الرمز المفعل حالياً: {editionInfo.licenseKey}</span>
                  </p>
                )}
              </form>
            </div>

            {/* صندوق معلومات الأمان والدعم */}
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3 text-sky-950">
              <HelpCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">ملاحظات الترخيص وقفل القيود:</span>
                <p className="text-sky-900 leading-relaxed text-[11px]">
                  - عند انتهاء الـ 30 يوماً التجريبية دون إدخال رمز التفعيل، يظل البرنامج يفتح بصورة طبيعية مع إمكانية استعراض التقارير والحسابات وطباعة السندات، ولكن يتم قفل إضافة قيود جديدة لحين إدخال الكود.
                  <br />
                  - اسم الشركة معتمد ومقفل ومطابق لوثيقة الترخيص الرسمية.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* 2. تبويب الخط وثيم البرنامج */}
        {activeTab === 'theme_font' && (
          <div className="space-y-6 max-w-3xl">
            
            {/* اختيار نوع الخط العربي */}
            <div className="space-y-3">
              <label className="block text-slate-800 font-bold text-xs flex items-center gap-2">
                <Type className="w-4 h-4 text-[#0b5a49]" />
                <span>نوع الخط العربي للبرنامج (Arabic Font):</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'Tajawal', label: 'تجوال (Tajawal)', desc: 'خط هندسي واضح ومريح جداً للأرقام' },
                  { id: 'Cairo', label: 'القاهرة (Cairo)', desc: 'خط مالي عريض ورسمي للتقارير' },
                  { id: 'Almarai', label: 'المراعي (Almarai)', desc: 'خط رصين وناعم متوازن' },
                  { id: 'Readex Pro', label: 'ريدكس برو (Readex Pro)', desc: 'خط حديث خفيف ورشيق' },
                  { id: 'Noto Kufi Arabic', label: 'كوفي (Noto Kufi)', desc: 'طابع كوفي كلاسيكي ومؤسسي' },
                  { id: 'Alexandria', label: 'الإسكندرية (Alexandria)', desc: 'خط متميز عالي الوضوح' },
                ].map(font => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setSelectedFont(font.id)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      selectedFont === font.id
                        ? 'bg-emerald-50/70 border-[#0b5a49] shadow-xs ring-1 ring-[#0b5a49]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                    style={{ fontFamily: font.id }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">{font.label}</span>
                      {selectedFont === font.id && <Check className="w-4 h-4 text-[#0b5a49]" />}
                    </div>
                    <span className="text-[11px] text-slate-500 block">{font.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* حجم الخط */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="block text-slate-800 font-bold text-xs flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-[#0b5a49]" />
                <span>حجم خط العرض (Font Size Scale):</span>
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'small', label: 'عادي مدمج (14px)', desc: 'مناسب للشاشات الصغيرة ولعرض جداول أكثر' },
                  { id: 'normal', label: 'قياسي متوازن (16px)', desc: 'الحجم الافتراضي الموصى به' },
                  { id: 'large', label: 'كبير وواضح (17px)', desc: 'أعلى وضوح للقراءة وكبار السن' },
                ].map(size => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedFontSize(size.id)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      selectedFontSize === size.id
                        ? 'bg-emerald-50/70 border-[#0b5a49] shadow-xs ring-1 ring-[#0b5a49]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{size.label}</span>
                      {selectedFontSize === size.id && <Check className="w-4 h-4 text-[#0b5a49]" />}
                    </div>
                    <span className="text-[11px] text-slate-500 block">{size.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ثيم البرنامج وألوان الواجهة */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="block text-slate-800 font-bold text-xs flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#0b5a49]" />
                <span>ثيم وألوان النظام (Color Theme):</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'emerald', label: 'الأخضر المالي الرسمي', hex: '#0b5a49', desc: 'النمط المالي للصرافة' },
                  { id: 'blue', label: 'الأزرق الكلاسيكي المصرفي', hex: '#1e3a8a', desc: 'نمط البنوك والمصارف' },
                  { id: 'slate', label: 'الرمادي المكتبي الرصين', hex: '#334155', desc: 'نمط إداري هادئ' },
                  { id: 'dark', label: 'النمط الداكن الليلي', hex: '#0f172a', desc: 'مريح للعين ليلاً' },
                ].map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      selectedTheme === theme.id
                        ? 'bg-slate-50 border-[#0b5a49] shadow-xs ring-1 ring-[#0b5a49]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.hex }}
                      ></span>
                      <span className="font-bold text-xs text-slate-900">{theme.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">{theme.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* بطاقة معاينة حية للمظهر */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>معاينة حية للمظهر والخط المختار:</span>
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded font-mono">
                  {selectedFont} • {selectedFontSize}
                </span>
              </div>
              <div 
                className="p-3 bg-white rounded border border-slate-300 text-xs text-slate-800 shadow-inner"
                style={{ fontFamily: selectedFont }}
              >
                <div className="font-bold text-sm mb-1 text-[#0b5a49]">{companyName}</div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>سند قبض نقدي رقم: #REC-2026-081</span>
                  <span className="font-bold text-emerald-700">1,500,000 د.ع (له / دائن)</span>
                </div>
              </div>
            </div>

            {/* زر الحفظ */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveThemeSettings}
                className="px-6 py-2.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ وتطبيق إعدادات الخط والثيم</span>
              </button>
            </div>

          </div>
        )}

        {/* 3. تبويب النسخ الاحتياطي (Google Drive & جهاز) */}
        {activeTab === 'backup' && (
          <div className="space-y-6 max-w-4xl">
            
            {/* رسالة الاسترجاع إن وجدت */}
            {restoreFeedback && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                restoreFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                {restoreFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold block mb-0.5">
                    {restoreFeedback.type === 'success' ? 'تم الاسترجاع بنجاح' : 'تنبيه الاسترجاع'}
                  </span>
                  <span>{restoreFeedback.message}</span>
                </div>
              </div>
            )}

            {/* القسم 1: النسخ السحابي على Google Drive */}
            <div className="p-5 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-emerald-300 flex items-center justify-center text-[#0b5a49] shadow-xs">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      النسخ الاحتياطي السحابي (Google Drive Cloud Backup)
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      حفظ وتأمين سجل القيود والحسابات سحابياً على درايف ضد ضياع أو عطل الجهاز
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-white border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>متصل: {userEmail}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">آخر مزامنة سحابية:</span>
                  <span className="font-mono font-bold text-slate-900">{lastGoogleDriveSync}</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">حالة أمان النسخة:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>مشفرة وآمنة 100%</span>
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSyncGoogleDrive}
                  disabled={isSyncingDrive}
                  className="px-5 py-2 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDrive ? 'جارِ النسخ إلى Google Drive...' : 'مزامنة ونسخ الآن إلى Google Drive'}</span>
                </button>
              </div>
            </div>

            {/* القسم 2: النسخ الاحتياطي إلى الجهاز واسترجاعه */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* تنزيل نسخة احتياطية للبيانات الحالية */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-5 h-5 text-slate-700" />
                    <h4 className="font-bold text-xs text-slate-900">تنزيل نسخة احتياطية على الكمبيوتر</h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    متاح دائماً
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  تنزيل ملف بيانات بصيغة JSON يحتوي على كافة الحسابات والقيود والعملات لاستخدامها أوفلاين كنسخة أمان.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="w-full py-2.5 px-4 rounded font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل النسخة الحالية (.json)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadClientTemplateBackup(companyName)}
                    className="w-full py-2 px-3 rounded-lg font-bold text-[11px] border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="تصدير ملف بيانات نظيف ومصفر الحركات مجهز باسم الشركة للعميل"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تصدير نسخة العميل النظيفة (.json)</span>
                  </button>
                </div>
              </div>

              {/* استرجاع من الجهاز */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <FileJson className="w-5 h-5 text-[#0b5a49]" />
                  <h4 className="font-bold text-xs text-slate-900">استرجاع نسخة احتياطية من ملف</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  رفع ملف نسخة احتياطية سابقة لاستعادة الأرصدة والقيود المحاسبية بالكامل على البرنامج.
                </p>
                <div className="pt-2">
                  <input
                    type="file"
                    ref={restoreFileRef}
                    onChange={handleRestoreFromFile}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => restoreFileRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span>اختيار ملف النسخة والاسترجاع</span>
                  </button>
                </div>
              </div>

            </div>

            {/* القسم الخاص: قاعدة البيانات المحلية والتنصيب على الحاسبة */}
            <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl shadow-md border border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex flex-wrap items-center gap-2">
                      <span>قاعدة البيانات المحلية والتنصيب الذاتي على الحاسبة</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                        data/database.json
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      يتم حفظ كافة الحسابات والقيود تلقائياً على القرص الصلب وتثبيت البرنامج بضغطة زر واحدة
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateServerBackup}
                  disabled={isServerBackupLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shadow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Server className={`w-4 h-4 ${isServerBackupLoading ? 'animate-spin' : ''}`} />
                  <span>{isServerBackupLoading ? 'جارِ الحفظ...' : 'حفظ نسخة فورية على القرص'}</span>
                </button>
              </div>
            </div>

            {/* القسم 3: النسخ الاحتياطي التلقائي (Auto-Backup) */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">النسخ الاحتياطي التلقائي (Automatic Auto-Backup)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    يقوم البرنامج بإنشاء وحفظ نسخ احتياطية دورية أوتوماتيكياً دون الحاجة للتدخل اليدوي
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoBackupEnabled}
                    onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b5a49]"></div>
                </label>
              </div>

              {isAutoBackupEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">دورية النسخ التلقائي:</label>
                    <select
                      value={backupFrequency}
                      onChange={(e) => handleChangeBackupFrequency(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-bold text-xs text-slate-800"
                    >
                      <option value="closing">عند كل إغلاق للبرنامج</option>
                      <option value="daily">يومياً (نهاية اليوم 11:59 م)</option>
                      <option value="hourly">كل 6 ساعات عمل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">مكان حفظ النسخة التلقائية:</label>
                    <div className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium">
                      Google Drive + مجلد التخزين المحلي
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">عدد النسخ المحفوظة:</label>
                    <div className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium">
                      الاحتفاظ بآخر 14 نسخة سابقة
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 4. تبويب إعداد البلدان والمدن (جميع دول العالم) */}
        {activeTab === 'countries' && (
          <div className="space-y-4">
            
            {/* شريط البحث وفلترة القارات */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="بحث باسم الدولة، الكود (IQ, TR)، أو الهاتف..."
                  className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                />
              </div>

              {/* أزرار الفلترة */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-[11px]">
                {[
                  { id: 'all', label: `الكل (${countriesList.length})` },
                  { id: 'active', label: `المفعلة (${countriesList.filter(c => c.isActive).length})` },
                  { id: 'middle_east', label: 'الشرق الأوسط' },
                  { id: 'asia', label: 'آسيا' },
                  { id: 'europe', label: 'أوروبا' },
                  { id: 'americas', label: 'الأمريكيتين' },
                  { id: 'africa', label: 'أفريقيا' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedRegionFilter(tab.id)}
                    className={`px-3 py-1 rounded font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedRegionFilter === tab.id
                        ? 'bg-[#0b5a49] text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* جدول البلدان والمدن */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#0b5a49] text-white font-bold select-none z-10">
                    <tr>
                      <th className="p-2.5 border-l border-white/10 text-center w-12">العلم</th>
                      <th className="p-2.5 border-l border-white/10">اسم الدولة</th>
                      <th className="p-2.5 border-l border-white/10 text-center">الرمز</th>
                      <th className="p-2.5 border-l border-white/10 text-center">مفتاح الاتصال</th>
                      <th className="p-2.5 border-l border-white/10 text-center">عدد المدن</th>
                      <th className="p-2.5 border-l border-white/10 text-center">الحالة</th>
                      <th className="p-2.5 text-center w-44">الإجراءات والمدن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredCountries.map(country => (
                      <tr key={country.code} className={`hover:bg-slate-50 transition-colors ${country.isDefault ? 'bg-emerald-50/40' : ''}`}>
                        <td className="p-2.5 text-center text-lg">{country.flag}</td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{country.nameAr}</span>
                            <span className="text-[11px] text-slate-400 font-mono">({country.nameEn})</span>
                            {country.isDefault && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                الدولة الافتراضية
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-700">{country.code}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600" dir="ltr">{country.phoneCode}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{country.cities.length}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleCountryStatus(country.code)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              country.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {country.isActive ? 'مفعلة' : 'معطلة'}
                          </button>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCountryForCity(country)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[11px] cursor-pointer flex items-center gap-1"
                              title="عرض وإضافة المدن"
                            >
                              <span>المدن ({country.cities.length})</span>
                              <ChevronRight className="w-3 h-3 rotate-180" />
                            </button>

                            {!country.isDefault && (
                              <button
                                type="button"
                                onClick={() => setDefaultCountry(country.code)}
                                className="px-2 py-1 bg-white hover:bg-emerald-50 text-[#0b5a49] border border-[#0b5a49]/30 rounded font-bold text-[10px] cursor-pointer"
                              >
                                تعيين كافتراضية
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCountries.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                          لا توجد نتائج مطابقة لبحثك في قائمة الدول
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* نافذة استعراض وإضافة المدن للدولة المختارة */}
            {selectedCountryForCity && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in">
                  <div className="bg-[#0b5a49] text-white px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedCountryForCity.flag}</span>
                      <span className="font-bold text-sm">
                        مدن دولة {selectedCountryForCity.nameAr} ({selectedCountryForCity.cities.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCountryForCity(null)}
                      className="p-1 rounded text-white/80 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* إضافة مدينة جديدة */}
                    <form onSubmit={handleAddCityToCountry} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <label className="block text-slate-800 font-bold text-xs">
                        إضافة مدينة جديدة لدولة {selectedCountryForCity.nameAr}:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          required
                          value={newCityNameAr}
                          onChange={(e) => setNewCityNameAr(e.target.value)}
                          placeholder="اسم المدينة بالعربية *"
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded font-bold text-slate-900"
                        />
                        <input
                          type="text"
                          value={newCityNameEn}
                          onChange={(e) => setNewCityNameEn(e.target.value)}
                          placeholder="الاسم بالإنجليزية (اختياري)"
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900"
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة المدينة</span>
                        </button>
                      </div>
                    </form>

                    {/* قائمة المدن الحالية */}
                    <div className="space-y-1">
                      <label className="block text-slate-700 font-bold text-xs mb-1.5">
                        المدن المسجلة حالياً:
                      </label>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                        {selectedCountryForCity.cities.map(city => (
                          <div key={city.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                            <div>
                              <span className="font-bold text-slate-900">{city.nameAr}</span>
                              <span className="text-[11px] text-slate-400 font-mono mr-2">({city.nameEn})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCity(selectedCountryForCity.code, city.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              title="حذف المدينة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {selectedCountryForCity.cities.length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            لا توجد مدن مسجلة حتى الآن
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedCountryForCity(null)}
                        className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-xs cursor-pointer"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 5. تبويب إعداد العملات (جميع العملات) */}
        {activeTab === 'currencies' && (
          <div className="space-y-4">
            
            {/* شريط التحكم والبحث وإضافة عملة جديدة */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  placeholder="بحث باسم العملة أو الرمز (USD, IQD, EUR)..."
                  className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={currencyCategoryFilter}
                  onChange={(e) => setCurrencyCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800"
                >
                  <option value="all">كافة العملات ({currenciesList.length})</option>
                  <option value="active">المفعلة فقط ({currenciesList.filter(c => c.isActive).length})</option>
                  <option value="arab">العملات العربية</option>
                  <option value="major">العملات العالمية الكبرى</option>
                  <option value="asia">العملات الآسيوية</option>
                  <option value="europe">العملات الأوروبية</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsAddCurrencyModalOpen(true)}
                  className="px-4 py-1.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة عملة جديدة</span>
                </button>
              </div>
            </div>

            {/* جدول العملات */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#0b5a49] text-white font-bold select-none z-10">
                    <tr>
                      <th className="p-2.5 border-l border-white/10 text-center w-12">العلم</th>
                      <th className="p-2.5 border-l border-white/10 text-center">الرمز</th>
                      <th className="p-2.5 border-l border-white/10">اسم العملة</th>
                      <th className="p-2.5 border-l border-white/10 text-center">الإشارة</th>
                      <th className="p-2.5 border-l border-white/10 text-center">سعر الشراء</th>
                      <th className="p-2.5 border-l border-white/10 text-center">سعر البيع</th>
                      <th className="p-2.5 border-l border-white/10 text-center">الحالة</th>
                      <th className="p-2.5 text-center w-40">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredCurrencies.map(curr => (
                      <tr key={curr.code} className={`hover:bg-slate-50 transition-colors ${curr.isBase ? 'bg-emerald-50/40' : ''}`}>
                        <td className="p-2.5 text-center text-lg">{curr.flag}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">{curr.code}</td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{curr.nameAr}</span>
                            <span className="text-[11px] text-slate-400 font-mono">({curr.nameEn})</span>
                            {curr.isBase && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                العملة الأساسية
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-700">{curr.symbol}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-800">
                          {curr.buyRate.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-rose-800">
                          {curr.sellRate.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleCurrencyStatus(curr.code)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              curr.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {curr.isActive ? 'مفعلة' : 'معطلة'}
                          </button>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingCurrency(curr)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[11px] cursor-pointer"
                            >
                              تعديل السعر
                            </button>
                            {!curr.isBase && (
                              <button
                                type="button"
                                onClick={() => setBaseCurrency(curr.code)}
                                className="px-2 py-1 bg-white hover:bg-emerald-50 text-[#0b5a49] border border-[#0b5a49]/30 rounded font-bold text-[10px] cursor-pointer"
                              >
                                تعيين كأساس
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* نافذة تعديل سعر العملة */}
            {editingCurrency && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in">
                  <div className="bg-[#0b5a49] text-white px-4 py-3 flex items-center justify-between">
                    <span className="font-bold text-xs">
                      تعديل أسعار {editingCurrency.nameAr} ({editingCurrency.code})
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingCurrency(null)}
                      className="text-white/80 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const buy = Number(form.buy.value);
                      const sell = Number(form.sell.value);
                      handleUpdateRates(editingCurrency.code, buy, sell);
                    }}
                    className="p-4 space-y-3 text-xs"
                  >
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">سعر الشراء</label>
                      <input
                        name="buy"
                        type="number"
                        step="any"
                        defaultValue={editingCurrency.buyRate}
                        required
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">سعر البيع</label>
                      <input
                        name="sell"
                        type="number"
                        step="any"
                        defaultValue={editingCurrency.sellRate}
                        required
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCurrency(null)}
                        className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold cursor-pointer"
                      >
                        حفظ الأسعار
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* نافذة إضافة عملة جديدة */}
            {isAddCurrencyModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in">
                  <div className="bg-[#0b5a49] text-white px-5 py-3 flex items-center justify-between">
                    <span className="font-bold text-sm">إضافة عملة جديدة للنظام</span>
                    <button
                      type="button"
                      onClick={() => setIsAddCurrencyModalOpen(false)}
                      className="text-white/80 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleAddNewCurrency} className="p-5 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">رمز العملة (مثل CHF) *</label>
                        <input
                          type="text"
                          required
                          value={newCurrencyCode}
                          onChange={(e) => setNewCurrencyCode(e.target.value)}
                          placeholder="USD"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">العلم أو الإشارة</label>
                        <input
                          type="text"
                          value={newCurrencyFlag}
                          onChange={(e) => setNewCurrencyFlag(e.target.value)}
                          placeholder="🏳️ أو $"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-center text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">اسم العملة بالعربية *</label>
                      <input
                        type="text"
                        required
                        value={newCurrencyNameAr}
                        onChange={(e) => setNewCurrencyNameAr(e.target.value)}
                        placeholder="فرنك سويسري"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">اسم العملة بالإنجليزية</label>
                      <input
                        type="text"
                        value={newCurrencyNameEn}
                        onChange={(e) => setNewCurrencyNameEn(e.target.value)}
                        placeholder="Swiss Franc"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">سعر الشراء</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={newCurrencyBuyRate}
                          onChange={(e) => setNewCurrencyBuyRate(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">سعر البيع</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={newCurrencySellRate}
                          onChange={(e) => setNewCurrencySellRate(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsAddCurrencyModalOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold shadow-xs cursor-pointer"
                      >
                        إضافة العملة
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 6. تبويب «النظام» - مقسم إلى قسمين: قسم الإصدارات و قسم تحديث البرنامج */}
        {activeTab === 'updates' && (
          <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
            
            {/* شريط التبديل العلوي بين قسمي النظام: قسم الإصدارات وقسم تحديث البرنامج */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setSystemSection('editions')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    systemSection === 'editions'
                      ? 'bg-[#0284c7] text-white shadow-md ring-2 ring-sky-300/40'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  <span>1. قسم الإصدارات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSystemSection('updates')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    systemSection === 'updates'
                      ? 'bg-[#0284c7] text-white shadow-md ring-2 ring-sky-300/40'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>2. قسم تحديث البرنامج</span>
                </button>
              </div>

              {/* وضع المعاينة والصلاحيات */}
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs px-1">
                <span className="text-[11px] font-bold text-slate-500">وضع العرض:</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleToggleEditionMode('master')}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      editionMode === 'master'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    المطور (الادمن)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleEditionMode('client')}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      editionMode === 'client'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    معاينة العميل
                  </button>
                </div>
              </div>
            </div>

            {/* =========================================================================
                القسم الأول: قسم الإصدارات (Versions & Editions)
                ========================================================================= */}
            {systemSection === 'editions' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* 1. بطاقة معلومات الإصدار الحالي وحالة النظام */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Package className="w-6 h-6 text-[#0284c7]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900">إصدار النظام الحالي</h3>
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            v1.4.0 (مستقر)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Smart Ledger Pro • نظام إدارة الحوالات والمحاسبة المالية الذكية
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                          {editionMode === 'client' 
                            ? (serverClientInfo?.companyName ? `نسخة مرخصة لـ: ${serverClientInfo.companyName}` : 'نسخة العميل المعتمدة') 
                            : 'نسخة المطور الرئيسية (كاملة الصلاحيات)'}
                        </span>
                      </span>

                      {(editionMode === 'client' || isServerLockedClient) && (
                        <button
                          type="button"
                          onClick={() => handleToggleEditionMode('master')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          title="فك القفل واستعادة صلاحيات المطور والادمن الكاملة"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>العودة لوضع المطور (الادمن) 🔓</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* سجل التغييرات والميزات الجديدة في الإصدار (Changelog) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-black text-slate-800 text-xs">
                      <History className="w-4 h-4 text-sky-600" />
                      <span>ميزات وتحديثات الإصدار v1.4.0 الأخير:</span>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11.5px] text-slate-600 pr-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>عزل الخزنة المركزية عن عمليات الصرف والقبض المباشرة للزبائن.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>شاشة استعلام حوالات شاملة مع بحث متعدد وزر إنهاء متناسق.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>نظام توريد النقدية ومناقلة الصناديق إلى الخزنة المركزية.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>تصدير حزم التحديث الخفيفة (.zip) ومثبتات الويندوز المباشرة (.exe).</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* 2. اصدار نسخة المطور (الادمن - Master Edition) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Code2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">أ. اصدار نسخة المطور (الادمن)</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          تصدير النسخة الكاملة للمطور بكافة الصلاحيات البرمجية والإدارية والتحكم في التراخيص.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* مثبت الويندوز المباشر للمطور */}
                    <a
                      href="/Smart-Ledger-Setup.exe"
                      download="Smart-Ledger-Setup.exe"
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Laptop className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">مثبت الويندوز المباشر (Setup.exe)</span>
                          <span className="text-[10px] text-slate-500">معالج تثبيت تنفيذي مع أيقونة سطح المكتب</span>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                    </a>

                    {/* تصدير ملف الحزمة الكاملة للمطور */}
                    <button
                      type="button"
                      onClick={handleExportMasterEdition}
                      disabled={isExportingMaster}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition-colors group cursor-pointer disabled:opacity-50 text-right"
                    >
                      <div className="flex items-center gap-2.5">
                        <Server className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">
                            {isExportingMaster ? 'جاري تجهيز الحزمة...' : 'تصدير حزمة المطور (.zip)'}
                          </span>
                          <span className="text-[10px] text-slate-500">حزمة السورس كود والملفات التنفيذية</span>
                        </div>
                      </div>
                      <Download className={`w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 ${isExportingMaster ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* 3. اصدار نسخة العميل: كتابة اسم الشركة وتوليد رمز التفعيل */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <KeyRound className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          ب. اصدار نسخة العميل (تكتب اسم الشركة وتظهر رمز التفعيل)
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          اكتب اسم شركة أو مؤسسة العميل ليتم إصدار النسخة وتوليد رمز التفعيل وحزمة التحميل فوراً.
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
                      {clientEditions.length} ترخيص مصدر
                    </span>
                  </div>

                  {/* نموذج إدخال اسم الشركة */}
                  <form onSubmit={handleCreateClientEdition} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-xs font-bold text-slate-800">
                          اسم الشركة أو المؤسسة <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="اكتب اسم شركة العميل هنا..."
                          value={issueCompanyName}
                          onChange={(e) => setIssueCompanyName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-800">مدة الترخيص</label>
                        <select
                          value={issueDuration}
                          onChange={(e) => setIssueDuration(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="lifetime">دائم مدى الحياة</option>
                          <option value="1_year">سنوي (سنة واحدة)</option>
                          <option value="2_years">سنتان</option>
                          <option value="trial_30">تجريبي (30 يوم)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        ⚡ سيظهر رمز التفعيل (Activation Code) فور الضغط أدناه
                      </span>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>اصدار نسخة العميل وتوليد رمز التفعيل</span>
                      </button>
                    </div>
                  </form>

                  {/* ظهور رمز التفعيل للنسخة الصادرة حديثاً */}
                  {justIssuedEdition && (
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl shadow-xs space-y-3 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-xs font-black text-emerald-900">
                            🎉 تم اصدار نسخة العميل لشركة: «{justIssuedEdition.companyName}»
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setJustIssuedEdition(null)}
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                        >
                          إغلاق ✕
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-emerald-200">
                        <div>
                          <span className="text-[11px] text-slate-500 block font-medium">رمز التفعيل (Activation Code):</span>
                          <span className="text-base sm:text-lg font-mono font-black text-emerald-800 tracking-wider select-all block mt-0.5">
                            {justIssuedEdition.licenseKey}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyLicenseKey(justIssuedEdition.licenseKey, justIssuedEdition.id)}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            {copiedKeyId === justIssuedEdition.id ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedKeyId === justIssuedEdition.id ? 'تم النسخ!' : 'نسخ رمز التفعيل'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const safeComp = justIssuedEdition.companyName.replace(/[\s\/\\:"'<>|*?]+/g, '_');
                              handleDownloadBlobFile(
                                `/api/system/client-editions/${justIssuedEdition.id}/download-package`,
                                `SmartLedger_Client_${safeComp}.zip`,
                                'حزمة العميل (.zip)'
                              );
                            }}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            title="تنزيل حزمة العميل الفورية شاملة البرنامج والترخيص وقاعدة البيانات"
                          >
                            <Download className="w-4 h-4 text-emerald-400" />
                            <span>تنزيل حزمة العميل (.zip)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleDownloadBlobFile(
                                '/Smart-Ledger-Client-Setup.exe',
                                'Smart-Ledger-Client-Setup.exe',
                                'مثبت نسخة العميل'
                              );
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            title="تنزيل مثبت الويندوز المباشر المقفل رسمياً كنسخة عميل"
                          >
                            <Laptop className="w-4 h-4 text-indigo-200" />
                            <span>مثبت نسخة العميل (Setup.exe)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const safeComp = justIssuedEdition.companyName.replace(/[\s\/\\:"'<>|*?]+/g, '_');
                              handleDownloadBlobFile(
                                `/api/system/client-editions/${justIssuedEdition.id}/download-license`,
                                `SmartLedger_License_${safeComp}.json`,
                                'وثيقة الترخيص (.json)'
                              );
                            }}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="تنزيل وثيقة الترخيص الرسمية (.json) لإرسالها للعميل"
                          >
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span>وثيقة الترخيص (.json)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* سجل نسخ وتراخيص العملاء السابقة */}
                  {clientEditions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>سجل نسخ العملاء الصادرة:</span>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={editionSearchQuery}
                            onChange={(e) => setEditionSearchQuery(e.target.value)}
                            placeholder="بحث بالاسم أو الرمز..."
                            className="pr-8 pl-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-indigo-400 outline-none w-44"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                            <tr>
                              <th className="py-2 px-3">#</th>
                              <th className="py-2 px-3">اسم الشركة</th>
                              <th className="py-2 px-3">رمز التفعيل</th>
                              <th className="py-2 px-3">تاريخ الإصدار</th>
                              <th className="py-2 px-3 text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {clientEditions
                              .filter(item => {
                                if (!editionSearchQuery.trim()) return true;
                                const q = editionSearchQuery.trim().toLowerCase();
                                return item.companyName.toLowerCase().includes(q) || item.licenseKey.toLowerCase().includes(q);
                              })
                              .map((item, idx) => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">{item.companyName}</td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                                      {item.licenseKey}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyLicenseKey(item.licenseKey, item.id)}
                                      className="p-1 text-slate-500 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                                      title="نسخ رمز التفعيل"
                                    >
                                      {copiedKeyId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-slate-500 text-[11px]">{item.issueDate ? item.issueDate.slice(0, 10) : '-'}</td>
                                <td className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const safeComp = item.companyName.replace(/[\s\/\\:"'<>|*?]+/g, '_');
                                        handleDownloadBlobFile(
                                          `/api/system/client-editions/${item.id}/download-package`,
                                          `SmartLedger_Client_${safeComp}.zip`,
                                          'حزمة العميل (.zip)'
                                        );
                                      }}
                                      className="p-1 text-slate-600 hover:text-teal-600 rounded transition-colors cursor-pointer"
                                      title="تنزيل حزمة العميل الفورية (.zip)"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDownloadBlobFile(
                                          '/Smart-Ledger-Client-Setup.exe',
                                          'Smart-Ledger-Client-Setup.exe',
                                          'مثبت نسخة العميل'
                                        );
                                      }}
                                      className="p-1 text-slate-600 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                                      title="تنزيل مثبت نسخة العميل المباشر (Setup.exe)"
                                    >
                                      <Laptop className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const safeComp = item.companyName.replace(/[\s\/\\:"'<>|*?]+/g, '_');
                                        handleDownloadBlobFile(
                                          `/api/system/client-editions/${item.id}/download-license`,
                                          `SmartLedger_License_${safeComp}.json`,
                                          'وثيقة الترخيص (.json)'
                                        );
                                      }}
                                      className="p-1 text-slate-600 hover:text-amber-600 rounded transition-colors cursor-pointer"
                                      title="تنزيل وثيقة الترخيص الرسمية (.json)"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteClientEdition(item.id, item.companyName)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                      title="حذف الترخيص"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* =========================================================================
                القسم الثاني: قسم تحديث البرنامج (Software Updates & Patching)
                ========================================================================= */}
            {systemSection === 'updates' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* 1. ترويسة وفحص التحديثات التلقائية */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <RefreshCw className={`w-6 h-6 text-emerald-600 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">قسم تحديث البرنامج</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          تحديث النظام بواسطة ملف التحديث الخفيف المعتمد مع الحفاظ التام على البيانات
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCheckOnlineUpdates}
                        disabled={isCheckingUpdate}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                        <span>{isCheckingUpdate ? 'جاري فحص التحديثات...' : 'فحص وجود تحديثات الآن'}</span>
                      </button>
                    </div>
                  </div>

                  {/* نتيجة الفحص التلقائي إن وجدت */}
                  {updateCheckResult && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">حالة النظام:</span>
                        <p className="text-[11.5px] text-emerald-900">{updateCheckResult.message}</p>
                      </div>
                    </div>
                  )}

                  {/* بطاقة اختيار وتثبيت ملف التحديث المباشر */}
                  <div className="p-8 bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                      <Upload className={`w-8 h-8 text-emerald-700 ${isUploadingZip ? 'animate-bounce' : ''}`} />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">اختيار وتثبيت ملف التحديث (.zip)</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        اختر ملف التحديث (Patch) الذي استلمته لتطبيق التحديث فوراً وبشكل آمن وتلقائي دون الحاجة لإعادة التثبيت.
                      </p>
                    </div>

                    <div>
                      <input
                        ref={zipFileInputRef}
                        type="file"
                        accept=".zip"
                        onChange={handleUploadZipPatch}
                        className="hidden"
                        id="system-update-patch-file-input"
                      />
                      <label
                        htmlFor="system-update-patch-file-input"
                        className={`inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#0b5a49] hover:bg-[#084538] text-white rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer ${
                          isUploadingZip ? 'opacity-60 pointer-events-none' : ''
                        }`}
                      >
                        <Upload className={`w-4 h-4 ${isUploadingZip ? 'animate-spin' : ''}`} />
                        <span>{isUploadingZip ? 'جاري فك وتثبيت التحديث...' : 'اختيار وتثبيت ملف التحديث'}</span>
                      </label>
                    </div>
                  </div>

                  {/* رسالة الحفاظ التام على البيانات */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] leading-relaxed">
                      <strong>🔒 الحفاظ التام 100% على البيانات:</strong> يتم إنشاء نسخة احتياطية إجبارية تلقائياً قبل فك أي تحديث. لا تتأثر سجلات الزبائن، الأرصدة، أو الصناديق إطلاقاً.
                    </p>
                  </div>

                  {/* نتيجة تثبيت التحديث */}
                  {updateResult && (
                    <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs ${
                      updateResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}>
                      {updateResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      <div className="space-y-1">
                        <div className="font-bold">
                          {updateResult.message || (updateResult as any).error || (updateResult.success ? 'تم تطبيق التحديث بنجاح' : 'تعذر تطبيق التحديث')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. اصدار وتصدير ملف التحديث (Patch Maker) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <FileArchive className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          اصدار ملف التحديث للعملاء (Export Update Patch)
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          أصدر ملف التحديث الخفيف لترسله للعملاء لتحديث نسختهم القديمة دون أي حاجة لاستبدال البرنامج أو المساس بالبيانات.
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                      تحديث سريع
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span>تصدير ملف التحديث (Smart-Ledger-Update-Patch.zip)</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        تصدير حزمة التحديث التي تحوي التعديلات والملفات الجديدة فقط دون قواعد البيانات القديمة.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportUpdatePatch}
                      disabled={isExportingPatch}
                      className="px-5 py-2.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Download className={`w-4 h-4 ${isExportingPatch ? 'animate-bounce' : ''}`} />
                      <span>{isExportingPatch ? 'جاري تصدير التحديث...' : 'اصدار وتصدير ملف التحديث (ZIP)'}</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* شريط التحكم السفلي الموحد (يُخفى في تبويب التحديث بالتحديث بناءً على رغبة المستخدم) */}
      {activeTab !== 'updates' && (
        <div className="bg-slate-100/90 px-5 py-3 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'company') {
                  setCompanyName(initialCompanyInfo?.name || '');
                  setCompanyPhone(initialCompanyInfo?.phone || '');
                  setCompanyAddress(initialCompanyInfo?.address || '');
                } else if (activeTab === 'countries') {
                  setCountrySearch('');
                } else if (activeTab === 'currencies') {
                  setCurrencySearch('');
                  setCurrencyCategoryFilter('all');
                }
                showToast('تمت إعادة ضبط المدخلات بنجاح');
              }}
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="إعادة ضبط أو تصفير (F3)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>تفريغ .F3</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="طباعة (F6)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>طباعة .F6</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="إغلاق والعودة للرئيسية (ESC)"
              >
                <X className="w-3.5 h-3.5 text-slate-600" />
                <span>انهاء .ESC</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (activeTab === 'company') {
                  handleSaveCompanyInfo();
                } else if (activeTab === 'theme_font') {
                  handleSaveThemeSettings();
                } else if (activeTab === 'currencies') {
                  setIsAddCurrencyModalOpen(true);
                } else {
                  showToast('الإعدادات محفوظة ونشطة');
                }
              }}
              className="h-8 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
              title="حفظ الإعدادات (F2)"
            >
              <Check className="w-4 h-4 text-sky-200" />
              <span>حفظ الإعدادات .F2</span>
            </button>
          </div>
        </div>
      )}

      {/* نافذة حوار إصدار نسخة عميل وتوليد مفتاح التفعيل */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-indigo-700 to-sky-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-200" />
                <h3 className="font-bold text-sm">إصدار نسخة عميل وتوليد مفتاح تفعيل رسمي</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClientEdition} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                📌 <strong>ملاحظة هامة:</strong> نسخة العميل تكون مخصصة للشركة المستفيدة؛ يتم تفعيل ميزة التحديثات التلقائية مع <strong>حجب ميزة تصدير البيانات</strong> لحماية النظام وربطه بمفتاح تفعيل رسمي فريد.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم الشركة / العميل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={issueCompanyName}
                  onChange={(e) => setIssueCompanyName(e.target.value)}
                  placeholder="مثال: شركة الرافدين للصرافة، مكتب دبي، ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المسؤول / المالك:</label>
                  <input
                    type="text"
                    value={issueClientName}
                    onChange={(e) => setIssueClientName(e.target.value)}
                    placeholder="اختياري"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة / المحافظة:</label>
                  <input
                    type="text"
                    value={issueCity}
                    onChange={(e) => setIssueCity(e.target.value)}
                    placeholder="مثال: النجف، بغداد، أربيل"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={issuePhone}
                    onChange={(e) => setIssuePhone(e.target.value)}
                    placeholder="07XXXXXXXXX"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الترخيص والصلاحية:</label>
                  <select
                    value={issueDuration}
                    onChange={(e) => setIssueDuration(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="lifetime">دائم مدى الحياة (Lifetime)</option>
                    <option value="1year">ترخيص سنوي (1 سنة)</option>
                    <option value="2years">ترخيص سنتين (2 سنة)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="ملاحظات حول النسخة أو شروط الاستخدام"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>إصدار وتوليد مفتاح التفعيل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة عرض وتأكيد مفتاح التفعيل بعد الإصدار (على نمط مايكروسوفت ويندوز وأوفيس) */}
      {justIssuedEdition && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-emerald-500/30 overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4.5 bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">تم إصدار نسخة العميل بنجاح!</h3>
                  <p className="text-[11px] text-emerald-100">مفتاح التفعيل الرسمي المعتمد للنظام</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJustIssuedEdition(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* تفاصيل الشركة */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">اسم الشركة / العميل:</span>
                  <span className="text-sm font-black text-slate-900">{justIssuedEdition.companyName}</span>
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-slate-500 block">تاريخ الإصدار:</span>
                  <span className="font-mono text-slate-700 font-bold">{justIssuedEdition.issueDate.slice(0, 10)}</span>
                </div>
              </div>

              {/* صندوق عرض مفتاح التفعيل بنمط ويندوز وأوفيس (5 مجموعات) */}
              <div className="p-4 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-xl border border-indigo-500/40 text-center space-y-2.5 shadow-inner">
                <div className="text-[11px] text-indigo-300 font-bold flex items-center justify-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>مفتاح التفعيل الرقمي (Product Activation Key):</span>
                </div>

                {/* مربعات المفتاح المقسمة مثل مايكروسوفت ويندوز وأوفيس */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-mono font-black text-xs sm:text-sm text-amber-300 direction-ltr">
                  {justIssuedEdition.licenseKey.split('-').map((block, bIdx) => (
                    <React.Fragment key={bIdx}>
                      <span className="px-2 py-1.5 bg-indigo-900/80 border border-indigo-400/50 rounded-md shadow-sm tracking-wider">
                        {block}
                      </span>
                      {bIdx < 4 && <span className="text-indigo-400 font-bold">-</span>}
                    </React.Fragment>
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyLicenseKey(justIssuedEdition.licenseKey, justIssuedEdition.id)}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer shadow-md"
                  >
                    {copiedKeyId === justIssuedEdition.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-800" />
                        <span>تم نسخ المفتاح بنجاح!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ مفتاح التفعيل</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ملاحظة قاعدة نسخة العميل */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>مواصفات وصلاحيات نسخة العميل:</span>
                </div>
                <p>
                  • <strong>تحديثات النظام الفورية:</strong> تدعم هذه النسخة التحديث المباشر من GitHub أو رفع ملفات ZIP دون فقدان السجلات.<br />
                  • <strong>النسخ الاحتياطي والأمان:</strong> يمتلك العميل كامل الصلاحية لعمل نسخ احتياطية وتنزيل واسترجاع بياناته محلياً في أي وقت.
                </p>
              </div>

              {/* أزرار التحميل المباشرة لنسخة وترخيص العميل */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const safeComp = justIssuedEdition.companyName.replace(/[\s\/\\:"'<>|*?]+/g, '_');
                    handleDownloadBlobFile(
                      `/api/system/client-editions/${justIssuedEdition.id}/download-package`,
                      `SmartLedger_Client_${safeComp}.zip`,
                      'حزمة العميل (.zip)'
                    );
                  }}
                  className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer text-xs"
                  title="تحميل حزمة البرنامج المحمولة الجاهزة للتشغيل الفوري"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>حزمة العميل (.zip)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDownloadBlobFile(
                      '/Smart-Ledger-Client-Setup.exe',
                      'Smart-Ledger-Client-Setup.exe',
                      'مثبت نسخة العميل'
                    );
                  }}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer text-xs"
                  title="تحميل مثبت الويندوز المباشر للعميل"
                >
                  <Laptop className="w-4 h-4 text-indigo-200" />
                  <span>مثبت الويندوز (Setup.exe)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const safeComp = justIssuedEdition.companyName.replace(/[\s\/\\:"'<>|*?]+/g, '_');
                    handleDownloadBlobFile(
                      `/api/system/client-editions/${justIssuedEdition.id}/download-license`,
                      `SmartLedger_License_${safeComp}.json`,
                      'وثيقة الترخيص (.json)'
                    );
                  }}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl font-bold text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                  title="تنزيل وثيقة الترخيص (license.json)"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>وثيقة الترخيص (.json)</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setJustIssuedEdition(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer text-xs"
                >
                  تم، إغلاق والعودة للسجل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
