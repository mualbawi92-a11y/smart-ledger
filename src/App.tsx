/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WebSidebar, WebScreenTab } from './components/web/WebSidebar';
import { WebDashboardScreen } from './components/web/screens/WebDashboardScreen';
import { WebAccountsScreen } from './components/web/screens/WebAccountsScreen';
import { WebBankAccountsScreen } from './components/web/screens/WebBankAccountsScreen';
import { WebTransfersScreen } from './components/web/screens/WebTransfersScreen';
import { WebAccountStatementScreen } from './components/web/screens/WebAccountStatementScreen';
import { WebIssueTransferScreen } from './components/web/screens/WebIssueTransferScreen';
import { WebPayoutTransferScreen } from './components/web/screens/WebPayoutTransferScreen';
import { WebDepositWithdrawalScreen } from './components/web/screens/WebDepositWithdrawalScreen';
import { WebDoubleEntryScreen } from './components/web/screens/WebDoubleEntryScreen';
import { WebTrialBalanceScreen } from './components/web/screens/WebTrialBalanceScreen';
import { WebFundTransferScreen } from './components/web/screens/WebFundTransferScreen';
import { WebExchangeScreen } from './components/web/screens/WebExchangeScreen';
import { WebAgentNetworkScreen } from './components/web/screens/WebAgentNetworkScreen';
import { WebCashFlowScreen } from './components/web/screens/WebCashFlowScreen';
import { WebSettingsScreen } from './components/web/screens/WebSettingsScreen';
import { WebUsersManagementScreen } from './components/web/screens/WebUsersManagementScreen';
import { LoginScreen, AuthSessionUser } from './components/web/LoginScreen';

import { SmartLedgerMobileSimulator } from './components/mobile/SmartLedgerMobileSimulator';
import { ProjectFilesAnalyzer } from './components/ProjectFilesAnalyzer';

import { NewTransactionModal } from './components/web/NewTransactionModal';
import { TransactionReceiptModal } from './components/web/TransactionReceiptModal';
import { ClientActivationModal } from './components/modals/ClientActivationModal';
import { LicenseLockedModal } from './components/modals/LicenseLockedModal';
import { AlertTriangle, Clock, KeyRound, Lock, ShieldCheck, CircleDollarSign, Sun, Moon, LogOut } from 'lucide-react';

import { 
  INITIAL_ACCOUNTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_P2P_AGENTS, 
  INITIAL_CURRENCIES 
} from './data/initialData';
import { 
  AccountItem, 
  TransactionRecord, 
  P2PAgent, 
  CurrencyRate, 
  UploadedProjectFile, 
  CurrencyCode,
  ClientEditionInfo
} from './types';

// دالة توحيد وتأمين أرصدة وبيانات الحسابات المحاسبية لمنع قيم NaN
export const normalizeAccountData = (a: any): AccountItem => {
  const balIQD = typeof a.balanceIQD === 'number' && !isNaN(a.balanceIQD)
    ? a.balanceIQD
    : (typeof a.balances?.IQD === 'number' && !isNaN(a.balances.IQD)
        ? a.balances.IQD
        : (a.currency === 'IQD' && typeof a.balance === 'number' && !isNaN(a.balance) ? a.balance : 0));
  const balUSD = typeof a.balanceUSD === 'number' && !isNaN(a.balanceUSD)
    ? a.balanceUSD
    : (typeof a.balances?.USD === 'number' && !isNaN(a.balances.USD)
        ? a.balances.USD
        : (a.currency === 'USD' && typeof a.balance === 'number' && !isNaN(a.balance) ? a.balance : 0));

  let type = a.type || 'client';
  const nameLower = (a.name || '').toLowerCase();
  if (a.systemType === 'cash_box' || a.id === 'sys_cash_box' || nameLower.includes('صندوق')) {
    type = 'cash_box';
  } else if (a.systemType === 'vault' || a.id === 'sys_vault' || nameLower.includes('خزنة')) {
    type = 'vault';
  } else if (a.systemType === 'bank' || nameLower.includes('مصرف') || nameLower.includes('بنك')) {
    type = 'bank';
  }

  return {
    ...a,
    type,
    balanceIQD: balIQD,
    balanceUSD: balUSD,
  };
};

export default function App() {
  const [activeView, setActiveView] = useState<'web' | 'mobile' | 'files'>('web');
  const [currentTab, setCurrentTab] = useState<WebScreenTab>('dashboard');
  const [previousTab, setPreviousTab] = useState<WebScreenTab>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<'company' | 'license' | 'theme_font' | 'backup' | 'countries' | 'currencies' | 'updates'>('company');
  const [editionInfo, setEditionInfo] = useState<ClientEditionInfo | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isLicenseLockedModalOpen, setIsLicenseLockedModalOpen] = useState(false);

  // Core Data Stores (مع دعم التخزين المحلي وقاعدة البيانات المحلية على القرص data/database.json)
  const [accounts, setAccounts] = useState<AccountItem[]>(() => {
    const saved = localStorage.getItem('smart_ledger_accounts_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeAccountData);
        }
      } catch {}
    }
    return INITIAL_ACCOUNTS.map(normalizeAccountData);
  });

  const [transactions, setTransfers] = useState<TransactionRecord[]>(() => {
    const saved = localStorage.getItem('smart_ledger_transactions_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return INITIAL_TRANSACTIONS;
  });

  const [agents, setAgents] = useState<P2PAgent[]>(() => {
    const saved = localStorage.getItem('smart_ledger_agents_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_P2P_AGENTS;
  });

  const [currencies, setCurrencies] = useState<CurrencyRate[]>(() => {
    const saved = localStorage.getItem('smart_ledger_currencies_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_CURRENCIES;
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedProjectFile[]>([]);
  const [dbSyncStatus, setDbSyncStatus] = useState<'connected' | 'offline' | 'saving'>('connected');
  const [statementInitialAccountId, setStatementInitialAccountId] = useState<string | undefined>(undefined);
  
  // حراس المزامنة لمنع حفظ البيانات بشكل متكرر دون وجود تغيير فعلي
  const isInitialLoadedRef = React.useRef(false);
  const lastSavedHashRef = React.useRef<string>('');

  // جلب البيانات من ملف قاعدة البيانات المحلي data/database.json عند بدء التشغيل
  useEffect(() => {
    fetch('/api/database')
      .then(res => res.json())
      .then(result => {
        if (result?.success && result?.data) {
          const db = result.data;
          if (Array.isArray(db.accounts)) {
            const normalized = db.accounts.length > 0 ? db.accounts.map(normalizeAccountData) : INITIAL_ACCOUNTS.map(normalizeAccountData);
            setAccounts(normalized);
            localStorage.setItem('smart_ledger_accounts_data', JSON.stringify(normalized));
          }
          if (Array.isArray(db.transactions)) {
            setTransfers(db.transactions);
            localStorage.setItem('smart_ledger_transactions_data', JSON.stringify(db.transactions));
          }
          if (Array.isArray(db.currencies) && db.currencies.length > 0) {
            setCurrencies(db.currencies);
            localStorage.setItem('smart_ledger_currencies_data', JSON.stringify(db.currencies));
          }
          if (Array.isArray(db.agents)) {
            setAgents(db.agents);
            localStorage.setItem('smart_ledger_agents_data', JSON.stringify(db.agents));
          }
          if (db.companySettings) {
            if (db.companySettings.name) setCompanyName(db.companySettings.name);
            if (db.companySettings.phone) setCompanyPhone(db.companySettings.phone);
            if (db.companySettings.address) setCompanyAddress(db.companySettings.address);
            if (db.companySettings.logo) setCompanyLogo(db.companySettings.logo);
            if (db.companySettings.systemUser) setSystemUser(db.companySettings.systemUser);
          }
          setDbSyncStatus('connected');
        }
      })
      .catch(() => {
        setDbSyncStatus('offline');
      })
      .finally(() => {
        // تأكيد اكتمال التحميل الأولي
        setTimeout(() => {
          isInitialLoadedRef.current = true;
        }, 500);
      });

    // جلب معلومات الترخيص ووضع النسخة (نسخة عميل أو مطور)
    fetchEditionInfo();
  }, []);

  const fetchEditionInfo = () => {
    fetch('/api/system/edition-info')
      .then(res => res.json())
      .then((info: ClientEditionInfo) => {
        setEditionInfo(info);
        if (info?.isClientEdition) {
          localStorage.setItem('smart_ledger_edition_mode', 'client');
          if (info.companyName) {
            setCompanyName(info.companyName);
            localStorage.setItem('smart_ledger_company_name', info.companyName);
          }
          if (info.activationStatus === 'pending_setup') {
            setIsSetupModalOpen(true);
          }
        }
      })
      .catch(() => {});
  };

  const checkCanCreateTransaction = (): boolean => {
    if (editionInfo?.isClientEdition) {
      if (editionInfo.isTrialExpired || !editionInfo.canCreateTransaction) {
        setIsLicenseLockedModalOpen(true);
        return false;
      }
    }
    return true;
  };

  // Modals
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isIssueTransferModalOpen, setIsIssueTransferModalOpen] = useState(false);
  const [isPayoutTransferModalOpen, setIsPayoutTransferModalOpen] = useState(false);
  const [isDepositWithdrawalModalOpen, setIsDepositWithdrawalModalOpen] = useState(false);
  const [isDoubleEntryModalOpen, setIsDoubleEntryModalOpen] = useState(false);
  const [isFundTransferModalOpen, setIsFundTransferModalOpen] = useState(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState<TransactionRecord | null>(null);

  // بيانات الشركة ومنظم القيد (مستخرجة من التخزين المحلي وقاعدة البيانات دون أي أمثلة سابقة)
  const [companyName, setCompanyName] = useState<string>(() => {
    const saved = localStorage.getItem('smart_ledger_company_name');
    if (saved && (saved.includes('عطاء') || saved.includes('الغري') || saved.includes('العرى'))) {
      localStorage.removeItem('smart_ledger_company_name');
      return '';
    }
    return saved || '';
  });
  const [companyPhone, setCompanyPhone] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_company_phone') || '';
  });
  const [companyAddress, setCompanyAddress] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_company_address') || '';
  });
  const [companyLogo, setCompanyLogo] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_company_logo') || '';
  });
  const [systemUser, setSystemUser] = useState<string>(() => {
    return localStorage.getItem('smart_ledger_user_name') || 'المدير العام';
  });

  // إدارة الثيم العام للبرنامج: الوضع الليلي (Dark) والوضع النهاري (Light)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_ledger_login_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('smart_ledger_login_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // إدارة جلسة تسجيل الدخول إلى المنظومة (لوحة تسجيل الدخول)
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(() => {
    const saved = localStorage.getItem('smart_ledger_current_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLoginSuccess = (user: AuthSessionUser) => {
    setCurrentUser(user);
    setSystemUser(user.fullName);
    localStorage.setItem('smart_ledger_current_auth_user', JSON.stringify(user));
    localStorage.setItem('smart_ledger_user_name', user.fullName);
    const savedTheme = localStorage.getItem('smart_ledger_login_theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smart_ledger_current_auth_user');
  };

  // المزامنة الدورية والتلقائية لقاعدة البيانات (LocalStorage + القرص الصلب data/database.json)
  useEffect(() => {
    try {
      localStorage.setItem('smart_ledger_accounts_data', JSON.stringify(accounts));
      localStorage.setItem('smart_ledger_transactions_data', JSON.stringify(transactions));
      localStorage.setItem('smart_ledger_currencies_data', JSON.stringify(currencies));
      localStorage.setItem('smart_ledger_agents_data', JSON.stringify(agents));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    // لا تقم بالكتابة إلى ملف قاعدة البيانات قبل اكتمال القراءة الأولية
    if (!isInitialLoadedRef.current) return;

    // فحص البصمة لمنع تكرار طلبات الحفظ إذا لم يحدث أي تغيير في البيانات
    const currentPayload = {
      accounts,
      transactions,
      currencies,
      agents,
      companySettings: {
        name: companyName,
        phone: companyPhone,
        address: companyAddress,
        logo: companyLogo,
        systemUser,
        theme: isDarkMode ? 'dark' : 'light'
      }
    };
    const currentHash = JSON.stringify(currentPayload);

    if (currentHash === lastSavedHashRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      setDbSyncStatus('saving');
      fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: currentHash
      })
        .then(res => res.json())
        .then(res => {
          if (res?.success) {
            setDbSyncStatus('connected');
            lastSavedHashRef.current = currentHash;
          }
        })
        .catch(() => {
          setDbSyncStatus('offline');
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [accounts, transactions, currencies, agents, companyName, companyPhone, companyAddress, companyLogo, systemUser, isDarkMode]);

  // Handlers
  const handleTransactionCreated = (newTx: TransactionRecord) => {
    if (!checkCanCreateTransaction()) {
      return;
    }
    setTransfers(prev => [newTx, ...prev]);

    // معالجة القيد اليومي المزدوج والمناقلة بين الصناديق (journal)
    if (newTx.type === 'journal') {
      const rawIQD = newTx.currency === 'IQD' ? newTx.amount : 0;
      const rawUSD = newTx.currency === 'USD' ? newTx.amount : 0;
      const debitAccName = newTx.receiverName?.trim();
      const creditAccName = newTx.senderName?.trim();
      const debitAccId = newTx.accountId;
      const creditAccId = newTx.cashBoxId || (newTx as any).senderAccountId || (newTx as any).fromAccountId;

      setAccounts(prev => prev.map(acc => {
        // الطرف المدين (Debit 🔴):
        // إذا كان صندوق أو بنك أو خزنة: يزيد رصيده بالنقد الوارد (+).
        // إذا كان عميل/مورد/وكيل: ينقص رصيده الدائن ويصبح عليه أكثر (-).
        const isDebit = Boolean((debitAccId && acc.id === debitAccId) || (debitAccName && acc.name.trim() === debitAccName));

        // الطرف الدائن (Credit 🟢):
        // إذا كان صندوق أو بنك أو خزنة: ينقص رصيده بالنقد الصادر منه (-).
        // إذا كان عميل/مورد/وكيل: يزيد رصيده الدائن ويصبح له أكثر (+).
        const isCredit = Boolean((creditAccId && acc.id === creditAccId) || (creditAccName && acc.name.trim() === creditAccName));

        const isAssetAcc = acc.type === 'cash_box' || acc.type === 'bank' || acc.type === 'vault' || 
                           (acc as any).systemType === 'cash_box' || (acc as any).systemType === 'vault' ||
                           acc.name.includes('صندوق') || acc.name.includes('خزنة') || acc.name.includes('مصرف') || acc.name.includes('بنك');

        const curBalIQD = typeof acc.balanceIQD === 'number' && !isNaN(acc.balanceIQD) ? acc.balanceIQD : 0;
        const curBalUSD = typeof acc.balanceUSD === 'number' && !isNaN(acc.balanceUSD) ? acc.balanceUSD : 0;

        if (isDebit) {
          if (isAssetAcc) {
            return {
              ...acc,
              balanceIQD: curBalIQD + rawIQD,
              balanceUSD: curBalUSD + rawUSD,
            };
          } else {
            return {
              ...acc,
              balanceIQD: curBalIQD - rawIQD,
              balanceUSD: curBalUSD - rawUSD,
            };
          }
        }

        if (isCredit) {
          if (isAssetAcc) {
            return {
              ...acc,
              balanceIQD: curBalIQD - rawIQD,
              balanceUSD: curBalUSD - rawUSD,
            };
          } else {
            return {
              ...acc,
              balanceIQD: curBalIQD + rawIQD,
              balanceUSD: curBalUSD + rawUSD,
            };
          }
        }

        return acc;
      }));

      // لا نقوم بفتح نافذة إيصال الحوالات تلقائياً إذا كانت المعاملة مناقلة بين الصناديق
      const isFundTransfer = newTx.titleAr?.includes('مناقلة') || newTx.code?.startsWith('TR-');
      if (!isFundTransfer) {
        setActiveReceiptTx(newTx);
      }
      return;
    }

    // معالجة سندات القبض (إيداع) وسندات الصرف (سحب) النقدية للزبائن
    // القاعدة المحاسبية الصارمة: القيد حصراً بين الصندوق والعميل، والخزنة لا تسجل عليها أي حركة إطلاقاً!
    if (newTx.type === 'cash_in' || newTx.type === 'cash_out') {
      const isDeposit = newTx.type === 'cash_in';
      const factor = isDeposit ? 1 : -1;
      const rawIQD = newTx.currency === 'IQD' ? newTx.amount : 0;
      const rawUSD = newTx.currency === 'USD' ? newTx.amount : 0;

      // تحديد معرف الصندوق المختار أو الصندوق النقدي الأول
      const targetBoxId = newTx.cashBoxId;
      const targetClientId = newTx.accountId;
      const targetClientName = newTx.accountName?.trim().toLowerCase();

      setAccounts(prev => {
        let boxUpdated = false;
        return prev.map(acc => {
          // 1. حساب الخزنة: معزول تماماً ومحمي ولا يسجل عليه أي أثر نهائياً
          if (acc.type === 'vault') {
            return acc;
          }

          const isBoxAccount = acc.type === 'cash_box' || acc.name.includes('صندوق') || acc.name.toLowerCase().includes('cash');

          // 2. حساب العميل (الزبون):
          // عند القبض (إيداع): العميل دفع فلوس، فيزداد رصيده الدائن (+ factor)
          // عند الصرف (سحب): العميل سحب فلوس، فينقص رصيده الدائن / يصبح مديناً (- factor)
          if (!isBoxAccount) {
            const isClientMatch = targetClientId 
              ? acc.id === targetClientId 
              : (targetClientName && acc.name.trim().toLowerCase() === targetClientName);

            if (isClientMatch) {
              return {
                ...acc,
                balanceIQD: acc.balanceIQD + (rawIQD * factor),
                balanceUSD: acc.balanceUSD + (rawUSD * factor),
              };
            }
          }

          // 3. حساب الصندوق النقدي (Cash Box):
          // عند القبض (إيداع): دخلت نقدية في الصندوق، فيزداد رصيد الصندوق (+ factor)
          // عند الصرف (سحب): خرجت نقدية من الصندوق، فينقص رصيد الصندوق (- factor)
          if (isBoxAccount) {
            const isBoxMatch = targetBoxId ? acc.id === targetBoxId : !boxUpdated;

            if (isBoxMatch) {
              boxUpdated = true;
              return {
                ...acc,
                balanceIQD: acc.balanceIQD + (rawIQD * factor),
                balanceUSD: acc.balanceUSD + (rawUSD * factor),
              };
            }
          }

          return acc;
        });
      });

      setActiveReceiptTx(newTx);
      return;
    }

    // معالجة عمليات الصرافة (بيع وشراء العملات - نقدي وآجل)
    // القاعدة المحاسبية: عزل الخزنة 100%، والتأثير على الصندوق في النقدي، أو على حساب العميل في الآجل
    if (newTx.type === 'exchange') {
      const isBuy = newTx.exchangeOperationType === 'buy' || newTx.titleAr.includes('شراء');
      const isCredit = newTx.exchangeSettlementType === 'credit' || newTx.transferSettlementType === 'credit';
      const baseCurrency = newTx.currency; // العملة الأساسية (USD)
      const baseAmount = newTx.amount; // مبلغ العملة الأساسية
      const targetCurrency = newTx.targetCurrency || 'IQD'; // العملة المقابلة (IQD)
      const targetAmount = newTx.targetAmount || (baseAmount * (newTx.exchangeRate || 1520)); // المبلغ المقابل بالدينار

      // في الشراء: الشركة تستلم العملة الأساسية (+USD) وتدفع المقابل بالدينار (-IQD)
      // في البيع: الشركة تدفع العملة الأساسية (-USD) وتستلم المقابل بالدينار (+IQD)
      const boxBaseDelta = isBuy ? baseAmount : -baseAmount;
      const boxTargetDelta = isBuy ? -targetAmount : targetAmount;

      // على حساب العميل (في الآجل):
      // في الشراء الآجل: العميل سلم العملة الأساسية (-USD) وأصبح له مقابلها بالدينار (+IQD له 🟢)
      // في البيع الآجل: العميل أخذ العملة الأساسية (+USD) وقيد عليه مقابلها بالدينار (-IQD عليه 🔴)
      const clientBaseDelta = isBuy ? -baseAmount : baseAmount;
      const clientTargetDelta = isBuy ? targetAmount : -targetAmount;

      const targetBoxId = newTx.cashBoxId;
      const targetClientId = newTx.accountId;
      const targetClientName = newTx.accountName?.trim().toLowerCase();

      setAccounts(prev => {
        let boxUpdated = false;
        return prev.map(acc => {
          if (acc.type === 'vault') return acc; // الخزنة معزولة تماماً 100%

          // 1. التسوية النقدية: التأثير على الصندوق النقدي المختار
          if (!isCredit) {
            const isBoxMatch = targetBoxId 
              ? acc.id === targetBoxId 
              : (acc.type === 'cash_box' && !boxUpdated);

            if (isBoxMatch) {
              boxUpdated = true;
              let newBalIQD = acc.balanceIQD;
              let newBalUSD = acc.balanceUSD;

              if (baseCurrency === 'USD') newBalUSD += boxBaseDelta;
              else if (baseCurrency === 'IQD') newBalIQD += boxBaseDelta;

              if (targetCurrency === 'IQD') newBalIQD += boxTargetDelta;
              else if (targetCurrency === 'USD') newBalUSD += boxTargetDelta;

              return {
                ...acc,
                balanceIQD: newBalIQD,
                balanceUSD: newBalUSD,
              };
            }
          }

          // 2. التسوية الآجلة: التأثير على حساب العميل
          if (isCredit) {
            const isClientMatch = targetClientId 
              ? acc.id === targetClientId 
              : (targetClientName && acc.name.trim().toLowerCase() === targetClientName);

            if (isClientMatch) {
              let newBalIQD = acc.balanceIQD;
              let newBalUSD = acc.balanceUSD;

              if (baseCurrency === 'USD') newBalUSD += clientBaseDelta;
              else if (baseCurrency === 'IQD') newBalIQD += clientBaseDelta;

              if (targetCurrency === 'IQD') newBalIQD += clientTargetDelta;
              else if (targetCurrency === 'USD') newBalUSD += clientTargetDelta;

              return {
                ...acc,
                balanceIQD: newBalIQD,
                balanceUSD: newBalUSD,
              };
            }
          }

          return acc;
        });
      });

      setActiveReceiptTx(newTx);
      return;
    }

    const commissionDelta = newTx.commissionType === 'collected'
      ? (newTx.fee || 0)
      : (newTx.commissionType === 'on_us' ? -(newTx.fee || 0) : 0);
    const payableAmount = newTx.settlementAmount || Math.max(0, newTx.amount + commissionDelta);
    
    // التحقق هل القبض أو القيد بالدينار العراقي (سواء الحوالة بالدينار، أو بالدولار مع التحويل بسعر الصرف)
    const isSettlementIQD = newTx.settlementCurrency === 'IQD' || (!newTx.settlementCurrency && newTx.currency === 'IQD') || (newTx.currency === 'USD' && !!newTx.settlementAmount && newTx.settlementCurrency !== 'USD');
    const deltaIQD = isSettlementIQD 
      ? (newTx.settlementAmount || (newTx.currency === 'IQD' ? payableAmount : payableAmount * (newTx.exchangeRate || 1520)))
      : (newTx.currency === 'IQD' ? payableAmount : 0);
    const deltaUSD = isSettlementIQD ? 0 : (newTx.currency === 'USD' ? payableAmount : 0);

    // 1. If credit (آجلة): debit the customer's account in the Chart of Accounts
    if (newTx.transferSettlementType === 'credit' && newTx.accountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.type === 'vault') return acc;
        if (acc.id === newTx.accountId) {
          return {
            ...acc,
            balanceIQD: acc.balanceIQD - deltaIQD,
            balanceUSD: acc.balanceUSD - deltaUSD,
          };
        }
        return acc;
      }));
    }
    // 2. If cash (نقدية): credit the cash box (الصندوق) with collected funds - الخزنة لا تتأثر
    else if (newTx.transferSettlementType === 'cash') {
      const targetCashBoxId = newTx.cashBoxId;
      let boxUpdated = false;
      setAccounts(prev => prev.map(acc => {
        if (acc.type === 'vault') return acc; // الخزنة لا تتأثر
        const isMatch = targetCashBoxId 
          ? (acc.id === targetCashBoxId && acc.type === 'cash_box') 
          : (acc.type === 'cash_box' && !boxUpdated);
        if (isMatch) {
          boxUpdated = true;
          return {
            ...acc,
            balanceIQD: acc.balanceIQD + deltaIQD,
            balanceUSD: acc.balanceUSD + deltaUSD,
          };
        }
        return acc;
      }));
    }
    // 3. Fallback for other standard transactions
    else if (newTx.accountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === newTx.accountId) {
          const rawIQD = newTx.currency === 'IQD' ? newTx.amount : 0;
          const rawUSD = newTx.currency === 'USD' ? newTx.amount : 0;
          return {
            ...acc,
            balanceIQD: acc.balanceIQD + (newTx.type === 'cash_in' ? rawIQD : -rawIQD),
            balanceUSD: acc.balanceUSD + (newTx.type === 'cash_in' ? rawUSD : -rawUSD),
          };
        }
        return acc;
      }));
    }

    // Open receipt immediately for user convenience
    setActiveReceiptTx(newTx);
  };

  const handlePayout = (
    id: string, 
    notes?: string, 
    onAgentAccount?: boolean,
    targetAccountId?: string
  ) => {
    if (!checkCanCreateTransaction()) {
      return;
    }
    let targetTx: TransactionRecord | undefined;
    const targetAccount = targetAccountId ? accounts.find(a => a.id === targetAccountId) : undefined;

    setTransfers(prev => prev.map(t => {
      if (t.id === id) {
        targetTx = t;
        return {
          ...t,
          status: 'completed',
          payoutMethod: onAgentAccount ? 'agent_account' : 'cash',
          payoutAccountId: targetAccountId,
          payoutAccountName: targetAccount ? targetAccount.name : (onAgentAccount ? (t.agentName || 'حساب الوكيل') : 'صندوق النقدية'),
          notes: notes ? `${t.notes ? t.notes + ' | ' : ''}${notes}` : t.notes,
          completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      }
      return t;
    }));

    if (targetTx) {
      if (!onAgentAccount) {
        // نقدية: خصم من صندوق الكاش الرئيسي (الخزنة معزولة 100%)
        setAccounts(prev => prev.map(acc => {
          if (acc.type === 'vault') return acc;
          if (acc.type === 'cash_box') {
            if (targetTx?.currency === 'IQD') {
              return { ...acc, balanceIQD: acc.balanceIQD - targetTx.amount };
            } else if (targetTx?.currency === 'USD') {
              return { ...acc, balanceUSD: acc.balanceUSD - targetTx.amount };
            }
          }
          return acc;
        }));
      } else {
        // على حساب العميل أو الوكيل المختار من دليل الحسابات
        const fallbackAgentName = targetTx.agentName || targetTx.senderName;
        setAccounts(prev => prev.map(acc => {
          if (acc.type === 'vault') return acc; // الخزنة معزولة تماماً 100%

          const isMatch = targetAccountId 
            ? acc.id === targetAccountId 
            : (acc.name === fallbackAgentName || (fallbackAgentName && acc.name.includes(fallbackAgentName)) || targetTx?.accountName === acc.name);

          if (isMatch) {
            if (targetTx?.currency === 'IQD') {
              return { ...acc, balanceIQD: acc.balanceIQD - targetTx.amount };
            } else if (targetTx?.currency === 'USD') {
              return { ...acc, balanceUSD: acc.balanceUSD - targetTx.amount };
            }
          }
          return acc;
        }));
      }
    }
  };

  const handleCancelTransfer = (id: string, reason?: string) => {
    if (!checkCanCreateTransaction()) {
      return;
    }
    let wasCompletedTx: TransactionRecord | undefined;
    setTransfers(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'completed') {
          wasCompletedTx = t;
        }
        // إذا كان إلغاء تسليم، يعود لحالة جاهزة للاستلام
        const newStatus = reason && reason.includes('إلغاء التسليم') ? 'ready_for_pickup' : 'canceled';
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'ready_for_pickup' ? undefined : t.completedAt,
          canceledAt: newStatus === 'canceled' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
          cancelReason: reason || 'تم إلغاء الحوالة بناءً على طلب العميل',
        };
      }
      return t;
    }));

    if (wasCompletedTx && reason && reason.includes('إلغاء التسليم')) {
      const tx = wasCompletedTx as TransactionRecord;
      if (tx.payoutMethod === 'agent_account' || tx.payoutAccountId) {
        // إعادة المبلغ إلى حساب العميل أو الوكيل
        setAccounts(prev => prev.map(acc => {
          if (acc.type === 'vault') return acc;
          if (acc.id === tx.payoutAccountId || acc.name === tx.payoutAccountName || acc.name === tx.agentName) {
            if (tx.currency === 'IQD') return { ...acc, balanceIQD: acc.balanceIQD + tx.amount };
            if (tx.currency === 'USD') return { ...acc, balanceUSD: acc.balanceUSD + tx.amount };
          }
          return acc;
        }));
      } else {
        // إعادة المبلغ إلى الصندوق النقدي
        setAccounts(prev => prev.map(acc => {
          if (acc.type === 'vault') return acc;
          if (acc.type === 'cash_box') {
            if (tx.currency === 'IQD') return { ...acc, balanceIQD: acc.balanceIQD + tx.amount };
            if (tx.currency === 'USD') return { ...acc, balanceUSD: acc.balanceUSD + tx.amount };
          }
          return acc;
        }));
      }
    }
  };

  const handleCancelExchange = (id: string, reason?: string) => {
    const targetTx = transactions.find(t => t.id === id);
    if (!targetTx || targetTx.status === 'canceled') return;

    // 1. تحديث حالة الحركة في السجل إلى ملغاة
    setTransfers(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'canceled',
          canceledAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          cancelReason: reason || 'إلغاء حركة الصرافة بناءً على طلب المستخدم',
        };
      }
      return t;
    }));

    // 2. عكس الأثر المالي في الصندوق أو حساب العميل
    const isBuy = targetTx.exchangeOperationType === 'buy' || targetTx.titleAr.includes('شراء');
    const isCredit = targetTx.exchangeSettlementType === 'credit' || targetTx.transferSettlementType === 'credit';
    const baseAmount = targetTx.amount;
    const targetAmount = targetTx.targetAmount || (baseAmount * (targetTx.exchangeRate || 1520));
    const baseCurrency = targetTx.currency;
    const targetCurrency = targetTx.targetCurrency || 'IQD';

    // لعكس القيد نعكس إشارات التغير
    const revBoxBaseDelta = -(isBuy ? baseAmount : -baseAmount);
    const revBoxTargetDelta = -(isBuy ? -targetAmount : targetAmount);
    const revClientBaseDelta = -(isBuy ? -baseAmount : baseAmount);
    const revClientTargetDelta = -(isBuy ? targetAmount : -targetAmount);

    setAccounts(prev => prev.map(acc => {
      if (acc.type === 'vault') return acc; // الخزنة معزولة تماماً

      if (!isCredit && targetTx.cashBoxId && acc.id === targetTx.cashBoxId) {
        let newBalIQD = acc.balanceIQD;
        let newBalUSD = acc.balanceUSD;
        if (baseCurrency === 'USD') newBalUSD += revBoxBaseDelta;
        else if (baseCurrency === 'IQD') newBalIQD += revBoxBaseDelta;
        if (targetCurrency === 'IQD') newBalIQD += revBoxTargetDelta;
        else if (targetCurrency === 'USD') newBalUSD += revBoxTargetDelta;
        return { ...acc, balanceIQD: newBalIQD, balanceUSD: newBalUSD };
      }

      if (isCredit && targetTx.accountId && acc.id === targetTx.accountId) {
        let newBalIQD = acc.balanceIQD;
        let newBalUSD = acc.balanceUSD;
        if (baseCurrency === 'USD') newBalUSD += revClientBaseDelta;
        else if (baseCurrency === 'IQD') newBalIQD += revClientBaseDelta;
        if (targetCurrency === 'IQD') newBalIQD += revClientTargetDelta;
        else if (targetCurrency === 'USD') newBalUSD += revClientTargetDelta;
        return { ...acc, balanceIQD: newBalIQD, balanceUSD: newBalUSD };
      }

      return acc;
    }));
  };

  const handleUpdateExchangeTransaction = (updatedTx: TransactionRecord) => {
    const prevTx = transactions.find(t => t.id === updatedTx.id);
    if (!prevTx) return;

    // 1. تحديث بيانات السند في سجل الحركات
    setTransfers(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));

    // 2. عكس الأثر المالي السابق ثم تطبيق الأثر المالي المعدل
    const prevIsBuy = prevTx.exchangeOperationType === 'buy' || prevTx.titleAr.includes('شراء');
    const prevIsCredit = prevTx.exchangeSettlementType === 'credit' || prevTx.transferSettlementType === 'credit';
    const prevBaseAmt = prevTx.amount;
    const prevTargetAmt = prevTx.targetAmount || (prevBaseAmt * (prevTx.exchangeRate || 1520));

    const newIsBuy = updatedTx.exchangeOperationType === 'buy' || updatedTx.titleAr.includes('شراء');
    const newIsCredit = updatedTx.exchangeSettlementType === 'credit' || updatedTx.transferSettlementType === 'credit';
    const newBaseAmt = updatedTx.amount;
    const newTargetAmt = updatedTx.targetAmount || (newBaseAmt * (updatedTx.exchangeRate || 1520));

    setAccounts(prev => {
      // أ. عكس السند القديم
      const rolledBack = prev.map(acc => {
        if (acc.type === 'vault') return acc;
        if (!prevIsCredit && prevTx.cashBoxId && acc.id === prevTx.cashBoxId) {
          return {
            ...acc,
            balanceIQD: acc.balanceIQD - (prevIsBuy ? -prevTargetAmt : prevTargetAmt),
            balanceUSD: acc.balanceUSD - (prevIsBuy ? prevBaseAmt : -prevBaseAmt),
          };
        }
        if (prevIsCredit && prevTx.accountId && acc.id === prevTx.accountId) {
          return {
            ...acc,
            balanceIQD: acc.balanceIQD - (prevIsBuy ? prevTargetAmt : -prevTargetAmt),
            balanceUSD: acc.balanceUSD - (prevIsBuy ? -prevBaseAmt : prevBaseAmt),
          };
        }
        return acc;
      });

      // ب. تطبيق السند المعدل الجديد
      return rolledBack.map(acc => {
        if (acc.type === 'vault') return acc;
        if (!newIsCredit && updatedTx.cashBoxId && acc.id === updatedTx.cashBoxId) {
          return {
            ...acc,
            balanceIQD: acc.balanceIQD + (newIsBuy ? -newTargetAmt : newTargetAmt),
            balanceUSD: acc.balanceUSD + (newIsBuy ? newBaseAmt : -newBaseAmt),
          };
        }
        if (newIsCredit && updatedTx.accountId && acc.id === updatedTx.accountId) {
          return {
            ...acc,
            balanceIQD: acc.balanceIQD + (newIsBuy ? newTargetAmt : -newTargetAmt),
            balanceUSD: acc.balanceUSD + (newIsBuy ? -newBaseAmt : newBaseAmt),
          };
        }
        return acc;
      });
    });

    setActiveReceiptTx(updatedTx);
  };

  const handleRedeemOTP = (otp: string, pin: string): boolean => {
    let matched = false;
    setTransfers(prev => prev.map(t => {
      if (t.otpCode === otp && t.status === 'ready_for_pickup') {
        matched = true;
        return {
          ...t,
          status: 'completed',
          completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      }
      return t;
    }));
    return matched;
  };

  const handleRecordExchange = (fromCurr: CurrencyCode, toCurr: CurrencyCode, amount: number, result: number) => {
    const randomCode = `SL-EX-${Math.floor(100 + Math.random() * 900)}`;
    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      code: randomCode,
      type: 'exchange',
      titleAr: `صرف ${amount.toLocaleString()} ${fromCurr} إلى ${toCurr}`,
      senderName: 'صندوق النقد الرئيسي',
      receiverName: 'عميل الصرافة',
      amount,
      currency: fromCurr,
      targetAmount: result,
      targetCurrency: toCurr,
      fee: 0,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes: `صرف مباشر بسعر الصرف الحالي المعتمد`,
    };

    setTransfers(prev => [newTx, ...prev]);
  };

  const handleAddAccount = (newAcc: AccountItem) => {
    setAccounts(prev => [newAcc, ...prev]);
  };

  const handleUpdateAccount = (updatedAcc: AccountItem) => {
    setAccounts(prev => prev.map(a => a.id === updatedAcc.id ? updatedAcc : a));
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleLockAccount = (id: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, isLocked: !a.isLocked } : a));
  };

  const handleClearAllAccounts = () => {
    setAccounts([]);
  };

  const handleAddFiles = (newFiles: UploadedProjectFile[]) => {
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setActiveView('files');
  };

  // لوحة تسجيل الدخول للبرنامج (إذا لم يكن هناك جلسة نشطة)
  if (!currentUser) {
    return (
      <LoginScreen
        companyName={companyName}
        companyLogo={companyLogo}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className={`h-screen max-h-screen w-screen overflow-hidden flex flex-col fixed inset-0 font-sans antialiased selection:bg-[#0284c7] selection:text-white transition-colors duration-200 ${
      isDarkMode ? 'bg-[#031525] text-slate-100' : 'bg-[#f0f7fc] text-slate-900'
    }`} dir="rtl">
      
      {/* 1. الشريط العلوي الموحد على كامل عرض الصفحة (Full Width Top Header) */}
      <header className={`w-full h-14 px-4 sm:px-6 flex items-center justify-between border-b shrink-0 z-40 transition-colors duration-200 select-none shadow-xs ${
          isDarkMode 
            ? 'bg-[#031120] border-slate-800/90 text-white' 
            : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
        }`}>
          {/* الجانب الأيمن: الشعار واسم الشركة والنظام */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer text-right"
              title="العودة للرئيسية"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#064e3b] via-[#0C7A66] to-[#059669] text-white flex items-center justify-center shadow-md overflow-hidden p-1 shrink-0 border border-emerald-400/40 ring-1 ring-emerald-500/20">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="url(#header-crest-grad)" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M12 6V18M7.5 9.5L16.5 14.5M16.5 9.5L7.5 14.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="2.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1"/>
                    <defs>
                      <linearGradient id="header-crest-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#059669"/>
                        <stop offset="1" stopColor="#064e3b"/>
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>
              <div className="flex flex-col text-right">
                <h1 className="text-sm sm:text-base font-black tracking-tight leading-tight truncate max-w-[200px] sm:max-w-xs" title={companyName}>
                  {companyName || 'شركة الصرافة والحوالات'}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                  <span className="text-emerald-400 font-bold">
                    المحاسب الذكي
                  </span>
                  <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>•</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Smart Ledger
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* الجانب الأيسر: اسم اليوزر • الوضع الليلي • زر الإغلاق / الخروج */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* اسم المستخدم مع الأيقونة والصفة */}
            <div 
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800/70 border-slate-700/70 text-slate-200' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
              }`}
              title={`${currentUser?.fullName || 'المستخدم'} (${currentUser?.userType || 'مدير'})`}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                {currentUser?.fullName ? currentUser.fullName.slice(0, 2) : 'م.ع'}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-black truncate max-w-[120px] sm:max-w-[160px] leading-tight">
                  {currentUser?.fullName || 'المدير العام'}
                </span>
                <span className={`text-[9.5px] font-bold leading-tight ${
                  isDarkMode ? 'text-sky-400' : 'text-sky-600'
                }`}>
                  {currentUser?.userType === 'admin' || currentUser?.userType === 'مدير' || currentUser?.userType === 'الادارة'
                    ? 'مدير (صلاحيات كاملة)'
                    : currentUser?.userType === 'branch_manager' || currentUser?.userType === 'مدير فرع'
                    ? 'مدير فرع'
                    : 'موظف'}
                </span>
              </div>
            </div>

            {/* زر التبديل بين الوضع الليلي والنهاري */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                isDarkMode 
                  ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 text-amber-400' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title={isDarkMode ? 'التحويل إلى الوضع النهاري' : 'التحويل إلى الوضع الليلي'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden lg:inline text-[11px]">
                {isDarkMode ? 'نهاري' : 'ليلي'}
              </span>
            </button>

            {/* زر الإغلاق / الخروج */}
            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs border ${
                isDarkMode 
                  ? 'bg-rose-950/70 hover:bg-rose-900 border-rose-700/60 text-rose-300 hover:text-white' 
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
              }`}
              title="إغلاق وتسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[11px]">إغلاق</span>
            </button>
          </div>
        </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 h-full w-full">
        
        {/* Right RTL Sidebar (Deep Navy + Sky theme matching LoginScreen) */}
        <WebSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'settings' && currentTab !== 'settings') {
              setPreviousTab(currentTab);
            }
            setCurrentTab(tab);
            if (activeView !== 'web') setActiveView('web');
          }}
          settingsSubTab={settingsSubTab}
          onSelectSettingsSubTab={(sub) => setSettingsSubTab(sub)}
          onBackFromSettings={() => setCurrentTab(previousTab || 'dashboard')}
          onOpenNewTransaction={() => {
            if (checkCanCreateTransaction()) {
              setCurrentTab('issue_transfer');
            }
          }}
          activeView={activeView}
          onSwitchView={(v) => setActiveView(v)}
          transactionsCount={transactions.length}
          companyName={companyName}
          companyLogo={companyLogo}
          onLogout={handleLogout}
          currentUser={currentUser}
          userName={currentUser.fullName}
          userRole={currentUser.userType}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />

        {/* Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 h-full overflow-y-auto transition-colors duration-200 ${
          isDarkMode ? 'bg-[#031525]' : 'bg-[#f0f7fc]'
        }`}>
          {/* شريط حالة الترخيص والفترة التجريبية العلوي */}
          {editionInfo?.isClientEdition && (
            <>
              {/* في حال انتهاء الفترة التجريبية */}
              {editionInfo.isTrialExpired && (
                <div className="bg-gradient-to-r from-rose-800 via-rose-700 to-red-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold border-b border-rose-900 shadow-md shrink-0 sticky top-0 z-20">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-200 animate-pulse shrink-0" />
                    <span>
                      انتهت فترة الاستخدام التجريبي (30 يوماً). تم قفل إنشاء القيود المحاسبية، بينما يمكنك تصفح واستعراض البيانات بحرية تامة.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setPreviousTab(currentTab);
                      setCurrentTab('settings');
                      setSettingsSubTab('license');
                    }}
                    className="bg-white text-rose-900 hover:bg-rose-50 px-3.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>تفعيل النسخة الآن</span>
                  </button>
                </div>
              )}

              {/* في حال كانت الفترة التجريبية نشطة */}
              {editionInfo.activationStatus === 'trial' && !editionInfo.isTrialExpired && (
                <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white px-4 py-1.5 flex items-center justify-between text-[11px] font-bold border-b border-amber-800 shadow-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                    <span>
                      نسخة تجريبية نشطة لشركة «{editionInfo.companyName}» (متبقي {editionInfo.remainingTrialDays} يوماً على انتهاء التجربة).
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setPreviousTab(currentTab);
                      setCurrentTab('settings');
                      setSettingsSubTab('license');
                    }}
                    className="bg-black/20 hover:bg-black/30 text-white border border-white/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3 text-amber-300" />
                    <span>تفعيل النسخة</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Screen Body Router */}
          <main className="flex-1 flex flex-col min-h-full">
            {activeView === 'web' && (
              <>
                {currentTab === 'dashboard' && (
                  <WebDashboardScreen
                    accounts={accounts}
                    transactions={transactions}
                    currencies={currencies}
                    onOpenNewTransaction={() => {
                      if (checkCanCreateTransaction()) {
                        setIsNewTxModalOpen(true);
                      }
                    }}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                    isDarkMode={isDarkMode}
                    currentUser={currentUser}
                    companyName={companyName}
                    companyPhone={companyPhone}
                    companyAddress={companyAddress}
                    companyLogo={companyLogo}
                    onNavigateTab={(tab) => {
                      if (tab === 'files') {
                        setActiveView('files');
                      } else if (tab === 'mobile') {
                        setActiveView('mobile');
                      } else {
                        setCurrentTab(tab);
                      }
                    }}
                    onToggleTheme={handleToggleTheme}
                    onLogout={handleLogout}
                    onOpenSetup={() => setIsSetupModalOpen(true)}
                  />
                )}

                {currentTab === 'issue_transfer' && (
                  <WebIssueTransferScreen
                    isEmbedded={true}
                    isOpen={true}
                    onClose={() => setCurrentTab('dashboard')}
                    onNavigateToTransfers={() => setCurrentTab('transfers')}
                    onNavigateToPayout={() => setCurrentTab('payout_transfer')}
                    accounts={accounts}
                    agents={agents}
                    currencies={currencies}
                    transactions={transactions}
                    onCreateTransaction={handleTransactionCreated}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                    companyName={companyName}
                    systemUser={systemUser}
                    onNavigateToBankAccounts={() => setCurrentTab('bank_accounts')}
                  />
                )}

                {currentTab === 'payout_transfer' && (
                  <WebPayoutTransferScreen
                    isEmbedded={true}
                    isOpen={true}
                    onClose={() => setCurrentTab('dashboard')}
                    onNavigateToIssue={() => setCurrentTab('issue_transfer')}
                    onNavigateToTransfers={() => setCurrentTab('transfers')}
                    transactions={transactions}
                    accounts={accounts}
                    agents={agents}
                    onPayout={handlePayout}
                    onCancelTransfer={handleCancelTransfer}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                    companyName={companyName}
                    systemUser={systemUser}
                  />
                )}

                {currentTab === 'deposit_withdrawal' && (
                  <WebDepositWithdrawalScreen
                    isEmbedded={true}
                    isOpen={true}
                    onClose={() => setCurrentTab('dashboard')}
                    accounts={accounts}
                    transactions={transactions}
                    onCreateTransaction={handleTransactionCreated}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                    companyName={companyName}
                    systemUser={systemUser}
                  />
                )}

                {currentTab === 'fund_transfer' && (
                  <WebFundTransferScreen
                    isEmbedded={true}
                    isOpen={true}
                    onClose={() => setCurrentTab('dashboard')}
                    accounts={accounts}
                    transactions={transactions}
                    currencies={currencies}
                    onCreateTransaction={handleTransactionCreated}
                    companyName={companyName}
                    systemUser={systemUser}
                    onOpenReceipt={(tx) => setActiveReceiptTx(tx)}
                  />
                )}

                {currentTab === 'double_entry' && (
                  <WebDoubleEntryScreen
                    isEmbedded={true}
                    isOpen={true}
                    onClose={() => setCurrentTab('dashboard')}
                    accounts={accounts}
                    transactions={transactions}
                    onCreateTransaction={handleTransactionCreated}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                    companyName={companyName}
                    systemUser={systemUser}
                  />
                )}

                {currentTab === 'trial_balance' && (
                  <WebTrialBalanceScreen
                    accounts={accounts}
                    transactions={transactions}
                    currencies={currencies}
                    companyName={companyName}
                    systemUser={currentUser.fullName}
                    isDarkMode={isDarkMode}
                    onClose={() => setCurrentTab('dashboard')}
                    onNavigateToStatement={(accId) => {
                      setStatementInitialAccountId(accId);
                      setCurrentTab('statement');
                    }}
                  />
                )}

                {currentTab === 'accounts' && (
                  <WebAccountsScreen
                    accounts={accounts}
                    onAddAccount={handleAddAccount}
                    onUpdateAccount={handleUpdateAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onToggleLockAccount={handleToggleLockAccount}
                    onClearAllAccounts={handleClearAllAccounts}
                    onCreateTransaction={handleTransactionCreated}
                    onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
                    onClose={() => setCurrentTab('dashboard')}
                    onNavigateToBankAccounts={() => setCurrentTab('bank_accounts')}
                  />
                )}

                {currentTab === 'bank_accounts' && (
                  <WebBankAccountsScreen
                    accounts={accounts}
                    onAddAccount={handleAddAccount}
                    onUpdateAccount={handleUpdateAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onToggleLockAccount={handleToggleLockAccount}
                    companyName={companyName}
                    systemUser={currentUser.fullName}
                    onClose={() => setCurrentTab('dashboard')}
                    onNavigateToStatement={(accId) => {
                      setStatementInitialAccountId(accId);
                      setCurrentTab('statement');
                    }}
                    onOpenIssueTransferWithBank={(bankName, bankContact) => {
                      setCurrentTab('issue_transfer');
                    }}
                  />
                )}

                {currentTab === 'transfers' && (
                  <WebTransfersScreen
                    transactions={transactions}
                    onOpenNewTransaction={() => setCurrentTab('issue_transfer')}
                    onNavigateToIssue={() => setCurrentTab('issue_transfer')}
                    onNavigateToPayout={() => setCurrentTab('payout_transfer')}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                    onPayout={handlePayout}
                    onCancelTransfer={handleCancelTransfer}
                    onClose={() => setCurrentTab('dashboard')}
                  />
                )}

                {currentTab === 'statement' && (
                  <WebAccountStatementScreen
                    accounts={accounts}
                    transactions={transactions}
                    initialAccountId={statementInitialAccountId}
                    companyName={companyName}
                    companyPhone={companyPhone}
                    companyAddress={companyAddress}
                    companyLogo={companyLogo}
                    systemUser={currentUser?.fullName || systemUser}
                    onClose={() => setCurrentTab('dashboard')}
                  />
                )}

                {currentTab === 'exchange' && (
                  <WebExchangeScreen
                    accounts={accounts}
                    currencies={currencies}
                    transactions={transactions}
                    onCreateTransaction={handleTransactionCreated}
                    onUpdateTransaction={handleUpdateExchangeTransaction}
                    onCancelTransaction={handleCancelExchange}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                    companyName={companyName}
                    systemUser={currentUser.fullName}
                    onClose={() => setCurrentTab('dashboard')}
                  />
                )}

                {currentTab === 'network' && (
                  <WebAgentNetworkScreen
                    agents={agents}
                    transactions={transactions}
                    onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
                    onRedeemOTP={handleRedeemOTP}
                  />
                )}

                {currentTab === 'deposits' && (
                  <WebCashFlowScreen
                    transactions={transactions}
                    accounts={accounts}
                    companyName={companyName}
                    companyPhone={companyPhone}
                    companyAddress={companyAddress}
                    companyLogo={companyLogo}
                    systemUser={currentUser?.fullName || systemUser}
                    onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                  />
                )}

                {currentTab === 'cash_flow' && (
                  <WebCashFlowScreen
                    transactions={transactions}
                    accounts={accounts}
                    companyName={companyName}
                    companyPhone={companyPhone}
                    companyAddress={companyAddress}
                    companyLogo={companyLogo}
                    systemUser={currentUser?.fullName || systemUser}
                    onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
                    onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                  />
                )}

                {currentTab === 'users' && (
                  <WebUsersManagementScreen
                    companyName={companyName}
                    onClose={() => setCurrentTab('dashboard')}
                  />
                )}

                {currentTab === 'settings' && (
                  <WebSettingsScreen
                    activeTab={settingsSubTab}
                    onSelectTab={(sub) => setSettingsSubTab(sub)}
                    companyInfo={{
                      name: companyName,
                      phone: companyPhone,
                      address: companyAddress,
                      logo: companyLogo,
                    }}
                    onUpdateCompanyInfo={(info) => {
                      if (!editionInfo?.isClientEdition) {
                        setCompanyName(info.name);
                      }
                      setCompanyPhone(info.phone);
                      setCompanyAddress(info.address);
                      setCompanyLogo(info.logo || '');
                    }}
                    editionInfo={editionInfo}
                    onRefreshEditionInfo={fetchEditionInfo}
                    currentUser={{
                      name: currentUser.fullName,
                      role: currentUser.userType,
                      email: currentUser.username ? `${currentUser.username}@smartledger.iq` : 'admin@smartledger.iq',
                    }}
                    onUpdateCurrentUser={(usr) => setSystemUser(usr.name)}
                    accounts={accounts}
                    transactions={transactions}
                    currencies={currencies}
                    onRestoreData={(restored) => {
                      if (restored.accounts && restored.accounts.length > 0) {
                        setAccounts(restored.accounts);
                      }
                      if (restored.transactions && restored.transactions.length > 0) {
                        setTransfers(restored.transactions);
                      }
                      if (restored.currencies && restored.currencies.length > 0) {
                        setCurrencies(restored.currencies);
                      }
                      if (restored.companyInfo) {
                        if (restored.companyInfo.name) setCompanyName(restored.companyInfo.name);
                        if (restored.companyInfo.phone) setCompanyPhone(restored.companyInfo.phone);
                        if (restored.companyInfo.address) setCompanyAddress(restored.companyInfo.address);
                        if (restored.companyInfo.logo) setCompanyLogo(restored.companyInfo.logo);
                      }
                    }}
                    onClose={() => setCurrentTab(previousTab || 'dashboard')}
                  />
                )}
              </>
            )}

            {activeView === 'mobile' && (
              <SmartLedgerMobileSimulator
                accounts={accounts}
                transactions={transactions}
                currencies={currencies}
                agents={agents}
                onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
                onViewReceipt={(tx) => setActiveReceiptTx(tx)}
              />
            )}

            {activeView === 'files' && (
              <ProjectFilesAnalyzer
                uploadedFiles={uploadedFiles}
                onAddFiles={handleAddFiles}
                onClearFiles={() => setUploadedFiles([])}
                onSwitchToWeb={() => setActiveView('web')}
                onSwitchToMobile={() => setActiveView('mobile')}
              />
            )}
          </main>

        </div>

      </div>

      {/* Desktop Style Issue Transfer Window Modal (في حال فتحها كنافذة منبثقة مستقلة) */}
      {isIssueTransferModalOpen && currentTab !== 'issue_transfer' && (
        <WebIssueTransferScreen
          isOpen={isIssueTransferModalOpen}
          isEmbedded={false}
          onClose={() => setIsIssueTransferModalOpen(false)}
          accounts={accounts}
          agents={agents}
          currencies={currencies}
          transactions={transactions}
          onCreateTransaction={handleTransactionCreated}
          onViewReceipt={(tx) => setActiveReceiptTx(tx)}
          companyName={companyName}
          systemUser={systemUser}
          onNavigateToBankAccounts={() => {
            setIsIssueTransferModalOpen(false);
            setCurrentTab('bank_accounts');
          }}
        />
      )}

      {/* Desktop Style Payout Transfer Window Modal (تسلم حوالة - في حال فتحها كنافذة مستقلة) */}
      {isPayoutTransferModalOpen && currentTab !== 'payout_transfer' && (
        <WebPayoutTransferScreen
          isOpen={isPayoutTransferModalOpen}
          isEmbedded={false}
          onClose={() => {
            setIsPayoutTransferModalOpen(false);
          }}
          transactions={transactions}
          accounts={accounts}
          agents={agents}
          onPayout={handlePayout}
          onCancelTransfer={handleCancelTransfer}
          onViewReceipt={(tx) => setActiveReceiptTx(tx)}
          companyName={companyName}
          systemUser={systemUser}
        />
      )}

      {/* Desktop Style Deposit & Withdrawal Window Modal (سحب وإيداع - في حال فتحها كنافذة مستقلة) */}
      {isDepositWithdrawalModalOpen && currentTab !== 'deposit_withdrawal' && (
        <WebDepositWithdrawalScreen
          isOpen={isDepositWithdrawalModalOpen}
          isEmbedded={false}
          onClose={() => setIsDepositWithdrawalModalOpen(false)}
          accounts={accounts}
          transactions={transactions}
          onCreateTransaction={handleTransactionCreated}
          onViewReceipt={(tx) => setActiveReceiptTx(tx)}
          companyName={companyName}
          systemUser={systemUser}
        />
      )}

      {/* Desktop Style Double Entry Voucher Modal (إضافة قيد يومية مزدوج - في حال فتحها كنافذة مستقلة) */}
      {isDoubleEntryModalOpen && currentTab !== 'double_entry' && (
        <WebDoubleEntryScreen
          isOpen={isDoubleEntryModalOpen}
          isEmbedded={false}
          onClose={() => setIsDoubleEntryModalOpen(false)}
          accounts={accounts}
          transactions={transactions}
          onCreateTransaction={handleTransactionCreated}
          onViewReceipt={(tx) => setActiveReceiptTx(tx)}
          companyName={companyName}
          systemUser={systemUser}
        />
      )}

      {/* Desktop Style Fund Transfer Window Modal (مناقلة بين الصناديق - في حال فتحها كنافذة مستقلة) */}
      {isFundTransferModalOpen && currentTab !== 'fund_transfer' && (
        <WebFundTransferScreen
          isOpen={isFundTransferModalOpen}
          isEmbedded={false}
          onClose={() => setIsFundTransferModalOpen(false)}
          accounts={accounts}
          transactions={transactions}
          currencies={currencies}
          onCreateTransaction={handleTransactionCreated}
          companyName={companyName}
          systemUser={systemUser}
          onOpenReceipt={(tx) => setActiveReceiptTx(tx)}
        />
      )}

      {/* Unified New Transaction Modal */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        accounts={accounts}
        agents={agents}
        onTransactionCreated={handleTransactionCreated}
      />

      {/* Official Printable Voucher / Receipt Modal */}
      <TransactionReceiptModal
        transaction={activeReceiptTx}
        onClose={() => setActiveReceiptTx(null)}
      />

      {/* Client Activation & Setup Modal (First Launch Choice: 30-Day Trial or Direct Key) */}
      <ClientActivationModal
        isOpen={isSetupModalOpen}
        editionInfo={editionInfo}
        onSuccess={() => {
          setIsSetupModalOpen(false);
          fetchEditionInfo();
        }}
        onClose={() => setIsSetupModalOpen(false)}
      />

      {/* License Locked Modal (When Trial Expired and client attempts to make an entry) */}
      <LicenseLockedModal
        isOpen={isLicenseLockedModalOpen}
        editionInfo={editionInfo}
        onClose={() => setIsLicenseLockedModalOpen(false)}
        onSuccess={() => {
          setIsLicenseLockedModalOpen(false);
          fetchEditionInfo();
        }}
        onNavigateToSettingsLicense={() => {
          setPreviousTab(currentTab);
          setCurrentTab('settings');
          setSettingsSubTab('license');
        }}
      />

    </div>
  );
}
