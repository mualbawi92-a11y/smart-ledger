import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  Download, 
  Calendar, 
  RotateCcw, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  X, 
  Wallet, 
  Coins, 
  Users, 
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AccountItem, TransactionRecord, CurrencyCode, AccountType, CurrencyRate } from '../../../types';
import { ALL_WORLD_CURRENCIES, SystemCurrencyItem } from '../../../data/allCurrenciesData';

export interface WebTrialBalanceScreenProps {
  accounts: AccountItem[];
  transactions: TransactionRecord[];
  currencies?: CurrencyRate[];
  companyName?: string;
  systemUser?: string;
  onNavigateToStatement?: (accountId: string) => void;
  onClose?: () => void;
  isDarkMode?: boolean;
}

// فلتر حالة الرصيد: حصراً دائن - مدين - الكل كما طلب المستخدم تماماً
export type BalanceFilterType = 'all' | 'creditor_only' | 'debtor_only';

export interface AccountBalanceRow {
  id: string;
  code: string;
  name: string;
  phone?: string;
  type: AccountType;
  typeLabelAr: string;
  city?: string;
  isLocked?: boolean;
  creditBalance: number; // رصيد دائن (له 🟢 أخضر)
  debitBalance: number;  // رصيد مدين (عليه 🔴 أحمر)
  totalDebitSum: number;
  totalCreditSum: number;
  hasActivity: boolean;
}

export const WebTrialBalanceScreen: React.FC<WebTrialBalanceScreenProps> = ({
  accounts,
  transactions,
  currencies,
  companyName = '',
  systemUser = 'المدير المالي',
  onNavigateToStatement,
  onClose,
  isDarkMode = false,
}) => {
  // 1. جلب العملات المفعلة فعلياً في البرنامج من الإعدادات وقاعدة البيانات
  const activeCurrencies = useMemo(() => {
    // أ. فحص إعدادات العملات المحفوظة بالنظام (حيث isActive === true)
    const savedSystem = localStorage.getItem('smart_ledger_system_currencies');
    if (savedSystem) {
      try {
        const parsed: SystemCurrencyItem[] = JSON.parse(savedSystem);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const active = parsed.filter(c => c.isActive);
          if (active.length > 0) {
            return active.map(c => ({
              code: c.code,
              nameAr: c.nameAr,
              symbol: c.symbol || c.code
            }));
          }
        }
      } catch {}
    }

    // ب. العملات الممررة من البرنامج العام
    if (currencies && currencies.length > 0) {
      return currencies.map(c => ({
        code: c.code,
        nameAr: c.nameAr,
        symbol: c.code === 'IQD' ? 'د.ع' : c.code === 'USD' ? '$' : c.code
      }));
    }

    // ج. العملات المفعلة افتراضياً
    return ALL_WORLD_CURRENCIES.filter(c => c.isActive).map(c => ({
      code: c.code,
      nameAr: c.nameAr,
      symbol: c.symbol || c.code
    }));
  }, [currencies]);

  // 2. الفلاتر المنسدلة
  // العملة المختارة (افتراضياً IQD إن كانت مفعلة، وإلا أول عملة مفعلة، أو ALL)
  const [currency, setCurrency] = useState<string>(() => {
    return 'IQD';
  });

  // التأكد من أن العملة المختارة تنتمي للعملات المفعلة أو ALL
  useEffect(() => {
    if (currency !== 'ALL' && activeCurrencies.length > 0) {
      const exists = activeCurrencies.some(c => c.code === currency);
      if (!exists) {
        setCurrency(activeCurrencies[0].code);
      }
    }
  }, [activeCurrencies, currency]);

  // فلتر الدائن والمدين: حصراً (دائن - مدين - الكل)
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilterType>('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 3. فلتر التاريخ (تاريخ من 01-01-2026 إلى 23-09-2026 مع خيار إطفاء / تشغيل لتاريخ من)
  const [isDateFromEnabled, setIsDateFromEnabled] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>('2026-01-01');
  const [dateTo, setDateTo] = useState<string>('2026-09-23');

  // 4. التحكم بعدد الأسطر لثبات حجم النافذة (افتراضي 10 أسطر) والتنقل بين الصفحات
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 5. السطر المحدد للتنقل بالأسهم بدون ماوس
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // تفريغ الفلاتر وإعادة ضبطها
  const handleResetFilters = () => {
    setSearchQuery('');
    setAccountTypeFilter('all');
    setBalanceFilter('all');
    setCurrency(activeCurrencies.some(c => c.code === 'IQD') ? 'IQD' : activeCurrencies[0]?.code || 'ALL');
    setIsDateFromEnabled(false);
    setDateFrom('2026-01-01');
    setDateTo('2026-09-23');
    setPageSize(10);
  };

  // دالة تطبيع النصوص العربية للبحث والمطابقة
  const normalizeArabic = (str: string) => {
    if (!str) return '';
    return str
      .replace(/\s*\(.*?\)/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, ' ')
      .trim()
      .toLowerCase();
  };

  // تسمية أنواع الحسابات بالعربية
  const getAccountTypeLabel = (type: AccountType): string => {
    switch (type) {
      case 'cash_box': return 'صندوق نقدي';
      case 'vault': return 'خزنة رئيسية';
      case 'client': return 'عميل / زبون';
      case 'bank': return 'مصرف / بنك';
      case 'supplier': return 'شركة / وكيل';
      case 'expenses': return 'مصروفات';
      case 'revenues': return 'إيرادات';
      default: return 'حساب عام';
    }
  };

  // دالة احتساب أثر الحركة المحاسبية على الحساب مع احترام صارم لقواعد AGENTS.md
  const getTxAccountImpact = (
    t: TransactionRecord,
    account: AccountItem,
    targetCurr: string
  ): { debit: number; credit: number } => {
    // 1. فلتر العملة
    if (targetCurr !== 'ALL' && t.currency !== targetCurr) {
      if (t.type === 'exchange') {
        if (t.currency !== targetCurr && t.targetCurrency !== targetCurr) {
          return { debit: 0, credit: 0 };
        }
      } else {
        return { debit: 0, credit: 0 };
      }
    }

    // 2. عزل الخزنة الصارم (Vault Isolation):
    // حساب الخزنة لا يسجل عليه أي شيء نهائياً في عمليات القبض والصرف المباشرة للزبائن
    if (account.type === 'vault') {
      if (t.type === 'cash_in' || t.type === 'cash_out') {
        return { debit: 0, credit: 0 };
      }
    }

    const accNorm = normalizeArabic(account.name);
    const accPhone = account.phone ? account.phone.trim() : '';

    const isBoxAccount = 
      account.type === 'cash_box' || 
      accNorm.includes('صندوق') || 
      accNorm.includes('كاش') || 
      account.name.toLowerCase().includes('cash');

    const isDirectAccount = t.accountId === account.id || (t.accountName && normalizeArabic(t.accountName) === accNorm);
    const isSender = (t.senderName && (normalizeArabic(t.senderName).includes(accNorm) || accNorm.includes(normalizeArabic(t.senderName)))) ||
                     (accPhone && t.senderPhone && t.senderPhone.trim() === accPhone);
    const isReceiver = (t.receiverName && (normalizeArabic(t.receiverName).includes(accNorm) || accNorm.includes(normalizeArabic(t.receiverName)))) ||
                       (accPhone && t.receiverPhone && t.receiverPhone.trim() === accPhone);
    const isAgent = t.agentName && (normalizeArabic(t.agentName).includes(accNorm) || accNorm.includes(normalizeArabic(t.agentName)));

    const isCashBoxMatch = isBoxAccount && (
      (t.cashBoxId && t.cashBoxId === account.id) ||
      (t.cashBoxName && (normalizeArabic(t.cashBoxName).includes(accNorm) || accNorm.includes(normalizeArabic(t.cashBoxName)))) ||
      isDirectAccount ||
      (isReceiver && t.type === 'cash_in') ||
      (isSender && t.type === 'cash_out') ||
      (!t.cashBoxId && !t.cashBoxName)
    );

    // =========================================================================
    // حساب الصندوق النقدي (Cash Box):
    // عند القبض (سند قبض نقدي): الصندوق مدين (Debit) 🔴
    // عند الصرف (سند صرف نقدي): الصندوق دائن (Credit) 🟢
    // =========================================================================
    if (isBoxAccount) {
      if (t.type === 'cash_in') {
        if (!isCashBoxMatch) return { debit: 0, credit: 0 };
        return { debit: t.amount, credit: 0 };
      }
      if (t.type === 'cash_out') {
        if (!isCashBoxMatch) return { debit: 0, credit: 0 };
        return { debit: 0, credit: t.amount };
      }
    }

    const matches = isDirectAccount || isSender || isReceiver || isAgent;
    if (!matches) {
      return { debit: 0, credit: 0 };
    }

    let debit = 0;
    let credit = 0;

    if (t.type === 'journal') {
      if (isReceiver || (isDirectAccount && !isSender)) {
        debit = t.amount;
      } else if (isSender) {
        credit = t.amount;
      } else {
        debit = t.amount;
      }
    } else if (t.type === 'cash_in') {
      // قبض من عميل: العميل دائن (Credit / له) 🟢
      credit = t.amount;
    } else if (t.type === 'cash_out') {
      // صرف لعميل: العميل مدين (Debit / عليه) 🔴
      debit = t.amount;
    } else if (t.type === 'transfer_outgoing') {
      if (isSender || isDirectAccount) {
        debit = t.settlementAmount || t.amount;
      } else if (isReceiver) {
        credit = t.targetAmount || t.amount;
      } else {
        debit = t.amount;
      }
    } else if (t.type === 'transfer_incoming') {
      if (isReceiver) {
        credit = t.amount;
      } else if (isSender || isAgent) {
        debit = t.amount;
      } else {
        credit = t.amount;
      }
    } else if (t.type === 'exchange') {
      if (isBoxAccount) {
        const isBuy = t.exchangeOperationType === 'buy' || t.titleAr.includes('شراء');
        const baseAmount = t.amount;
        const targetAmount = t.targetAmount || (baseAmount * (t.exchangeRate || 1520));

        if (targetCurr === 'ALL') {
          debit = baseAmount;
        } else if (t.currency === targetCurr) {
          if (isBuy) debit = baseAmount;
          else credit = baseAmount;
        } else if (t.targetCurrency === targetCurr) {
          if (isBuy) credit = targetAmount;
          else debit = targetAmount;
        }
      } else {
        debit = t.amount;
      }
    } else {
      if (isReceiver) credit = t.amount;
      else debit = t.amount;
    }

    return { debit, credit };
  };

  // احتساب أرصدة الحسابات
  const allAccountRows: AccountBalanceRow[] = useMemo(() => {
    // تصفية التاريخ حسب تفعيل "تاريخ من" و "إلى تاريخ"
    const filteredTx = transactions.filter(t => {
      if (!t.createdAt) return true;
      const txDate = t.createdAt.slice(0, 10);
      if (isDateFromEnabled && dateFrom && txDate < dateFrom) return false;
      if (dateTo && txDate > dateTo) return false;
      return true;
    });

    return accounts.map((acc, index) => {
      let totalDebitSum = 0;
      let totalCreditSum = 0;

      for (const t of filteredTx) {
        const impact = getTxAccountImpact(t, acc, currency);
        totalDebitSum += impact.debit;
        totalCreditSum += impact.credit;
      }

      // حساب الرصيد الصافي:
      // إذا كان الدائن أكبر: رصيد دائن (له 🟢 أخضر)
      // إذا كان المدين أكبر: رصيد مدين (عليه 🔴 أحمر)
      let creditBalance = 0;
      let debitBalance = 0;

      if (totalCreditSum > totalDebitSum) {
        creditBalance = totalCreditSum - totalDebitSum;
      } else if (totalDebitSum > totalCreditSum) {
        debitBalance = totalDebitSum - totalCreditSum;
      }

      const hasActivity = totalDebitSum > 0 || totalCreditSum > 0 || creditBalance > 0 || debitBalance > 0;

      return {
        id: acc.id,
        code: acc.code || String(index + 1),
        name: acc.name,
        phone: acc.phone,
        type: acc.type,
        typeLabelAr: getAccountTypeLabel(acc.type),
        city: acc.city,
        isLocked: acc.isLocked,
        creditBalance,
        debitBalance,
        totalDebitSum,
        totalCreditSum,
        hasActivity,
      };
    });
  }, [accounts, transactions, currency, isDateFromEnabled, dateFrom, dateTo]);

  // تصفية السجلات بناءً على الفلاتر المنسدلة والبحث
  const filteredRows = useMemo(() => {
    return allAccountRows.filter(row => {
      // 1. فلتر حالة الرصيد: حصراً دائن - مدين - الكل
      if (balanceFilter === 'creditor_only' && row.creditBalance <= 0) return false;
      if (balanceFilter === 'debtor_only' && row.debitBalance <= 0) return false;

      // 2. فلتر نوع الحساب
      if (accountTypeFilter !== 'all') {
        if (accountTypeFilter === 'clients_only' && row.type !== 'client') return false;
        if (accountTypeFilter === 'banks_only' && row.type !== 'bank') return false;
        if (accountTypeFilter === 'boxes_vaults' && row.type !== 'cash_box' && row.type !== 'vault') return false;
        if (accountTypeFilter === 'agents_companies' && row.type !== 'supplier') return false;
        if (accountTypeFilter === 'expenses_revenues' && row.type !== 'expenses' && row.type !== 'revenues') return false;
      }

      // 3. فلتر البحث السريع
      if (searchQuery.trim()) {
        const q = normalizeArabic(searchQuery);
        const nameMatch = normalizeArabic(row.name).includes(q);
        const codeMatch = row.code.toLowerCase().includes(searchQuery.toLowerCase());
        const phoneMatch = row.phone ? row.phone.includes(searchQuery.trim()) : false;
        const cityMatch = row.city ? normalizeArabic(row.city).includes(q) : false;
        if (!nameMatch && !codeMatch && !phoneMatch && !cityMatch) return false;
      }

      return true;
    });
  }, [allAccountRows, balanceFilter, accountTypeFilter, searchQuery]);

  // إعادة ضبط الصفحة إلى 1 عند تغير الفلاتر
  useEffect(() => {
    setCurrentPage(1);
  }, [currency, balanceFilter, accountTypeFilter, searchQuery, isDateFromEnabled, dateFrom, dateTo, pageSize]);

  // حساب الصفحات لثبات حجم النافذة (Pagination)
  const totalPages = useMemo(() => {
    if (pageSize >= 999999) return 1;
    return Math.ceil(filteredRows.length / pageSize) || 1;
  }, [filteredRows.length, pageSize]);

  const paginatedRows = useMemo(() => {
    if (pageSize >= 999999) return filteredRows;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // إجماليات الأرصدة (لكامل الحسابات المفلترة)
  const totals = useMemo(() => {
    let sumCredit = 0;
    let sumDebit = 0;
    let creditorsCount = 0;
    let debtorsCount = 0;

    for (const r of filteredRows) {
      sumCredit += r.creditBalance;
      sumDebit += r.debitBalance;
      if (r.creditBalance > 0) creditorsCount++;
      if (r.debitBalance > 0) debtorsCount++;
    }

    const netDifference = sumCredit - sumDebit;

    return {
      sumCredit,
      sumDebit,
      netDifference,
      creditorsCount,
      debtorsCount,
      totalCount: filteredRows.length,
    };
  }, [filteredRows]);

  // دعم اختصارات الكيبورد (ESC, F6, F3, الأسهم و Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (e.key === 'Escape' && onClose && !isInput) {
        onClose();
        return;
      }

      if (e.key === 'F6') {
        e.preventDefault();
        window.print();
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        handleResetFilters();
        return;
      }

      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isInput) {
        if (paginatedRows.length === 0) return;
        e.preventDefault();

        const currentIndex = paginatedRows.findIndex(r => r.id === selectedAccountId);

        if (e.key === 'ArrowDown') {
          if (currentIndex === -1) {
            setSelectedAccountId(paginatedRows[0].id);
          } else if (currentIndex < paginatedRows.length - 1) {
            setSelectedAccountId(paginatedRows[currentIndex + 1].id);
          }
        } else if (e.key === 'ArrowUp') {
          if (currentIndex === -1) {
            setSelectedAccountId(paginatedRows[paginatedRows.length - 1].id);
          } else if (currentIndex > 0) {
            setSelectedAccountId(paginatedRows[currentIndex - 1].id);
          }
        }
      }

      if (e.key === 'Enter' && selectedAccountId && onNavigateToStatement && !isInput) {
        onNavigateToStatement(selectedAccountId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedRows, selectedAccountId, onNavigateToStatement, onClose]);

  // تصدير الأرصدة إلى ملف Excel
  const handleExportExcel = () => {
    const dataToExport = filteredRows.map((r, i) => ({
      'ت': i + 1,
      'رقم الحساب': r.code,
      'اسم الحساب': r.name,
      'النوع': r.typeLabelAr,
      'الهاتف': r.phone || '',
      'الرصيد دائن (🟢 له)': r.creditBalance,
      'الرصيد مدين (🔴 عليه)': r.debitBalance,
    }));

    dataToExport.push({
      'ت': '' as any,
      'رقم الحساب': 'المجموع',
      'اسم الحساب': `إجمالي الحسابات: ${filteredRows.length}`,
      'النوع': '',
      'الهاتف': '',
      'الرصيد دائن (🟢 له)': totals.sumCredit,
      'الرصيد مدين (🔴 عليه)': totals.sumDebit,
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'أرصدة الحسابات');
    
    const fileName = `أرصدة_الحسابات_${currency}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const formatNum = (val: number) => {
    if (val === 0) return '-';
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getCurrencySymbol = (curr: string) => {
    if (curr === 'ALL') return 'كافة العملات';
    const match = activeCurrencies.find(c => c.code === curr);
    if (match) return match.symbol;
    if (curr === 'USD') return '$';
    if (curr === 'IQD') return 'د.ع';
    return curr;
  };

  return (
    <div className="p-3.5 sm:p-5 space-y-3 w-full max-w-full mx-auto text-slate-800" dir="rtl">
      
      {/* 1. الترويسة الرئيسية الموحدة بالهوية الزرقاء كبقية شاشات النظام */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-sky-200 border border-white/20 shadow-inner">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>أرصدة الحسابات</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-sky-100 border border-white/20">
                الأرصدة الحالية (دائن / مدين)
              </span>
            </h1>
            <p className="text-[11px] text-sky-100/80">
              {companyName} • استعراض أرصدة العملاء والصناديق والبنوك مع الدخول المباشر لكشف الحساب
            </p>
          </div>
        </div>

        {/* أزرار الإجراءات السريعة الموحدة */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="تصدير الأرصدة إلى ملف إكسل"
          >
            <Download className="w-3.5 h-3.5 text-emerald-100" />
            <span>تصدير إكسل</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="طباعة التقرير (F6)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>طباعة .F6</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              title="إغلاق والعودة (ESC)"
            >
              <X className="w-3.5 h-3.5" />
              <span>انهاء .ESC</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. شريط الإحصائيات المدمج بدقة والتصميم الموحد (دائن 🟢 أخضر / مدين 🔴 أحمر) */}
      <div className="p-2 bg-slate-50/90 border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between gap-2.5 text-xs shrink-0 flex-wrap">
        
        {/* إجمالي الرصيد دائن (له 🟢 أخضر) */}
        <div className="flex-1 min-w-[220px] flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
            <span className="font-bold text-emerald-950 whitespace-nowrap text-[11px]">إجمالي دائن 🟢 (لهم):</span>
          </div>
          <div className="px-2.5 py-0.5 bg-[#fffef0] border border-emerald-300 rounded-lg text-xs font-mono font-black text-emerald-700 shadow-inner">
            {formatNum(totals.sumCredit)} <span className="text-[10px] font-bold text-slate-600">{getCurrencySymbol(currency)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 font-mono">({totals.creditorsCount} حساب)</span>
        </div>

        {/* إجمالي الرصيد مدين (عليه 🔴 أحمر) */}
        <div className="flex-1 min-w-[220px] flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-rose-300 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
            <span className="font-bold text-rose-950 whitespace-nowrap text-[11px]">إجمالي مدين 🔴 (عليهم):</span>
          </div>
          <div className="px-2.5 py-0.5 bg-[#fffef0] border border-rose-300 rounded-lg text-xs font-mono font-black text-rose-700 shadow-inner">
            {formatNum(totals.sumDebit)} <span className="text-[10px] font-bold text-slate-600">{getCurrencySymbol(currency)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 font-mono">({totals.debtorsCount} حساب)</span>
        </div>

        {/* صافي الفرق */}
        <div className="flex-1 min-w-[220px] flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">صافي الفرق:</span>
          <div className={`px-2.5 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-mono font-black shadow-inner ${totals.netDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatNum(Math.abs(totals.netDifference))} <span className="text-[10px] font-bold text-slate-600">{getCurrencySymbol(currency)}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">
            ({totals.netDifference >= 0 ? 'لصالح العملاء' : 'لصالح الشركة'})
          </span>
        </div>

        {/* عدد الحسابات الكلي */}
        <div className="shrink-0 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">عدد الحسابات:</span>
          <div className="px-2.5 py-0.5 bg-sky-50 border border-sky-200 rounded-lg text-xs font-mono font-black text-sky-900 shadow-inner min-w-[32px] text-center">
            {totals.totalCount}
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. شريط الفلاتر بالكامل في سطر واحد فقط 
          - فلتر العملة: يجلب حصراً العملات المفعلة في البرنامج
          - فلتر الرصيد: حصراً دائن - مدين - الكل (بدون أي خيارات إضافية)
          - خلفية الحقول الموحدة [#fffef0] كبقية أوبشنات التسليم والاستعلام
          ========================================================================= */}
      <div className="p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs shrink-0">
        <div className="flex items-end gap-2 text-xs flex-wrap xl:flex-nowrap pb-0.5">
          
          {/* 1. العملة (العملات المفعلة في البرنامج + خيار الكل) */}
          <div className="w-36 shrink-0">
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5 whitespace-nowrap">العملة:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-7 px-2 py-0.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner cursor-pointer"
            >
              <option value="ALL">الكل (كافة العملات)</option>
              {activeCurrencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.nameAr} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. حالة الرصيد: حصراً (دائن - مدين - الكل) */}
          <div className="w-28 shrink-0">
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5 whitespace-nowrap">الرصيد:</label>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as BalanceFilterType)}
              className="w-full h-7 px-2 py-0.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner cursor-pointer"
            >
              <option value="all">الكل</option>
              <option value="creditor_only">دائن</option>
              <option value="debtor_only">مدين</option>
            </select>
          </div>

          {/* 3. نوع الحساب (قائمة منسدلة) */}
          <div className="w-36 shrink-0">
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5 whitespace-nowrap">نوع الحساب:</label>
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="w-full h-7 px-2 py-0.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner cursor-pointer"
            >
              <option value="all">كافة الأنواع (الكل)</option>
              <option value="clients_only">عملاء وزبائن فقط</option>
              <option value="banks_only">بنوك ومصارف</option>
              <option value="boxes_vaults">صناديق وخزائن</option>
              <option value="agents_companies">شركات ووكلاء</option>
              <option value="expenses_revenues">مصروفات وإيرادات</option>
            </select>
          </div>

          {/* 4. التاريخ بالشكل المطلوب: تاريخ من 01-01-2026 إلى 23-09-2026 مع اختيار إطفاء / تشغيل لتاريخ من */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDateFromEnabled}
                  onChange={(e) => setIsDateFromEnabled(e.target.checked)}
                  className="w-3 h-3 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
                <span>تاريخ من:</span>
              </label>
              {!isDateFromEnabled && (
                <span className="text-[9px] text-slate-400 font-medium mr-1">(مطفأ)</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFrom}
                disabled={!isDateFromEnabled}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`h-7 px-1.5 py-0.5 border rounded-lg text-xs font-mono font-bold focus:outline-none shadow-inner transition-colors ${
                  isDateFromEnabled 
                    ? 'bg-[#fffef0] border-slate-300 text-slate-900 focus:border-sky-500' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="تاريخ من"
              />
              <span className="text-[10px] font-bold text-slate-500 px-0.5">إلى</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-7 px-1.5 py-0.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none shadow-inner"
                title="إلى تاريخ"
              />
            </div>
          </div>

          {/* 5. البحث السريع */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5 whitespace-nowrap">بحث سريع:</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اسم، كود، هاتف، مدينة..."
                className="w-full h-7 pl-6 pr-2 py-0.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-6 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* 6. زر تفريغ الفلاتر (F3) */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-7 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              title="إفراغ وتصفير الفلاتر (F3)"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>تفريغ .F3</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================================
          4. جدول أرصدة الحسابات (السجل الموحد المطابق للتسليم والاستعلام)
          حجم النافذة ثابت ويأخذ 10 أسطر افتراضياً مع إمكانية زيادة الأسطر من الأسفل
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        
        {/* حاوية الجدول */}
        <div className="overflow-x-auto min-h-[440px] flex flex-col justify-between">
          <table className="w-full text-right text-xs border-collapse">
            
            {/* ترويسة الجدول المتناسقة تماماً مع أوبشنات التسليم والاستعلام */}
            <thead className="bg-[#f0f9ff] text-slate-700 font-bold sticky top-0 border-b border-sky-200/80 z-10 shadow-2xs">
              <tr>
                <th className="py-2.5 px-3 border-l border-slate-200/80 w-14 text-center whitespace-nowrap">ت</th>
                <th className="py-2.5 px-3 border-l border-slate-200/80 min-w-[240px] text-right whitespace-nowrap">اسم الحساب</th>
                <th className="py-2.5 px-3 border-l border-slate-200/80 w-32 text-right whitespace-nowrap">نوع الحساب</th>
                <th className="py-2.5 px-3.5 border-l border-slate-200/80 min-w-[150px] text-left font-mono font-black text-emerald-800 bg-emerald-50/80 whitespace-nowrap">
                  الرصيد دائن 🟢 (له)
                </th>
                <th className="py-2.5 px-3.5 border-l border-slate-200/80 min-w-[150px] text-left font-mono font-black text-rose-800 bg-rose-50/80 whitespace-nowrap">
                  الرصيد مدين 🔴 (عليه)
                </th>
                <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>

            {/* صفوف الحسابات (10 أسطر بالصفحة للحفاظ على ثبات الحجم) */}
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24 text-slate-400 bg-slate-50/40 font-medium">
                    <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-bold text-slate-600 text-sm">لا توجد حسابات مطابقة لشروط الفلترة والبحث</p>
                    <p className="text-xs text-slate-400 mt-1">تأكد من تعديل الفلاتر أو تفعيل/إطفاء فترة التاريخ</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => {
                  const isSelected = selectedAccountId === row.id;
                  const rowIndex = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedAccountId(row.id)}
                      onDoubleClick={() => onNavigateToStatement && onNavigateToStatement(row.id)}
                      className={`cursor-pointer transition-colors h-11 ${
                        isSelected 
                          ? 'bg-sky-100/90 font-bold text-sky-950 border-y border-sky-300 ring-1 ring-sky-400' 
                          : 'hover:bg-slate-50/90'
                      }`}
                    >
                      {/* ت (التسلسل العام) */}
                      <td className="py-2 px-3 border-l border-slate-200/50 text-center font-mono text-slate-400 font-bold">
                        {rowIndex}
                      </td>

                      {/* اسم الحساب */}
                      <td className="py-2 px-3 border-l border-slate-200/50">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0"></span>}
                          <span className={`font-bold text-sm ${isSelected ? 'text-sky-950 font-black' : 'text-slate-900'}`}>
                            {row.name}
                          </span>
                          {row.isLocked && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                              مقفل
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          {row.code && <span className="font-mono text-slate-500">#{row.code}</span>}
                          {row.phone && <span className="font-mono">{row.phone}</span>}
                          {row.city && <span>• {row.city}</span>}
                        </div>
                      </td>

                      {/* نوع الحساب */}
                      <td className="py-2 px-3 border-l border-slate-200/50">
                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          row.type === 'client'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : row.type === 'bank'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : row.type === 'cash_box'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : row.type === 'vault'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : row.type === 'expenses'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {row.typeLabelAr}
                        </span>
                      </td>

                      {/* الرصيد دائن 🟢 (له) - لون أخضر محاسبي */}
                      <td className="py-2 px-3.5 border-l border-slate-200/50 text-left font-mono font-black text-emerald-700 bg-emerald-50/30 text-sm whitespace-nowrap">
                        {formatNum(row.creditBalance)}
                      </td>

                      {/* الرصيد مدين 🔴 (عليه) - لون أحمر محاسبي */}
                      <td className="py-2 px-3.5 border-l border-slate-200/50 text-left font-mono font-black text-rose-700 bg-rose-50/30 text-sm whitespace-nowrap">
                        {formatNum(row.debitBalance)}
                      </td>

                      {/* إجراءات: زر كشف الحساب */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToStatement) onNavigateToStatement(row.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors shadow-2xs cursor-pointer"
                          title="فتح كشف حساب تفصيلي"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span>كشف حساب</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* 5. شريط التحكم بعدد الأسطر والتنقل بالصفحات في الأسفل (Pagination Footer) */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* اختيار عدد الأسطر بالصفحة للحفاظ على ثبات حجم النافذة */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 text-xs">عدد الأسطر في الصفحة:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-[#fffef0] border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500 cursor-pointer shadow-inner"
            >
              <option value={10}>10 أسطر (الافتراضي)</option>
              <option value={20}>20 سطراً</option>
              <option value={30}>30 سطراً</option>
              <option value={50}>50 سطراً</option>
              <option value={100}>100 سطر</option>
              <option value={999999}>عرض كافة الأسطر</option>
            </select>
            <span className="text-[11px] text-slate-500 mr-1">
              (عرض {paginatedRows.length} من أصل {filteredRows.length} حساب)
            </span>
          </div>

          {/* أزرار التنقل بين الصفحات */}
          <div className="flex items-center gap-1.5">
            
            {/* الصفحة الأولى */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer shadow-2xs"
              title="الصفحة الأولى"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* الصفحة السابقة */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer shadow-2xs"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* رقم الصفحة الحالية */}
            <div className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-800 shadow-2xs">
              <span className="text-sky-700">{currentPage}</span>
              <span className="text-slate-400">/</span>
              <span>{totalPages}</span>
            </div>

            {/* الصفحة التالية */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer shadow-2xs"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* الصفحة الأخيرة */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer shadow-2xs"
              title="الصفحة الأخيرة"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
