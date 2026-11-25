import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FileText, 
  Search, 
  RotateCcw, 
  Printer, 
  Download, 
  CheckCircle2, 
  XCircle, 
  User, 
  Building2, 
  Calendar, 
  ArrowUpDown, 
  MapPin, 
  SlidersHorizontal,
  ChevronDown,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  FileDown,
  Loader2,
  MoreVertical,
  Copy,
  Check,
  Eye
} from 'lucide-react';
import { AccountItem, TransactionRecord, CurrencyCode } from '../../../types';
import { SearchableSelect } from '../../common/SearchableSelect';
import { exportElementToPdf } from '../../../utils/pdfExport';

interface WebAccountStatementScreenProps {
  accounts: AccountItem[];
  transactions: TransactionRecord[];
  onClose?: () => void;
  initialAccountId?: string;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyLogo?: string;
  systemUser?: string;
}

export const WebAccountStatementScreen: React.FC<WebAccountStatementScreenProps> = ({
  accounts,
  transactions,
  onClose,
  initialAccountId,
  companyName = '',
  companyPhone,
  companyAddress,
  companyLogo,
  systemUser,
}) => {
  // 1. Client Search & Selection (User selects ONE client)
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId || accounts[0]?.id || '');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    }
  }, [initialAccountId]);

  // 2. Filters
  const [selectedCurrency, setSelectedCurrency] = useState<string>('IQD'); // Default currency or 'all'
  const [anywhereChecked, setAnywhereChecked] = useState<boolean>(true);
  const [statementDate, setStatementDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Pagination State (افتراضي 10 أسطر مع خيارات 10, 25, 50, 100, 1000)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Formatting date for print header like Image 2: 2026/09/23 05:15:15 PM
  const printTimestamp = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${year}/${month}/${day} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
  }, [isPrintModalOpen]);
  const [selectedLedgerTxId, setSelectedLedgerTxId] = useState<string | null>(null);
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);
  const [activeVoucherTx, setActiveVoucherTx] = useState<TransactionRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      setOpenActionRowId(null);
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // دالة توحيد وتطبيع النصوص العربية للبحث الدقيق والشامل عن الحروف والكلمات أينما وجدت
  const normalizeForSearch = (str: string) => {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // إزالة التشكيل والتطويل
      .replace(/\s*\(.*?\)/g, ' ') // إزالة ما بين الأقواس مثل (عميل)، (وكيل)
      .replace(/[أإآء]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىيئ]/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  // 4. Reconciliation state per account & currency
  const [reconciledAccounts, setReconciledAccounts] = useState<Record<string, boolean>>({
    [`${accounts[0]?.id}_IQD`]: true,
    [`${accounts[0]?.id}_USD`]: true,
  });

  // Selected client object
  const currentAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId]);

  // العملاء المطابقون للبحث (يدعم البحث عن الحرف أو المقطع أينما وجد في الاسم)
  const matchingAccounts = useMemo(() => {
    const q = clientSearchQuery.trim();
    if (!q) return accounts;
    const normQ = normalizeForSearch(q);
    if (!normQ) return accounts;

    return accounts.filter(acc => {
      const normName = normalizeForSearch(acc.name);
      const normCity = normalizeForSearch(acc.city || '');
      const normNotes = normalizeForSearch(acc.notes || '');
      const rawPhone = acc.phone ? acc.phone.replace(/\D/g, '') : '';
      const qDigits = q.replace(/\D/g, '');

      if (anywhereChecked) {
        // خيار «أينما وجد»: مطابقة الحرف أو المقطع في أي موضع من الاسم (البداية، الوسط، النهاية)
        const nameMatch = normName.includes(normQ);
        const cityMatch = normCity.includes(normQ);
        const notesMatch = normNotes.includes(normQ);
        const phoneMatch = qDigits.length > 0 && rawPhone.includes(qDigits);
        return nameMatch || cityMatch || notesMatch || phoneMatch;
      } else {
        // إذا كان غير مفعل: يبدأ بالاسم أو تبدأ به إحدى كلمات الاسم
        const words = normName.split(' ');
        const nameMatch = normName.startsWith(normQ) || words.some(w => w.startsWith(normQ));
        const cityMatch = normCity.startsWith(normQ);
        const phoneMatch = qDigits.length > 0 && rawPhone.startsWith(qDigits);
        return nameMatch || cityMatch || phoneMatch;
      }
    });
  }, [accounts, clientSearchQuery, anywhereChecked]);

  // Currency helper in pure Arabic text without symbols
  const getCurrencyArabic = (curr: string) => {
    switch (curr) {
      case 'IQD': return 'دينار عراقي';
      case 'USD': return 'دولار أمريكي';
      case 'EUR': return 'يورو';
      case 'TRY': return 'ليرة تركية';
      case 'AED': return 'درهم إماراتي';
      case 'all': return 'جميع العملات';
      default: return curr;
    }
  };

  // Format amount cleanly without trailing zeroes (.00)
  const formatNum = (amount: number) => {
    if (amount === 0) return '-';
    return Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Helper to normalize strings for robust Arabic text matching
  const normalizeArabic = (str: string) => {
    if (!str) return '';
    return str
      .replace(/\s*\(.*?\)/g, '') // remove parentheses and their contents like (عميل), (وكيل), etc.
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, ' ')
      .trim()
      .toLowerCase();
  };

  // Helper to determine if a transaction involves an account and calculate its debit/credit impact
  const getTransactionImpact = (
    t: TransactionRecord,
    account: AccountItem,
    anywhere: boolean
  ): { matches: boolean; debit: number; credit: number; activityType: string } => {
    // 1. قاعدة محاسبية صارمة: الخزنة لا يسجل عليها أي حركة قبض أو صرف نقدية للزبائن إطلاقاً
    if (account.type === 'vault') {
      if (t.type === 'cash_in' || t.type === 'cash_out') {
        return { matches: false, debit: 0, credit: 0, activityType: '' };
      }
    }

    const accNorm = normalizeArabic(account.name);
    const accPhone = account.phone ? account.phone.trim() : '';

    // التحقق مما إذا كان الحساب يمثل صندوقاً نقدياً
    const isBoxAccount = 
      account.type === 'cash_box' || 
      accNorm.includes('صندوق') || 
      accNorm.includes('كاش') || 
      account.name.toLowerCase().includes('cash');

    // Direct account ID match or direct account name match
    const isDirectAccount = t.accountId === account.id || (t.accountName && normalizeArabic(t.accountName) === accNorm);

    // Sender match
    const isSender = (t.senderName && (normalizeArabic(t.senderName).includes(accNorm) || accNorm.includes(normalizeArabic(t.senderName)))) ||
                     (accPhone && t.senderPhone && t.senderPhone.trim() === accPhone);

    // Receiver match
    const isReceiver = (t.receiverName && (normalizeArabic(t.receiverName).includes(accNorm) || accNorm.includes(normalizeArabic(t.receiverName)))) ||
                       (accPhone && t.receiverPhone && t.receiverPhone.trim() === accPhone);

    // Agent match
    const isAgent = t.agentName && (normalizeArabic(t.agentName).includes(accNorm) || accNorm.includes(normalizeArabic(t.agentName)));

    // التحقق من مطابقة الصندوق النقدي
    const isCashBoxMatch = isBoxAccount && (
      (t.cashBoxId && t.cashBoxId === account.id) ||
      (t.cashBoxName && (normalizeArabic(t.cashBoxName).includes(accNorm) || accNorm.includes(normalizeArabic(t.cashBoxName)))) ||
      (isDirectAccount) ||
      (isReceiver && t.type === 'cash_in') ||
      (isSender && t.type === 'cash_out') ||
      (!t.cashBoxId && !t.cashBoxName) // إذا لم يكن محدداً صندوق بعينه يربط بالصندوق النقدي
    );

    // =========================================================================
    // 2. معالجة حركة حساب الصندوق النقدي (Cash Box):
    // القاعدة المحاسبية الذهبية:
    // عند القبض (إيداع نقدية في الصندوق): الصندوق مدين (Debit) 100%!
    // عند الصرف (خروج نقدية من الصندوق): الصندوق دائن (Credit) 100%!
    // =========================================================================
    if (isBoxAccount) {
      if (t.type === 'cash_in') {
        if (!isCashBoxMatch) return { matches: false, debit: 0, credit: 0, activityType: '' };
        return {
          matches: true,
          debit: t.amount,
          credit: 0,
          activityType: 'سند قبض نقدي (وارد للصندوق)',
        };
      }
      if (t.type === 'cash_out') {
        if (!isCashBoxMatch) return { matches: false, debit: 0, credit: 0, activityType: '' };
        return {
          matches: true,
          debit: 0,
          credit: t.amount,
          activityType: 'سند صرف نقدي (صادر من الصندوق)',
        };
      }
    }

    const matches = isDirectAccount || (anywhere && (isSender || isReceiver || isAgent));

    if (!matches) {
      return { matches: false, debit: 0, credit: 0, activityType: '' };
    }

    let debit = 0;
    let credit = 0;
    let activityType = 'قيد حركة';

    if (t.type === 'journal') {
      // قيد مزدوج:
      // الطرف المدين (منه / عليه): receiverName أو accountId
      // الطرف الدائن (له / إليه): senderName
      if (isReceiver || (isDirectAccount && !isSender)) {
        debit = t.amount;
        activityType = 'قيد يومية (مدين)';
      } else if (isSender) {
        credit = t.amount;
        activityType = 'قيد يومية (دائن)';
      } else {
        debit = t.amount;
        activityType = 'قيد يومية';
      }
    } else if (t.type === 'cash_in') {
      // سند قبض نقدي للعميل: العميل دفع وسدد -> العميل دائن (Credit / له)
      credit = t.amount;
      activityType = 'سند قبض نقدي (له)';
    } else if (t.type === 'cash_out') {
      // سند صرف نقدي للعميل: العميل استلم نقدية -> العميل مدين (Debit / عليه)
      debit = t.amount;
      activityType = 'سند صرف نقدي (عليه)';
    } else if (t.type === 'transfer_outgoing') {
      // حوالة صادرة
      if (isSender || isDirectAccount) {
        // العميل هو من أرسل الحوالة (مدين بقيمتها / عليه)
        debit = t.settlementAmount || t.amount;
        activityType = 'حوالة صادرة';
      } else if (isReceiver) {
        // العميل هو المستفيد من الحوالة (دائن / له)
        credit = t.targetAmount || t.amount;
        activityType = 'حوالة صادرة (مستفيد)';
      } else {
        debit = t.amount;
        activityType = 'حوالة صادرة';
      }
    } else if (t.type === 'transfer_incoming') {
      // حوالة واردة
      if (isReceiver) {
        // العميل هو المستفيد من الحوالة الواردة (دائن / له)
        credit = t.amount;
        activityType = 'حوالة واردة';
      } else if (isSender || isAgent) {
        // العميل أو الوكيل سلم الحوالة أو قيدت عليه
        debit = t.amount;
        activityType = 'تسليم حوالة واردة';
      } else {
        credit = t.amount;
        activityType = 'حوالة واردة';
      }
    } else if (t.type === 'exchange') {
      debit = t.amount;
      activityType = 'حركة مصارفة';
    } else {
      if (isReceiver) {
        credit = t.amount;
        activityType = 'حركة قيد عام (دائن)';
      } else {
        debit = t.amount;
        activityType = 'حركة قيد عام (مدين)';
      }
    }

    return { matches: true, debit, credit, activityType };
  };

  // Build financial movements (Ledger) for the chosen client with accurate running totals (شامل الرصيد المدور أو السابق)
  const accountLedger = useMemo(() => {
    if (!currentAccount) return [];

    // 1. Find all matching transactions in the system for this account and currency
    const allMatching = transactions
      .map(t => {
        if (selectedCurrency !== 'all' && t.currency !== selectedCurrency) {
          return null;
        }
        const impact = getTransactionImpact(t, currentAccount, anywhereChecked);
        if (!impact.matches) return null;
        return { tx: t, ...impact };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Sort chronologically ascending
    allMatching.sort((a, b) => new Date(a.tx.createdAt).getTime() - new Date(b.tx.createdAt).getTime());

    const isBoxAccount = 
      currentAccount.type === 'cash_box' || 
      normalizeArabic(currentAccount.name).includes('صندوق') || 
      normalizeArabic(currentAccount.name).includes('كاش') || 
      currentAccount.name.toLowerCase().includes('cash');

    // 2. الحساب الأساسي للرصيد المسجل في النظام لمعرفة الرصيد الافتتاحي قبل الحركات:
    // بالنسبة لحساب العميل: الرصيد الموجب = دائن (له)، الرصيد السالب = مدين (عليه)
    // بالنسبة للصندوق: الرصيد الموجب = مدين (وارد الصندوق)
    let targetAccountBalance = 0;
    if (selectedCurrency === 'IQD') targetAccountBalance = Number(currentAccount.balanceIQD) || 0;
    else if (selectedCurrency === 'USD') targetAccountBalance = Number(currentAccount.balanceUSD) || 0;
    else targetAccountBalance = (Number(currentAccount.balanceIQD) || 0) + (Number(currentAccount.balanceUSD) || 0);

    const totalAllMatchingNet = allMatching.reduce((acc, item) => {
      return isBoxAccount
        ? acc + (item.debit - item.credit)
        : acc + (item.credit - item.debit);
    }, 0);

    // الرصيد الأساسي للحساب قبل أي حركات مسجلة في النظام:
    const openingBaseline = targetAccountBalance - totalAllMatchingNet;

    // 3. فرز الحركات إلى حركات سابقة (قبل تاريخ من dateFrom) وحركات الفترة الحالية
    let priorTransactions: typeof allMatching = [];
    let periodTransactions = allMatching;

    if (dateFrom) {
      priorTransactions = allMatching.filter(item => item.tx.createdAt && item.tx.createdAt.slice(0, 10) < dateFrom);
      periodTransactions = allMatching.filter(item => !item.tx.createdAt || item.tx.createdAt.slice(0, 10) >= dateFrom);
    }

    if (dateTo) {
      periodTransactions = periodTransactions.filter(item => !item.tx.createdAt || item.tx.createdAt.slice(0, 10) <= dateTo);
    }

    // مجموع صافي الحركات السابقة لتاريخ البداية:
    const priorTxsNet = priorTransactions.reduce((acc, item) => {
      return isBoxAccount
        ? acc + (item.debit - item.credit)
        : acc + (item.credit - item.debit);
    }, 0);

    // إجمالي الرصيد المدور أو السابق حتى تاريخ بداية الكشف:
    const carriedForwardBalance = openingBaseline + priorTxsNet;

    const isCarriedCredit = isBoxAccount ? carriedForwardBalance < 0 : carriedForwardBalance > 0;
    const isCarriedDebit = isBoxAccount ? carriedForwardBalance > 0 : carriedForwardBalance < 0;
    const absCarried = Math.abs(carriedForwardBalance);

    // تاريخ سطر الرصيد المدور: تاريخ البداية إن وُجد، أو تاريخ أول حركة، أو تاريخ اليوم
    const carriedDate = dateFrom 
      ? dateFrom 
      : (allMatching[0]?.tx.createdAt ? allMatching[0].tx.createdAt.slice(0, 10) : statementDate);

    // سطر الرصيد المدور / السابق
    const carriedForwardRow = {
      id: 'carried_forward_balance_row',
      isCarriedForward: true,
      date: carriedDate,
      debit: isCarriedDebit ? absCarried : 0,
      credit: isCarriedCredit ? absCarried : 0,
      balanceDebit: isCarriedDebit ? absCarried : 0,
      balanceCredit: isCarriedCredit ? absCarried : 0,
      activityType: 'رصيد سابق (مدور)',
      details: dateFrom 
        ? `الرصيد المدور من الفترة السابقة حتى تاريخ ${dateFrom}`
        : 'الرصيد الافتتاحي والمدور لحساب العميل',
    };

    // 4. بناء الأسطر التراكمية لحركات الفترة انطلاقاً من الرصيد المدور:
    let runningBalance = carriedForwardBalance;

    const rows: {
      id: string;
      isCarriedForward?: boolean;
      date: string;
      debit: number;
      credit: number;
      balanceDebit: number;
      balanceCredit: number;
      activityType: string;
      details: string;
      rawTx?: TransactionRecord;
    }[] = [carriedForwardRow];

    // إضافة حركات الفترة
    for (const item of periodTransactions) {
      const { tx, debit, credit, activityType } = item;

      if (isBoxAccount) {
        runningBalance += (debit - credit);
        rows.push({
          id: tx.id,
          isCarriedForward: false,
          date: tx.createdAt ? tx.createdAt.slice(0, 10) : statementDate,
          debit,
          credit,
          balanceDebit: runningBalance > 0 ? runningBalance : 0,
          balanceCredit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
          activityType,
          details: tx.notes || (tx.code ? `حوالة رقم ${tx.code} - ${tx.receiverName}` : 'حركة محاسبية جارية'),
          rawTx: tx,
        });
      } else {
        runningBalance += (credit - debit);
        rows.push({
          id: tx.id,
          isCarriedForward: false,
          date: tx.createdAt ? tx.createdAt.slice(0, 10) : statementDate,
          debit,
          credit,
          balanceDebit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
          balanceCredit: runningBalance > 0 ? runningBalance : 0,
          activityType,
          details: tx.notes || (tx.code ? `حوالة رقم ${tx.code} - ${tx.receiverName}` : 'حركة محاسبية جارية'),
          rawTx: tx,
        });
      }
    }

    return rows;
  }, [currentAccount, transactions, selectedCurrency, anywhereChecked, dateFrom, dateTo, statementDate]);

  // Reset page to 1 on filter or pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedAccountId,
    selectedCurrency,
    anywhereChecked,
    statementDate,
    dateFrom,
    dateTo,
    pageSize,
  ]);

  // Total pages and valid current page
  const totalPages = Math.max(1, Math.ceil(accountLedger.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  // Paginated records for statement view
  const paginatedLedger = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return accountLedger.slice(start, start + pageSize);
  }, [accountLedger, validCurrentPage, pageSize]);

  const startIndex = accountLedger.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, accountLedger.length);

  // Complete statement summary calculation: perfectly synchronized with the ledger
  const statementSummary = useMemo(() => {
    if (!currentAccount) {
      return {
        carriedForwardCredit: 0,
        carriedForwardDebit: 0,
        carriedForwardNet: 0,
        finalBalance: 0,
        finalBalanceCredit: 0,
        finalBalanceDebit: 0,
        totalPeriodCredits: 0,
        totalPeriodDebits: 0,
      };
    }

    const isBoxAccount = 
      currentAccount.type === 'cash_box' || 
      normalizeArabic(currentAccount.name).includes('صندوق') || 
      normalizeArabic(currentAccount.name).includes('كاش') || 
      currentAccount.name.toLowerCase().includes('cash');

    const carriedRow = accountLedger.find(r => r.isCarriedForward);
    const carriedForwardCredit = carriedRow?.credit || 0;
    const carriedForwardDebit = carriedRow?.debit || 0;
    const carriedForwardNet = isBoxAccount
      ? (carriedForwardDebit - carriedForwardCredit)
      : (carriedForwardCredit - carriedForwardDebit);

    // الحركات الجارية داخل الفترة فقط (بدون سطر الرصيد المدور)
    const periodRows = accountLedger.filter(r => !r.isCarriedForward);
    const totalCredits = periodRows.reduce((sum, r) => sum + r.credit, 0);
    const totalDebits = periodRows.reduce((sum, r) => sum + r.debit, 0);

    const lastRow = accountLedger[accountLedger.length - 1] || carriedRow;

    const finalBalanceCredit = lastRow ? lastRow.balanceCredit : (carriedForwardCredit);
    const finalBalanceDebit = lastRow ? lastRow.balanceDebit : (carriedForwardDebit);
    const finalBalance = isBoxAccount
      ? (finalBalanceDebit > 0 ? finalBalanceDebit : -finalBalanceCredit)
      : (finalBalanceCredit > 0 ? finalBalanceCredit : -finalBalanceDebit);

    return {
      carriedForwardCredit,
      carriedForwardDebit,
      carriedForwardNet,
      finalBalance,
      finalBalanceCredit,
      finalBalanceDebit,
      totalPeriodCredits: totalCredits,
      totalPeriodDebits: totalDebits,
    };
  }, [currentAccount, accountLedger]);

  // Reconciliation status for currently selected client & currency
  const isCurrentReconciled = useMemo(() => {
    if (!currentAccount) return false;
    const key = `${currentAccount.id}_${selectedCurrency}`;
    return !!reconciledAccounts[key];
  }, [currentAccount, selectedCurrency, reconciledAccounts]);

  const toggleReconciliation = () => {
    if (!currentAccount) return;
    const key = `${currentAccount.id}_${selectedCurrency}`;
    setReconciledAccounts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };


  // Reset all filters
  const handleResetFilters = () => {
    setClientSearchQuery('');
    setSelectedCurrency('IQD');
    setAnywhereChecked(true);
    setDateFrom('');
    setDateTo('');
  };

  // دعم التنقل بين أسطر كشف الحساب بالأسهم لأعلى وأسفل عبر لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // تجنب مقاطعة الكتابة داخل الحقول النصية ومربعات الإدخال
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!paginatedLedger || paginatedLedger.length === 0) return;
        e.preventDefault();

        const currentIndex = paginatedLedger.findIndex(row => row.id === selectedLedgerTxId);

        if (e.key === 'ArrowDown') {
          if (currentIndex === -1) {
            setSelectedLedgerTxId(paginatedLedger[0].id);
          } else if (currentIndex < paginatedLedger.length - 1) {
            setSelectedLedgerTxId(paginatedLedger[currentIndex + 1].id);
          }
        } else if (e.key === 'ArrowUp') {
          if (currentIndex === -1) {
            setSelectedLedgerTxId(paginatedLedger[paginatedLedger.length - 1].id);
          } else if (currentIndex > 0) {
            setSelectedLedgerTxId(paginatedLedger[currentIndex - 1].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedLedger, selectedLedgerTxId]);

  // Export PDF
  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      // Ensure the printable sheet is rendered
      let printEl = document.getElementById('printable-account-statement-sheet');
      if (!printEl) {
        setIsPrintModalOpen(true);
        // Wait for DOM to render printable sheet
        await new Promise(r => setTimeout(r, 200));
        printEl = document.getElementById('printable-account-statement-sheet');
      }

      if (printEl) {
        const clientName = currentAccount?.name ? currentAccount.name.replace(/[/\\?%*:|"<>]/g, '_') : 'العميل';
        const dateStr = new Date().toISOString().slice(0, 10);
        await exportElementToPdf(printEl, {
          filename: `كشف_حساب_${clientName}_${dateStr}.pdf`,
          orientation: 'landscape',
          marginMm: 6,
        });
      } else {
        window.print();
      }
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export CSV
  const handleExportCSV = (type: 'detailed' | 'summary') => {
    if (type === 'detailed') {
      const rows = [
        ['تاريخ الحركة', 'مبلغ الحركة دائن', 'مبلغ الحركة مدين', 'نوع الحركة', 'تفاصيل الحركة', 'الرصيد دائن', 'الرصيد مدين'],
        ...accountLedger.map(item => [
          item.date,
          item.credit.toString(),
          item.debit.toString(),
          item.activityType,
          `"${item.details}"`,
          item.balanceCredit.toString(),
          item.balanceDebit.toString()
        ])
      ];
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `كشف_حساب_${currentAccount?.name || 'تفصيلي'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const rows = [
        ['اسم العميل', 'الرصيد المدور دائن', 'الرصيد المدور مدين', 'الرصيد النهائي مدين', 'الرصيد النهائي دائن', 'العملة', 'المطابقة', 'العنوان'],
        [
          currentAccount?.name || '',
          statementSummary.carriedForwardCredit.toString(),
          statementSummary.carriedForwardDebit.toString(),
          statementSummary.finalBalanceDebit.toString(),
          statementSummary.finalBalanceCredit.toString(),
          getCurrencyArabic(selectedCurrency),
          isCurrentReconciled ? 'مطابق' : 'غير مطابق',
          currentAccount?.city || 'العراق'
        ]
      ];
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ملخص_حساب_${currentAccount?.name || 'عميل'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-3 sm:p-5 w-full max-w-full mx-auto text-slate-800 space-y-3" dir="rtl">
      
      {/* 1. TOP HEADER (مطابق للصورة تماماً) */}
      <div className="bg-[#0284c7] text-white px-5 py-3.5 rounded-t-2xl flex items-center justify-between shadow-sm shrink-0">
        {/* Left: Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Right: Title, subtitle and document icon */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
              كشف حساب العملاء
            </h1>
            <p className="text-[11px] text-sky-100/90 font-medium">
              كشف تفصيلي لحركات الحساب
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/30 flex items-center justify-center text-white shadow-inner">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. FILTER STRIP (شريط الفلاتر الأفقي النظيف مطابق للصورة) */}
      <div className="bg-white border-x border-b border-slate-200/90 shadow-2xs px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 text-xs">
          
          {/* العميل مع البحث المباشر وخيار «أينما وجد» */}
          <div className="flex items-center gap-2 flex-1 min-w-[340px] max-w-xl relative" ref={clientDropdownRef}>
            <span className="font-bold text-slate-700 text-xs whitespace-nowrap">العميل:</span>
            
            <div className="relative flex-1">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={isClientDropdownOpen ? clientSearchQuery : (currentAccount?.name || '')}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    if (!isClientDropdownOpen) setIsClientDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setClientSearchQuery('');
                    setIsClientDropdownOpen(true);
                  }}
                  placeholder="ابحث بالاسم أو أي حرف أو هاتف..."
                  className="w-full px-3 py-1.5 pl-14 bg-white border border-slate-300 hover:border-sky-500 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none shadow-2xs transition-colors"
                />

                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {clientSearchQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientSearchQuery('');
                      }}
                      className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] cursor-pointer"
                      title="مسح البحث"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isClientDropdownOpen) {
                        setIsClientDropdownOpen(false);
                      } else {
                        setClientSearchQuery('');
                        setIsClientDropdownOpen(true);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer"
                    title="فتح القائمة"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isClientDropdownOpen ? 'rotate-180 text-sky-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* القائمة المنسدلة للعملاء المطابقين مع توضيح مطابقة الحرف أينما وجد */}
              {isClientDropdownOpen && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
                    <span>النتائج المطابقة ({matchingAccounts.length})</span>
                    {anywhereChecked ? (
                      <span className="text-sky-700 font-bold text-[10px] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        مطابقة الحرف أينما وجد بالاسم
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">مطابقة بداية الاسم فقط</span>
                    )}
                  </div>
                  {matchingAccounts.map((acc) => {
                    const isSelected = acc.id === currentAccount?.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setClientSearchQuery('');
                          setIsClientDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-[#0284c7] text-white font-bold' : 'hover:bg-sky-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-sky-600'}`} />
                          <div className="truncate">
                            <span className="font-bold">{acc.name}</span>
                            {acc.phone && (
                              <span className={`text-[10px] mr-2 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                                ({acc.phone})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-left">
                          <span className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                            {acc.city || 'الفرع الرئيسي'}
                          </span>
                          {acc.balanceIQD !== undefined && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : acc.balanceIQD >= 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                            }`}>
                              {Math.abs(acc.balanceIQD).toLocaleString('en-US')} {acc.balanceIQD >= 0 ? 'له' : 'عليه'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {matchingAccounts.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs font-bold">
                      لا يوجد عميل مطابق للبحث
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* خيار: أينما وجد (مخصص لاسم العميل مباشرة) */}
            <label 
              className="flex items-center gap-1.5 cursor-pointer select-none px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100/90 border border-sky-200 text-sky-900 rounded-xl transition-all shadow-2xs shrink-0" 
              title="البحث عن الحرف أو المقطع في أي مكان ضمن اسم العميل"
            >
              <input
                type="checkbox"
                checked={anywhereChecked}
                onChange={(e) => setAnywhereChecked(e.target.checked)}
                className="w-4 h-4 rounded border-sky-300 text-[#0284c7] focus:ring-sky-500 cursor-pointer accent-[#0284c7]"
              />
              <span className="font-bold text-xs whitespace-nowrap">أينما وجد</span>
            </label>
          </div>

          {/* العملة */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <span className="font-bold text-slate-700 text-xs whitespace-nowrap">العملة:</span>
            <SearchableSelect
              value={selectedCurrency}
              onChange={(val) => setSelectedCurrency(val)}
              options={[
                { value: 'IQD', label: 'دينار عراقي' },
                { value: 'USD', label: 'دولار أمريكي' },
                { value: 'EUR', label: 'يورو' },
                { value: 'TRY', label: 'ليرة تركية' },
                { value: 'AED', label: 'درهم إماراتي' },
                { value: 'all', label: 'جميع العملات' },
              ]}
              triggerClassName="py-1.5 min-w-[125px] rounded-xl font-bold"
              searchPlaceholder="بحث في العملات..."
            />
          </div>

          {/* من تاريخ */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 text-xs whitespace-nowrap">من تاريخ:</span>
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="mm / dd / yyyy"
                className="w-36 px-2.5 py-1.5 bg-white border border-slate-300 focus:border-sky-500 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* إلى تاريخ */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 text-xs whitespace-nowrap">إلى تاريخ:</span>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="mm / dd / yyyy"
                className="w-36 px-2.5 py-1.5 bg-white border border-slate-300 focus:border-sky-500 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

        </div>
      </div>

      {/* 3. SUMMARY & ACTIONS PANEL (مطابق للصورة 100% مع إضافة الرصيد المدور/السابق) */}
      <div className="bg-white border-x border-b border-slate-200/90 shadow-2xs p-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Right side: 5 Stat Segments with Vertical Dividers */}
        <div className="flex flex-wrap items-center divide-x divide-x-reverse divide-slate-200 text-center gap-y-2">
          
          {/* 1. المدينة / الفرع */}
          <div className="px-4 first:pr-0">
            <span className="text-xs text-slate-500 font-semibold block mb-0.5">المدينة / الفرع</span>
            <span className="text-sm sm:text-base font-black text-slate-900 block">
              {currentAccount?.city || 'النجف الأشرف'}
            </span>
          </div>

          {/* 2. العملة */}
          <div className="px-4">
            <span className="text-xs text-slate-500 font-semibold block mb-0.5">العملة</span>
            <span className="inline-block px-3 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-[#0284c7] font-black text-xs">
              {getCurrencyArabic(selectedCurrency)}
            </span>
          </div>

          {/* 3. الرصيد المدور (السابق) */}
          <div className="px-4 bg-amber-50/70 py-1 rounded-xl border border-amber-200/60 shadow-2xs">
            <span className="text-[11px] text-amber-800 font-black block mb-0.5">الرصيد المدور (السابق)</span>
            <span className={`text-base sm:text-lg font-black font-mono block ${
              statementSummary.carriedForwardCredit > 0
                ? 'text-emerald-700'
                : statementSummary.carriedForwardDebit > 0
                ? 'text-rose-700'
                : 'text-slate-500'
            }`}>
              {statementSummary.carriedForwardCredit > 0
                ? `${formatNum(statementSummary.carriedForwardCredit)} له 🟢`
                : statementSummary.carriedForwardDebit > 0
                ? `${formatNum(statementSummary.carriedForwardDebit)} عليه 🔴`
                : '0.00'}
            </span>
          </div>

          {/* 4. الرصيد الدائن الختامي (أخضر دائماً) */}
          <div className="px-4">
            <span className="text-xs text-slate-500 font-semibold block mb-0.5">الرصيد الدائن (له)</span>
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 block">
              {statementSummary.finalBalanceCredit > 0 ? formatNum(statementSummary.finalBalanceCredit) : '-'}
            </span>
          </div>

          {/* 5. الرصيد المدين الختامي (أحمر دائماً) */}
          <div className="px-4">
            <span className="text-xs text-slate-500 font-semibold block mb-0.5">الرصيد المدين (عليه)</span>
            <span className="text-lg sm:text-xl font-black font-mono text-rose-600 block">
              {statementSummary.finalBalanceDebit > 0 ? formatNum(statementSummary.finalBalanceDebit) : '-'}
            </span>
          </div>

        </div>

        {/* Left side: Action Buttons matching the screenshot exactly */}
        <div className="flex items-center gap-2.5">
          {/* بحث */}
          <button
            onClick={() => {
              setStatementDate(new Date().toISOString().slice(0, 10));
            }}
            className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="بحث وتحديث الكشف"
          >
            <Search className="w-4 h-4" />
            <span>بحث</span>
          </button>

          {/* طباعة */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="معاينة وطباعة الكشف بالعرض A4 Landscape"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>طباعة</span>
          </button>

          {/* تصدير PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="px-4 py-2 bg-[#e11d48] hover:bg-[#be123c] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="تصدير كشف الحساب إلى ملف PDF (A4 بالعرض)"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileDown className="w-4 h-4 text-white" />
            )}
            <span>تصدير PDF</span>
          </button>

          {/* Excel/CSV تصدير */}
          <button
            onClick={() => handleExportCSV('detailed')}
            className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="تصدير ملف Excel / CSV"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Excel/CSV تصدير</span>
          </button>
        </div>

      </div>

      {/* 4. MOVEMENTS TABLE (مطابق للجدول في الصورة) */}
      <div className="bg-white border-x border-b border-slate-200/90 rounded-b-2xl shadow-2xs overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200 select-none">
                {/* # */}
                <th className="py-3 px-3 text-center border-l border-slate-200 w-12 font-bold text-slate-700">
                  #
                </th>
                {/* تاريخ الحركة */}
                <th className="py-3 px-3 text-center border-l border-slate-200 w-28 font-bold text-slate-700">
                  تاريخ الحركة
                </th>
                {/* مبلغ الحركة دائن (أخضر دائماً) */}
                <th className="py-3 px-3 text-center border-l border-slate-200 w-32 font-bold text-emerald-600">
                  مبلغ الحركة دائن
                </th>
                {/* مبلغ الحركة مدين (أحمر دائماً) */}
                <th className="py-3 px-3 text-center border-l border-slate-200 w-32 font-bold text-rose-600">
                  مبلغ الحركة مدين
                </th>
                {/* نوع الحركة */}
                <th className="py-3 px-3 text-center border-l border-slate-200 w-44 font-bold text-slate-700">
                  نوع الحركة
                </th>
                {/* تفاصيل الحركة */}
                <th className="py-3 px-4 text-right border-l border-slate-200 font-bold text-slate-700">
                  تفاصيل الحركة
                </th>
                {/* الرصيد دائن (أخضر دائماً) */}
                <th className="py-3 px-3 text-center border-l border-slate-200 w-32 font-bold text-emerald-600">
                  الرصيد دائن
                </th>
                {/* الرصيد مدين (أحمر دائماً) */}
                <th className="py-3 px-3 text-center border-l border-slate-200 w-32 font-bold text-rose-600">
                  الرصيد مدين
                </th>
                {/* العمليات */}
                <th className="py-3 px-3 text-center w-16 font-bold text-slate-700">
                  العمليات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedLedger.length > 0 ? (
                paginatedLedger.map((row, idx) => {
                  const isCarried = !!row.isCarriedForward;
                  const isSelected = row.id === selectedLedgerTxId;
                  const isMenuOpen = openActionRowId === row.id;

                  // حساب رقم التسلسل (سطر المدور لا يأخذ رقماً عادياً، بل علامة مدور)
                  let seqDisplay: React.ReactNode = (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900 shadow-2xs">
                      مدور
                    </span>
                  );
                  if (!isCarried) {
                    const nonCarriedList = accountLedger.filter(r => !r.isCarriedForward);
                    const realIndex = nonCarriedList.findIndex(r => r.id === row.id);
                    seqDisplay = realIndex !== -1 ? realIndex + 1 : idx + 1;
                  }

                  if (isCarried) {
                    return (
                      <tr
                        key={row.id}
                        className="bg-amber-50/80 hover:bg-amber-100/70 font-semibold border-b border-amber-200 transition-colors select-none"
                      >
                        {/* # */}
                        <td className="py-2.5 px-3 text-center border-l border-amber-200 font-mono text-xs">
                          {seqDisplay}
                        </td>

                        {/* تاريخ الحركة */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-950 border-l border-amber-200 text-[11px] whitespace-nowrap">
                          {row.date}
                        </td>

                        {/* مبلغ الحركة دائن */}
                        <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-700 border-l border-amber-200 whitespace-nowrap">
                          {row.credit > 0 ? formatNum(row.credit) : '-'}
                        </td>

                        {/* مبلغ الحركة مدين */}
                        <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700 border-l border-amber-200 whitespace-nowrap">
                          {row.debit > 0 ? formatNum(row.debit) : '-'}
                        </td>

                        {/* نوع الحركة */}
                        <td className="py-2.5 px-3 text-center border-l border-amber-200 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-200/90 text-amber-900 border border-amber-400 shadow-2xs">
                            <span>⭐ رصيد مدور (سابق)</span>
                          </span>
                        </td>

                        {/* تفاصيل الحركة */}
                        <td className="py-2.5 px-4 text-right text-amber-950 font-bold border-l border-amber-200">
                          {row.details}
                        </td>

                        {/* الرصيد دائن */}
                        <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-700 border-l border-amber-200 whitespace-nowrap">
                          {row.balanceCredit > 0 ? formatNum(row.balanceCredit) : '-'}
                        </td>

                        {/* الرصيد مدين */}
                        <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700 border-l border-amber-200 whitespace-nowrap">
                          {row.balanceDebit > 0 ? formatNum(row.balanceDebit) : '-'}
                        </td>

                        {/* العمليات */}
                        <td className="py-2.5 px-3 text-center text-slate-400 text-xs">
                          —
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedLedgerTxId(row.id)}
                      className={`hover:bg-sky-50/40 transition-colors ${
                        isSelected ? 'bg-sky-50/70 font-semibold' : ''
                      }`}
                    >
                      {/* # */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500 border-l border-slate-100 text-[11px]">
                        {seqDisplay}
                      </td>

                      {/* تاريخ الحركة */}
                      <td className="py-3 px-3 text-center font-mono text-slate-600 border-l border-slate-100 text-[11px] whitespace-nowrap">
                        {row.date}
                      </td>

                      {/* مبلغ الحركة دائن */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 border-l border-slate-100 whitespace-nowrap">
                        {row.credit > 0 ? formatNum(row.credit) : '-'}
                      </td>

                      {/* مبلغ الحركة مدين */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-600 border-l border-slate-100 whitespace-nowrap">
                        {row.debit > 0 ? formatNum(row.debit) : '-'}
                      </td>

                      {/* نوع الحركة */}
                      <td className="py-3 px-3 text-center border-l border-slate-100 whitespace-nowrap">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold ${
                          row.activityType.includes('له') || row.activityType.includes('قبض') || row.activityType.includes('واردة')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.activityType.includes('عليه') || row.activityType.includes('صرف')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {row.activityType}
                        </span>
                      </td>

                      {/* تفاصيل الحركة */}
                      <td className="py-3 px-4 text-right text-slate-800 font-medium border-l border-slate-100">
                        {row.details}
                      </td>

                      {/* الرصيد دائن */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 border-l border-slate-100 whitespace-nowrap">
                        {row.balanceCredit > 0 ? formatNum(row.balanceCredit) : '-'}
                      </td>

                      {/* الرصيد مدين */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-600 border-l border-slate-100 whitespace-nowrap">
                        {row.balanceDebit > 0 ? formatNum(row.balanceDebit) : '-'}
                      </td>

                      {/* العمليات (⋮) */}
                      <td className="py-3 px-3 text-center relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionRowId(isMenuOpen ? null : row.id);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center mx-auto transition-colors cursor-pointer"
                          title="قائمة العمليات"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Action Menu */}
                        {isMenuOpen && (
                          <div 
                            className="absolute left-3 top-8 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 min-w-[170px] text-right divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                if (row.rawTx) {
                                  setActiveVoucherTx(row.rawTx);
                                } else {
                                  // Find in transactions
                                  const found = transactions.find(t => t.id === row.id);
                                  if (found) setActiveVoucherTx(found);
                                }
                              }}
                              className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-600" />
                              <span>عرض تفاصيل السند</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const textToCopy = `${row.date} | ${row.activityType} | ${row.details} | دائن: ${row.credit} | مدين: ${row.debit}`;
                                navigator.clipboard.writeText(textToCopy);
                                setCopiedId(row.id);
                                setTimeout(() => setCopiedId(null), 1500);
                                setOpenActionRowId(null);
                              }}
                              className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              {copiedId === row.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">تم النسخ!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>نسخ تفاصيل الحركة</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                setIsPrintModalOpen(true);
                              }}
                              className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              <span>طباعة الكشف</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    لا توجد حركات مسجلة لهذا الحساب ضمن شروط البحث والعملة المحددة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* شريط ترقيم الحركات وتحديد عدد الأسطر (10، 25، 50، 100، 1000) */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-xs shrink-0 select-none">
          <div className="flex items-center gap-3 text-slate-600 font-medium">
            <span>
              إظهار <strong className="font-mono text-slate-900">{startIndex}</strong> إلى <strong className="font-mono text-slate-900">{endIndex}</strong> من أصل <strong className="font-mono text-slate-900">{accountLedger.length}</strong> حركة
            </span>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-600">الأسطر:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-[11px] font-bold text-[#0284c7] focus:outline-none cursor-pointer"
              >
                <option value={10}>10 أسطر</option>
                <option value={25}>25 سطر</option>
                <option value={50}>50 سطر</option>
                <option value={100}>100 سطر</option>
                <option value={1000}>1000 سطر</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 font-medium">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                validCurrentPage <= 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-200 cursor-pointer'
              }`}
            >
              السابق
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && (
                      <span className="px-1 text-slate-400 font-mono text-[10px]">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                        p === validCurrentPage
                          ? 'bg-[#0284c7] text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                validCurrentPage >= totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-200 cursor-pointer'
              }`}
            >
              التالي
            </button>
          </div>
        </div>

      </div>

      {/* نافذة عرض تفاصيل السند / الحركة عند النقر من قائمة العمليات */}
      {activeVoucherTx && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActiveVoucherTx(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0284c7] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-sm">تفاصيل سند الحركة المالية</h3>
              </div>
              <button
                onClick={() => setActiveVoucherTx(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">رقم الحركة / الكود:</span>
                  <span className="font-mono font-bold text-slate-800">{activeVoucherTx.code || activeVoucherTx.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">التاريخ:</span>
                  <span className="font-mono font-bold text-slate-800">{activeVoucherTx.createdAt?.slice(0, 10) || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">نوع الحركة:</span>
                  <span className="font-bold text-slate-800">{activeVoucherTx.type || 'حركة مالية'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">المبلغ والعملة:</span>
                  <span className="font-mono font-black text-sm text-emerald-600">
                    {formatNum(activeVoucherTx.amount)} {getCurrencyArabic(activeVoucherTx.currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">المرسل / الحساب الدافع:</span>
                  <span className="text-slate-800 font-bold block">{activeVoucherTx.senderName || activeVoucherTx.accountName || '—'}</span>
                </div>
                {activeVoucherTx.receiverName && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">المستلم / الوجهة:</span>
                    <span className="text-slate-800 font-bold block">{activeVoucherTx.receiverName}</span>
                  </div>
                )}
                {activeVoucherTx.notes && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">البيان والملاحظات:</span>
                    <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                      {activeVoucherTx.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveVoucherTx(null);
                    setIsPrintModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة في كشف الحساب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVoucherTx(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          نافذة معاينة وطباعة كشف الحساب (مطابقة لصورة الكشف القديمة 100%)
          ========================================================================= */}
      {isPrintModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsPrintModalOpen(false)}
        >
          {/* شريط أدوات التحكم بالطباعة العلوي */}
          <div 
            className="w-full max-w-6xl mx-auto bg-slate-900 text-white rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl mb-4 shrink-0 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <Printer className="w-5 h-5 text-sky-400" />
              <div>
                <span className="font-bold text-sm">معاينة طباعة كشف الحساب (A4 بالعرض)</span>
                <span className="text-xs text-slate-400 block">
                  كشف تفصيلي لحساب: <strong className="text-white">{currentAccount?.name || 'العميل'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExportingPdf}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                title="تنزيل كشف الحساب كملف PDF عالي الدقة (A4 بالعرض)"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>{isExportingPdf ? 'جارٍ تصدير PDF...' : 'تنزيل كـ PDF (بالعرض)'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                title="طباعة الآن (Ctrl + P)"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة المستند الآن</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="إغلاق المعاينة (ESC)"
              >
                <span>إغلاق (ESC)</span>
              </button>
            </div>
          </div>

          {/* ورقة الطباعة المعروضة بالمعاينة (وتُطبع مباشرة بنقاء 100% بحجم A4 بالعرض) */}
          <div 
            className="w-full max-w-6xl mx-auto bg-white rounded-sm shadow-2xl p-6 sm:p-8 text-black border border-slate-300 font-sans my-auto shrink-0 select-text"
            onClick={(e) => e.stopPropagation()}
          >
            <div id="printable-account-statement-sheet" className="w-full bg-white text-black">
              {/* 1. ترويسة الكشف مثل صورة البرنامج القديمة تماماً */}
              <div className="w-full pb-4 border-b border-black text-black">
                {/* السطر الأول: الشركة يميناً، العنوان وسطاً مسطّراً، وقت وتاريخ الطباعة يساراً */}
                <div className="grid grid-cols-3 items-start text-xs">
                  {/* يمين: الشركة */}
                  <div className="text-right font-bold space-y-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-black text-black">: الشـركـة</span>
                      <span className="font-bold text-slate-900">{companyName || 'اسم الشركة'}</span>
                    </div>
                  </div>

                  {/* وسط: العنوان الرئيسي المسطر */}
                  <div className="text-center">
                    <h1 className="text-lg font-black underline tracking-widest text-black underline-offset-4">
                      {currentAccount && (currentAccount.type === 'cash_box' || currentAccount.name.includes('صندوق'))
                        ? 'كـشـف تـفـصـيـلـي لـحـسـاب صـنـدوق'
                        : 'كـشـف تـفـصـيـلـي لـحـسـاب عـمـيـل'}
                    </h1>
                  </div>

                  {/* يسار: وقت وتاريخ الطباعة */}
                  <div className="text-left text-[11px] font-mono font-bold text-black" dir="ltr">
                    <span>وقت وتاريخ الطباعة : </span>
                    <span>{printTimestamp}</span>
                  </div>
                </div>

                {/* السطر الثاني: العميل يميناً، العملة والرصيد وسطاً، رقم الصفحة والفترة يساراً */}
                <div className="grid grid-cols-3 items-center text-xs mt-2">
                  {/* يمين: العميل */}
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-black text-sm">: العـمـيـل</span>
                      <span className="font-extrabold text-black text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {currentAccount?.name || '—'}
                      </span>
                    </div>
                  </div>

                  {/* وسط: الرصيد المدور والرصيد النهائي والعملة */}
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-3 text-xs">
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                        <span className="font-bold text-amber-900">الرصيد المدور:</span>
                        <span className={`font-mono font-black ${
                          statementSummary.carriedForwardCredit > 0 ? 'text-emerald-800' : statementSummary.carriedForwardDebit > 0 ? 'text-rose-800' : 'text-slate-700'
                        }`}>
                          {statementSummary.carriedForwardCredit > 0
                            ? `${formatNum(statementSummary.carriedForwardCredit)} دائن`
                            : statementSummary.carriedForwardDebit > 0
                            ? `${formatNum(statementSummary.carriedForwardDebit)} مدين`
                            : '0.00'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        <span className="font-black text-black">الرصيد النهائي:</span>
                        <span className={`font-mono font-black ${
                          statementSummary.finalBalanceCredit > 0 ? 'text-emerald-800' : statementSummary.finalBalanceDebit > 0 ? 'text-rose-800' : 'text-black'
                        }`}>
                          {statementSummary.finalBalanceCredit > 0
                            ? `${formatNum(statementSummary.finalBalanceCredit)} دائن`
                            : statementSummary.finalBalanceDebit > 0
                            ? `${formatNum(statementSummary.finalBalanceDebit)} مدين`
                            : '0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                      الـعـمـلـة : {getCurrencyArabic(selectedCurrency)}
                    </div>
                  </div>

                  {/* يسار: رقم الصفحة والفترة من وإلى */}
                  <div className="text-left text-[11px] font-mono space-y-0.5" dir="rtl">
                    <div className="text-left">
                      <span className="font-bold">رقـم الـصـفـحـة : </span>
                      <span className="font-bold">( 1 - 1 )</span>
                    </div>
                    <div className="text-left">
                      <span className="font-bold">لـلـفـتـرة مـن : </span>
                      <span>{dateFrom ? dateFrom.replace(/-/g, '/') : '2026/01/01'}</span>
                      <span className="font-bold"> الـى : </span>
                      <span>{dateTo ? dateTo.replace(/-/g, '/') : new Date().toISOString().slice(0, 10).replace(/-/g, '/')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. جدول الحركات المالية مطابق 100% للشكل بالعرض A4 Landscape */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse border-2 border-black text-xs text-black">
                  <thead>
                    {/* الترويسة الرئيسية */}
                    <tr className="bg-[#e5e7eb] border-b-2 border-black text-center font-bold text-black select-none">
                      <th className="border border-black px-1.5 py-2 w-10 text-center">
                        #
                      </th>
                      <th className="border border-black px-2 py-2 w-28 text-center">
                        تـاريـخ الـحـركـة
                      </th>
                      <th className="border border-black px-2 py-2 w-28 text-center text-emerald-800 font-bold bg-emerald-50/50">
                        مـبـلـغ الـحـركـة دائـن
                      </th>
                      <th className="border border-black px-2 py-2 w-28 text-center text-rose-800 font-bold bg-rose-50/50">
                        مـبـلـغ الـحـركـة مـديـن
                      </th>
                      <th className="border border-black px-2 py-2 w-36 text-center">
                        نـوع الـحـركـة
                      </th>
                      <th className="border border-black px-3 py-2 text-right">
                        تـفـاصـيـل الـحـركـة
                      </th>
                      <th className="border border-black px-2 py-2 w-28 text-center text-emerald-800 font-bold bg-emerald-50/50">
                        الـرصـيـد دائـن
                      </th>
                      <th className="border border-black px-2 py-2 w-28 text-center text-rose-800 font-bold bg-rose-50/50">
                        الـرصـيـد مـديـن
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountLedger.length > 0 ? (
                      accountLedger.map((row, idx) => {
                        const isCarried = !!row.isCarriedForward;
                        let seqNum: string | number = 'مدور';
                        if (!isCarried) {
                          const nonCarriedList = accountLedger.filter(r => !r.isCarriedForward);
                          const realIndex = nonCarriedList.findIndex(r => r.id === row.id);
                          seqNum = realIndex !== -1 ? realIndex + 1 : idx + 1;
                        }

                        if (isCarried) {
                          return (
                            <tr key={row.id} className="border-b-2 border-black bg-amber-50/60 font-bold text-black">
                              {/* 1. التسلسل # */}
                              <td className="border border-black px-1 py-1.5 text-center font-bold text-[10px] bg-amber-200/50">
                                مدور
                              </td>

                              {/* 2. التاريخ */}
                              <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap">
                                {row.date.replace(/-/g, '/')}
                              </td>

                              {/* 3. مبلغ الحركة دائن */}
                              <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap text-emerald-800 bg-emerald-50/50">
                                {row.credit > 0 ? formatNum(row.credit) : '-'}
                              </td>

                              {/* 4. مبلغ الحركة مدين */}
                              <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap text-rose-800 bg-rose-50/50">
                                {row.debit > 0 ? formatNum(row.debit) : '-'}
                              </td>

                              {/* 5. نوع الحركة */}
                              <td className="border border-black px-2 py-1.5 text-center whitespace-nowrap font-black text-[11px] bg-amber-100/60">
                                رصيد سابق (مدور)
                              </td>

                              {/* 6. تفاصيل الحركة */}
                              <td className="border border-black px-3 py-1.5 text-right font-bold text-amber-950">
                                {row.details}
                              </td>

                              {/* 7. الرصيد دائن */}
                              <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap text-emerald-800 bg-emerald-50/50">
                                {row.balanceCredit > 0 ? formatNum(row.balanceCredit) : '-'}
                              </td>

                              {/* 8. الرصيد مدين */}
                              <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap text-rose-800 bg-rose-50/50">
                                {row.balanceDebit > 0 ? formatNum(row.balanceDebit) : '-'}
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={row.id} className="border-b border-black text-black">
                            {/* 1. التسلسل # */}
                            <td className="border border-black px-1 py-1.5 text-center font-mono font-bold">
                              {seqNum}
                            </td>

                            {/* 2. التاريخ */}
                            <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap">
                              {row.date.replace(/-/g, '/')}
                            </td>

                            {/* 3. مبلغ الحركة دائن (أخضر دائماً) */}
                            <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap text-emerald-700 bg-emerald-50/20">
                              {row.credit > 0 ? formatNum(row.credit) : '-'}
                            </td>

                            {/* 4. مبلغ الحركة مدين (أحمر دائماً) */}
                            <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap text-rose-700 bg-rose-50/20">
                              {row.debit > 0 ? formatNum(row.debit) : '-'}
                            </td>

                            {/* 5. نوع الحركة */}
                            <td className="border border-black px-2 py-1.5 text-center whitespace-nowrap font-medium text-[11px]">
                              {row.activityType}
                            </td>

                            {/* 6. تفاصيل الحركة */}
                            <td className="border border-black px-3 py-1.5 text-right font-medium">
                              {row.details}
                            </td>

                            {/* 7. الرصيد دائن (أخضر دائماً) */}
                            <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap text-emerald-700 bg-emerald-50/20">
                              {row.balanceCredit > 0 ? formatNum(row.balanceCredit) : '-'}
                            </td>

                            {/* 8. الرصيد مدين (أحمر دائماً) */}
                            <td className="border border-black px-2 py-1.5 text-center font-mono font-bold whitespace-nowrap text-rose-700 bg-rose-50/20">
                              {row.balanceDebit > 0 ? formatNum(row.balanceDebit) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="border border-black py-8 text-center text-slate-500 font-bold">
                          لا توجد حركات مالية مسجلة لهذا الحساب خلال الفترة المحددة
                        </td>
                      </tr>
                    )}

                    {/* أسطر فارغة لملء ورقة الكشف مثل النموذج المطبوع تماماً إذا كانت الحركات قليلة */}
                    {Array.from({ length: Math.max(0, 16 - accountLedger.length) }).map((_, i) => (
                      <tr key={`fill_p_${i}`} className="border-b border-black h-7">
                        <td className="border border-black px-1 py-1 text-center font-mono font-bold text-slate-300">
                          {accountLedger.length + i + 1}
                        </td>
                        <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                        <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                        <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                        <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                        <td className="border border-black px-3 py-1 text-right">&nbsp;</td>
                        <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                        <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 3. ملخص الإجماليات والتواقيع الرسمية */}
              <div className="mt-4 border-2 border-black p-3 bg-slate-50/50">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="border border-black p-2 bg-amber-50/80">
                    <span className="font-bold text-amber-900 block text-[11px]">الرصيد المدور (السابق):</span>
                    <span className={`font-mono font-black text-sm ${
                      statementSummary.carriedForwardCredit > 0
                        ? 'text-emerald-800'
                        : statementSummary.carriedForwardDebit > 0
                        ? 'text-rose-800'
                        : 'text-slate-700'
                    }`}>
                      {statementSummary.carriedForwardCredit > 0
                        ? `${formatNum(statementSummary.carriedForwardCredit)} دائن (له 🟢)`
                        : statementSummary.carriedForwardDebit > 0
                        ? `${formatNum(statementSummary.carriedForwardDebit)} مدين (عليه 🔴)`
                        : '0.00'}
                    </span>
                  </div>
                  <div className="border border-black p-2 bg-white">
                    <span className="font-bold text-slate-700 block text-[11px]">مجموع حركات الفترة (مدين 🔴):</span>
                    <span className="font-mono font-black text-rose-700 text-sm">
                      {formatNum(statementSummary.totalPeriodDebits)} {getCurrencyArabic(selectedCurrency)}
                    </span>
                  </div>
                  <div className="border border-black p-2 bg-white">
                    <span className="font-bold text-slate-700 block text-[11px]">مجموع حركات الفترة (دائن 🟢):</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      {formatNum(statementSummary.totalPeriodCredits)} {getCurrencyArabic(selectedCurrency)}
                    </span>
                  </div>
                  <div className="border border-black p-2 bg-white">
                    <span className="font-bold text-slate-700 block text-[11px]">صافي الرصيد الختامي:</span>
                    <span className={`font-mono font-black text-sm ${
                      statementSummary.finalBalanceCredit > 0
                        ? 'text-emerald-700'
                        : statementSummary.finalBalanceDebit > 0
                        ? 'text-rose-700'
                        : 'text-slate-800'
                    }`}>
                      {statementSummary.finalBalanceCredit > 0
                        ? `${formatNum(statementSummary.finalBalanceCredit)} دائن (له 🟢)`
                        : statementSummary.finalBalanceDebit > 0
                        ? `${formatNum(statementSummary.finalBalanceDebit)} مدين (عليه 🔴)`
                        : '0.00 رصيد متزن'}
                    </span>
                  </div>
                </div>

                {/* تواقيع المحاسبة والعميل */}
                <div className="grid grid-cols-3 gap-6 mt-6 pt-4 border-t border-dashed border-black text-center text-xs">
                  <div>
                    <span className="font-bold block text-slate-800">منظم الكشف / المحاسب</span>
                    <span className="text-[11px] text-slate-500 block mt-1">{systemUser || 'محمد علي الباوي'}</span>
                    <div className="mt-6 border-b border-black w-2/3 mx-auto"></div>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-800">المدقق المالي والختم</span>
                    <span className="text-[11px] text-slate-500 block mt-1">الإدارة العامة</span>
                    <div className="mt-6 border-b border-black w-2/3 mx-auto"></div>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-800">توقيع واستلام العميل</span>
                    <span className="text-[11px] text-slate-500 block mt-1">{currentAccount?.name || 'العميل'}</span>
                    <div className="mt-6 border-b border-black w-2/3 mx-auto"></div>
                  </div>
                </div>

                <div className="mt-3 text-center text-[10px] text-slate-600">
                  * ملاحظة: يعتبر هذا الكشف نهائياً ومطابقاً ما لم يرد اعتراض خطي خلال 3 أيام عمل من تاريخ استلامه.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* أنماط CSS خاصة للطباعة الحقيقية النظيفة دون أزرار أو حواف التطبيق */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-account-statement-sheet,
          #printable-account-statement-sheet * {
            visibility: visible !important;
          }
          #printable-account-statement-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 8mm 12mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 9999999 !important;
          }
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
        }
      `}</style>

    </div>
  );
};
