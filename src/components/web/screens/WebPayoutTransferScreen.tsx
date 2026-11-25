import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Printer, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  HandCoins, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Search,
  ArrowDownLeft,
  DollarSign,
  History,
  FileText,
  Ban,
  CheckCircle,
  Coins,
  ChevronDown,
  Landmark,
  Wallet,
  SendHorizontal,
  ArrowLeftRight
} from 'lucide-react';
import { TransactionRecord, AccountItem, P2PAgent, CurrencyCode } from '../../../types';
import { SearchableSelect } from '../../common/SearchableSelect';

interface WebPayoutTransferScreenProps {
  isOpen?: boolean;
  isEmbedded?: boolean;
  onClose?: () => void;
  onNavigateToIssue?: () => void;
  onNavigateToTransfers?: () => void;
  transactions: TransactionRecord[];
  accounts: AccountItem[];
  agents: P2PAgent[];
  onPayout: (txId: string, notes?: string, onAgentAccount?: boolean, targetAccountId?: string) => void;
  onCancelTransfer?: (txId: string, reason?: string) => void;
  onViewReceipt: (tx: TransactionRecord) => void;
  companyName?: string;
  systemUser?: string;
}

export const WebPayoutTransferScreen: React.FC<WebPayoutTransferScreenProps> = ({
  isOpen = true,
  isEmbedded = false,
  onClose,
  onNavigateToIssue,
  onNavigateToTransfers,
  transactions,
  accounts,
  agents,
  onPayout,
  onCancelTransfer,
  onViewReceipt,
  companyName = 'شركة الصرافة والتحويل المالي',
  systemUser = 'محمد علي الباوي',
}) => {
  // دالة تحويل رمز العملة إلى نص عربي صريح
  const getCurrencyNameAr = (code: CurrencyCode): string => {
    switch (code) {
      case 'USD': return 'دولار أمريكي';
      case 'IQD': return 'دينار عراقي';
      case 'EUR': return 'يورو';
      case 'AED': return 'درهم إماراتي';
      case 'TRY': return 'ليرة تركية';
      case 'GBP': return 'باون استرليني';
      default: return code;
    }
  };

  // فلاتر البحث العلوية (مطابقة لصورة النموذج القديم)
  const [receiverNameFilter, setReceiverNameFilter] = useState('');
  const [searchAnywhere, setSearchAnywhere] = useState(true);
  const [destinationCityFilter, setDestinationCityFilter] = useState('all');
  const [amountCompareType, setAmountCompareType] = useState<'all' | 'equal' | 'gte' | 'lte'>('all');
  const [amountFilter, setAmountFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  });

  const [agentFilter, setAgentFilter] = useState('all');
  const [originCityFilter, setOriginCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState('all');

  // التبويب النشط: تسليم الحوالات (تسليم) أو الحركات (اليومية)
  const [activeTab, setActiveTab] = useState<'payout' | 'history'>('payout');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'canceled'>('all');

  // الحوالة المحددة حالياً في الجدول
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Pagination State (افتراضي 10 أسطر مع خيارات 10, 25, 50, 100, 1000)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // نافذة تأكيد التسليم المنبثقة
  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState<{
    isOpen: boolean;
    tx: TransactionRecord | null;
    isAgentAccount: boolean;
  }>({
    isOpen: false,
    tx: null,
    isAgentAccount: false,
  });

  const [selectedPayoutAccountId, setSelectedPayoutAccountId] = useState<string>('');
  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState<boolean>(false);
  const [accountCategoryFilter, setAccountCategoryFilter] = useState<'all' | 'client' | 'bank' | 'other'>('all');

  const [receiverIdNumber, setReceiverIdNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // جميع الحسابات المتاحة في دليل الحسابات (عملاء، وكلاء، بنوك، شركات، صناديق...) مع استبعاد الخزنة 100%
  const availableLedgerAccounts = useMemo(() => {
    return accounts.filter(acc => acc.type !== 'vault');
  }, [accounts]);

  // الحساب المختار حالياً للتسليم والقيد
  const selectedPayoutAccount = useMemo(() => {
    return availableLedgerAccounts.find(a => a.id === selectedPayoutAccountId) || null;
  }, [availableLedgerAccounts, selectedPayoutAccountId]);

  // تصفية حسابات الدليل المحاسبي بحسب البحث والفئة
  const filteredLedgerAccounts = useMemo(() => {
    let list = availableLedgerAccounts;
    if (accountCategoryFilter === 'client') {
      list = list.filter(a => a.type === 'client');
    } else if (accountCategoryFilter === 'bank') {
      list = list.filter(a => a.type === 'bank');
    } else if (accountCategoryFilter === 'other') {
      list = list.filter(a => a.type !== 'client' && a.type !== 'bank');
    }

    if (!accountSearchQuery.trim()) return list;
    const q = accountSearchQuery.toLowerCase().trim();
    return list.filter(a => 
      a.name.toLowerCase().includes(q) ||
      (a.code && a.code.toLowerCase().includes(q)) ||
      (a.phone && a.phone.includes(q)) ||
      (a.city && a.city.toLowerCase().includes(q))
    );
  }, [availableLedgerAccounts, accountCategoryFilter, accountSearchQuery]);

  // دالة مساعدة لتصنيف وتلوين شارات أنواع الحسابات
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'bank': return { label: 'بنك / وكيل', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'client': return { label: 'عميل / زبون', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'supplier': return { label: 'شركة / جهة', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'cash_box': return { label: 'صندوق نقدية', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'expenses': return { label: 'مصروفات', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'revenues': return { label: 'إيرادات', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      default: return { label: 'حساب', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // دالة مساعدة لتنسيق الرصيد حسب قواعد الدائن (له 🟢 أخضر) والمدين (عليه 🔴 أحمر)
  const renderAccountBalanceBadge = (bal: number, curr: string) => {
    if (bal > 0) {
      return (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          <span>{bal.toLocaleString('en-US')} {curr}</span>
          <span className="text-[9px] font-bold text-emerald-800">(له 🟢)</span>
        </span>
      );
    } else if (bal < 0) {
      return (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
          <span>{Math.abs(bal).toLocaleString('en-US')} {curr}</span>
          <span className="text-[9px] font-bold text-rose-800">(عليه 🔴)</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
          <span>0 {curr}</span>
          <span className="text-[9px] text-slate-400">(متزن)</span>
        </span>
      );
    }
  };

  // الرصيد المتوقع بعد تنزيل مبلغ الحوالة
  const expectedNewBalanceUSD = selectedPayoutAccount && confirmDeliveryModal.tx
    ? (confirmDeliveryModal.tx.currency === 'USD' ? selectedPayoutAccount.balanceUSD - confirmDeliveryModal.tx.amount : selectedPayoutAccount.balanceUSD)
    : 0;
  const expectedNewBalanceIQD = selectedPayoutAccount && confirmDeliveryModal.tx
    ? (confirmDeliveryModal.tx.currency === 'IQD' ? selectedPayoutAccount.balanceIQD - confirmDeliveryModal.tx.amount : selectedPayoutAccount.balanceIQD)
    : 0;

  // إفراغ شروط البحث (F3)
  const handleResetFilters = () => {
    setReceiverNameFilter('');
    setSearchAnywhere(true);
    setDestinationCityFilter('all');
    setAmountCompareType('all');
    setAmountFilter('');
    setCurrencyFilter('all');
    setAgentFilter('all');
    setOriginCityFilter('all');
    setStatusFilter('all');
    setUserFilter('all');
  };

  // استخراج المدن المتاحة
  const destinationCities = useMemo(() => {
    const cities = new Set<string>();
    transactions.forEach(t => {
      if (t.destinationCity) cities.add(t.destinationCity);
    });
    return Array.from(cities);
  }, [transactions]);

  const originCities = useMemo(() => {
    const cities = new Set<string>();
    transactions.forEach(t => {
      if (t.originCity) cities.add(t.originCity);
    });
    return Array.from(cities);
  }, [transactions]);

  // قائمة الوكلاء المقيدين
  const agentOptions = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.agentName) set.add(t.agentName);
      if (t.senderName && t.senderName.includes('شركة') || t.senderName.includes('مكتب') || t.senderName.includes('صرافة')) {
        set.add(t.senderName);
      }
    });
    agents.forEach(a => set.add(`${a.officeName} (${a.city})`));
    set.add('(متوقف)احسان تركيا');
    set.add('شركة النور دبي');
    set.add('صرافة الرافدين أربيل');
    return Array.from(set);
  }, [transactions, agents]);

  // تصفية الحوالات المعروضة في الجدول
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // فقط الحوالات القابلة للاستلام أو الواردة
      // 1. اسم المستلم أو أينما وجد
      if (receiverNameFilter.trim()) {
        const q = receiverNameFilter.trim().toLowerCase();
        if (searchAnywhere) {
          const matchReceiver = (tx.receiverName || '').toLowerCase().includes(q);
          const matchSender = (tx.senderName || '').toLowerCase().includes(q);
          const matchPhone = (tx.receiverPhone || '').includes(q) || (tx.senderPhone || '').includes(q);
          const matchCode = (tx.code || '').includes(q);
          if (!matchReceiver && !matchSender && !matchPhone && !matchCode) return false;
        } else {
          if (!(tx.receiverName || '').toLowerCase().includes(q)) return false;
        }
      }

      // 2. مدينة الاستلام
      if (destinationCityFilter !== 'all') {
        if (tx.destinationCity !== destinationCityFilter) return false;
      }

      // 3. المبلغ
      if (amountFilter.trim() && amountCompareType !== 'all') {
        const cleanVal = parseFloat(amountFilter.replace(/,/g, ''));
        if (!isNaN(cleanVal)) {
          if (amountCompareType === 'equal' && tx.amount !== cleanVal) return false;
          if (amountCompareType === 'gte' && tx.amount < cleanVal) return false;
          if (amountCompareType === 'lte' && tx.amount > cleanVal) return false;
        }
      }

      // 4. العملة
      if (currencyFilter !== 'all') {
        if (tx.currency !== currencyFilter) return false;
      }

      // 5. الوكيل
      if (agentFilter !== 'all') {
        const matchAgent = tx.agentName === agentFilter || 
          tx.senderName === agentFilter ||
          (tx.notes || '').includes(agentFilter);
        if (!matchAgent) return false;
      }

      // 6. مدينة الإرسال
      if (originCityFilter !== 'all') {
        if (tx.originCity !== originCityFilter) return false;
      }

      // 7. الحالة
      if (statusFilter !== 'all') {
        if (statusFilter === 'ready' && tx.status !== 'ready_for_pickup' && tx.status !== 'pending') return false;
        if (statusFilter === 'completed' && tx.status !== 'completed') return false;
        if (statusFilter === 'canceled' && tx.status !== 'canceled') return false;
      }

      // 8. المستخدم
      if (userFilter !== 'all') {
        if (tx.createdBy && !tx.createdBy.includes(userFilter)) return false;
      }

      return true;
    });
  }, [
    transactions,
    receiverNameFilter,
    searchAnywhere,
    destinationCityFilter,
    amountCompareType,
    amountFilter,
    currencyFilter,
    agentFilter,
    originCityFilter,
    statusFilter,
    userFilter,
  ]);

  // Reset page to 1 whenever filters or pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    receiverNameFilter,
    searchAnywhere,
    destinationCityFilter,
    amountCompareType,
    amountFilter,
    currencyFilter,
    agentFilter,
    originCityFilter,
    statusFilter,
    userFilter,
    pageSize,
  ]);

  // Total pages and valid current page
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  // Paginated records for current page view
  const paginatedTransactions = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, validCurrentPage, pageSize]);

  const startIndex = filteredTransactions.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, filteredTransactions.length);

  // تحديد أول حوالة تلقائياً إذا لم تكن محددة ضمن الصفحة الحالية
  useEffect(() => {
    if (paginatedTransactions.length > 0) {
      if (!selectedTxId || !paginatedTransactions.some(t => t.id === selectedTxId)) {
        setSelectedTxId(paginatedTransactions[0].id);
      }
    } else if (filteredTransactions.length === 0) {
      setSelectedTxId(null);
    }
  }, [paginatedTransactions, selectedTxId, filteredTransactions.length]);

  // استخراج كائن الحوالة المحددة حالياً
  const selectedTx = useMemo(() => {
    return filteredTransactions.find(t => t.id === selectedTxId) || null;
  }, [filteredTransactions, selectedTxId]);

  // استخراج معلومات الوكيل (الاسم ورقم الهاتف) للحوالة المحددة حالياً لعرضها في الشريط العلوي
  const selectedTxAgentInfo = useMemo(() => {
    if (!selectedTx) return { name: '—', phone: '—' };
    
    // اسم الوكيل
    const agentName = selectedTx.agentName || selectedTx.accountName || (
      selectedTx.senderName && (selectedTx.senderName.includes('شركة') || selectedTx.senderName.includes('مكتب') || selectedTx.senderName.includes('صرافة'))
        ? selectedTx.senderName
        : '(متوقف)احسان تركيا'
    );
    
    // محاولة مطابقة هاتف الوكيل من قائمة الوكلاء أو هاتف المرسل أو هاتف افتراضي
    const matchedAgent = agents.find(a => 
      (selectedTx.agentName && (a.name === selectedTx.agentName || a.officeName === selectedTx.agentName)) ||
      (agentName && (a.name.includes(agentName) || a.officeName.includes(agentName) || agentName.includes(a.name) || agentName.includes(a.officeName)))
    );

    const phone = matchedAgent?.phone || selectedTx.senderPhone || '+90 532 123 4567';

    return {
      name: agentName,
      phone: phone
    };
  }, [selectedTx, agents]);

  // إجماليات المبالغ للحوالات المفلترة
  const totals = useMemo(() => {
    const count = filteredTransactions.length;
    let sumUSD = 0;
    let sumIQD = 0;

    filteredTransactions.forEach(t => {
      if (t.currency === 'USD') sumUSD += t.amount;
      else if (t.currency === 'IQD') sumIQD += t.amount;
      else sumUSD += t.amount;
    });

    let sumString = '';
    if (currencyFilter === 'USD') {
      sumString = `${sumUSD.toLocaleString('en-US')} دولار أمريكي`;
    } else if (currencyFilter === 'IQD') {
      sumString = `${sumIQD.toLocaleString('en-US')} دينار عراقي`;
    } else {
      if (sumUSD > 0 && sumIQD > 0) {
        sumString = `${sumUSD.toLocaleString('en-US')} دولار + ${sumIQD.toLocaleString('en-US')} د.ع`;
      } else if (sumUSD > 0) {
        sumString = `${sumUSD.toLocaleString('en-US')} دولار أمريكي`;
      } else if (sumIQD > 0) {
        sumString = `${sumIQD.toLocaleString('en-US')} دينار عراقي`;
      } else {
        sumString = '0.00';
      }
    }

    return {
      count,
      sumString,
    };
  }, [filteredTransactions, currencyFilter]);

  // فتح نافذة تأكيد الصرف
  const handleOpenDeliveryModal = (isAgentAccount: boolean) => {
    if (!selectedTx) {
      alert('يرجى تحديد حوالة من الجدول أولاً');
      return;
    }
    if (selectedTx.status === 'completed') {
      alert('هذه الحوالة تم تسليمها مسبقاً بالفعل!');
      return;
    }
    if (selectedTx.status === 'canceled') {
      alert('هذه الحوالة ملغاة ولا يمكن تسليمها!');
      return;
    }

    // محاولة مطابقة الحساب الأنسب تلقائياً من دليل الحسابات
    let initialAccountId = '';
    const match = availableLedgerAccounts.find(a => 
      (selectedTx.agentName && a.name.toLowerCase() === selectedTx.agentName.toLowerCase()) ||
      (selectedTx.accountName && a.name.toLowerCase() === selectedTx.accountName.toLowerCase()) ||
      (selectedTx.senderName && a.name.toLowerCase() === selectedTx.senderName.toLowerCase()) ||
      (selectedTx.agentName && a.name.toLowerCase().includes(selectedTx.agentName.toLowerCase())) ||
      (selectedTx.senderName && a.name.toLowerCase().includes(selectedTx.senderName.toLowerCase()))
    );

    if (match) {
      initialAccountId = match.id;
    } else {
      const firstBank = availableLedgerAccounts.find(a => a.type === 'bank');
      const firstClient = availableLedgerAccounts.find(a => a.type === 'client');
      initialAccountId = firstBank?.id || firstClient?.id || availableLedgerAccounts[0]?.id || '';
    }

    setSelectedPayoutAccountId(initialAccountId);
    setAccountSearchQuery('');
    setIsAccountDropdownOpen(false);
    setAccountCategoryFilter('all');
    setReceiverIdNumber('');
    setDeliveryNotes('');

    setConfirmDeliveryModal({
      isOpen: true,
      tx: selectedTx,
      isAgentAccount,
    });
  };

  // تأكيد التسليم الفعلي
  const handleConfirmDelivery = () => {
    if (!confirmDeliveryModal.tx) return;

    if (confirmDeliveryModal.isAgentAccount && !selectedPayoutAccountId) {
      alert('يرجى اختيار الحساب المراد تنزيل الحوالة عليه من دليل الحسابات');
      return;
    }

    const selectedAcc = availableLedgerAccounts.find(a => a.id === selectedPayoutAccountId);
    const targetAccountName = selectedAcc ? selectedAcc.name : '';

    const notes = deliveryNotes.trim() 
      ? `${deliveryNotes.trim()} (هوية المستلم: ${receiverIdNumber || 'غير محدد'})${confirmDeliveryModal.isAgentAccount ? ` [قيد على حساب: ${targetAccountName}]` : ''}`
      : `تسليم للمستفيد باليد (هوية: ${receiverIdNumber || 'متحقق منها'})${confirmDeliveryModal.isAgentAccount ? ` [قيد على حساب: ${targetAccountName}]` : ''}`;

    onPayout(
      confirmDeliveryModal.tx.id, 
      notes, 
      confirmDeliveryModal.isAgentAccount,
      confirmDeliveryModal.isAgentAccount ? selectedPayoutAccountId : undefined
    );

    const typeMsg = confirmDeliveryModal.isAgentAccount 
      ? `وقيد المبلغ على حساب: ${targetAccountName || 'الوكيل'}` 
      : 'نقداً من صندوق الشركة';

    setActionSuccessNotice(`تم تسليم الحوالة #${confirmDeliveryModal.tx.code} بنجاح (${typeMsg})`);
    setTimeout(() => setActionSuccessNotice(null), 5000);

    setConfirmDeliveryModal({ isOpen: false, tx: null, isAgentAccount: false });
    setSelectedPayoutAccountId('');
    setReceiverIdNumber('');
    setDeliveryNotes('');
    setAccountSearchQuery('');
    setIsAccountDropdownOpen(false);
  };

  // إلغاء التسليم (F7)
  const handleCancelDelivery = () => {
    if (!selectedTx) {
      alert('يرجى اختيار حوالة من الجدول أولاً');
      return;
    }
    if (selectedTx.status !== 'completed') {
      alert('الحوالة ليست مسلمة بعد لإلغاء تسليمها!');
      return;
    }

    if (window.confirm(`هل أنت متأكد من إلغاء تسليم الحوالة #${selectedTx.code} وإعادتها لحالة غير مسلمة؟`)) {
      if (onCancelTransfer) {
        onCancelTransfer(selectedTx.id, 'إلغاء التسليم من قبل المستخدم وإعادة فتح الحوالة');
      }
      setActionSuccessNotice(`تم إلغاء تسليم الحوالة #${selectedTx.code} وإعادتها لحالة جاهزة للاستلام`);
      setTimeout(() => setActionSuccessNotice(null), 5000);
    }
  };

  // تاريخ اليوم بصيغة YYYY-MM-DD للحركات اليومية (يوم بيومه فقط)
  const todayDateStr = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  // سجل حركات التسليم اليومية (يوم بيومه فقط)
  const dailyPayoutHistory = useMemo(() => {
    return transactions.filter(t => {
      // فقط الحوالات التي تمت عليها حركات تسليم أو إلغاء أو حوالات تم تسليمها اليوم
      const isPayoutOrTransfer = t.type === 'transfer' || t.type === 'payout' || t.completedAt;
      if (!isPayoutOrTransfer) return false;

      // يوم بيومه فقط: التأكد من أن تاريخ الحركة يطابق اليوم
      const txDate = (t.completedAt || t.createdAt || '').slice(0, 10);
      return txDate === todayDateStr;
    });
  }, [transactions, todayDateStr]);

  // تصفية سجل الحركات اليومية
  const filteredDailyHistory = useMemo(() => {
    return dailyPayoutHistory.filter(item => {
      if (historyStatusFilter === 'completed' && item.status !== 'completed') return false;
      if (historyStatusFilter === 'canceled' && item.status !== 'canceled') return false;

      if (!historySearchQuery.trim()) return true;
      const q = historySearchQuery.trim().toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        (item.receiverName && item.receiverName.toLowerCase().includes(q)) ||
        (item.senderName && item.senderName.toLowerCase().includes(q)) ||
        (item.agentName && item.agentName.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.otpCode && item.otpCode.includes(q))
      );
    });
  }, [dailyPayoutHistory, historyStatusFilter, historySearchQuery]);

  // إجماليات الحركات اليومية
  const dailyHistoryTotals = useMemo(() => {
    let totalUSD = 0;
    let totalIQD = 0;
    let completedCount = 0;

    filteredDailyHistory.forEach(item => {
      if (item.status === 'completed') {
        completedCount++;
        if (item.currency === 'USD') totalUSD += item.amount;
        else if (item.currency === 'IQD') totalIQD += item.amount;
      }
    });

    return {
      count: filteredDailyHistory.length,
      completedCount,
      totalUSD,
      totalIQD,
    };
  }, [filteredDailyHistory]);

  // دعم اختصارات لوحة المفاتيح والأسهم للتنقل بين الأسطر بدون ماوس
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // تجنب مقاطعة الكتابة داخل الحقول النصية ومربعات البحث
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      // التنقل بالأسهم (ArrowUp و ArrowDown) لاختيار الحوالة التالية والسابقة بدون ماوس
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isInput) {
        if (activeTab === 'payout') {
          if (!paginatedTransactions || paginatedTransactions.length === 0) return;
          e.preventDefault();

          const currentIndex = paginatedTransactions.findIndex(tx => tx.id === selectedTxId);

          if (e.key === 'ArrowDown') {
            if (currentIndex === -1) {
              setSelectedTxId(paginatedTransactions[0].id);
            } else if (currentIndex < paginatedTransactions.length - 1) {
              setSelectedTxId(paginatedTransactions[currentIndex + 1].id);
            }
          } else if (e.key === 'ArrowUp') {
            if (currentIndex === -1) {
              setSelectedTxId(paginatedTransactions[paginatedTransactions.length - 1].id);
            } else if (currentIndex > 0) {
              setSelectedTxId(paginatedTransactions[currentIndex - 1].id);
            }
          }
          return;
        } else if (activeTab === 'history') {
          if (!filteredDailyHistory || filteredDailyHistory.length === 0) return;
          e.preventDefault();

          const currentIndex = filteredDailyHistory.findIndex(tx => tx.id === selectedTxId);

          if (e.key === 'ArrowDown') {
            if (currentIndex === -1) {
              setSelectedTxId(filteredDailyHistory[0].id);
            } else if (currentIndex < filteredDailyHistory.length - 1) {
              setSelectedTxId(filteredDailyHistory[currentIndex + 1].id);
            }
          } else if (e.key === 'ArrowUp') {
            if (currentIndex === -1) {
              setSelectedTxId(filteredDailyHistory[filteredDailyHistory.length - 1].id);
            } else if (currentIndex > 0) {
              setSelectedTxId(filteredDailyHistory[currentIndex - 1].id);
            }
          }
          return;
        }
      }

      if (confirmDeliveryModal.isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setConfirmDeliveryModal({ isOpen: false, tx: null, isAgentAccount: false });
          return;
        }
        if (e.key === 'F9' || (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement))) {
          e.preventDefault();
          handleConfirmDelivery();
          return;
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) {
          onClose();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleResetFilters();
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (selectedTx) onViewReceipt(selectedTx);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (activeTab === 'payout') {
          handleOpenDeliveryModal(false);
        }
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (activeTab === 'payout') {
          handleCancelDelivery();
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (activeTab === 'payout') {
          handleOpenDeliveryModal(true);
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (selectedTx) onViewReceipt(selectedTx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedTx, confirmDeliveryModal.isOpen, paginatedTransactions, selectedTxId, activeTab]);

  if (!isOpen && !isEmbedded) return null;

  const cardContent = (
    <div 
      className={`relative w-full ${
        isEmbedded 
          ? 'max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto bg-white rounded-3xl shadow-xl border-2 border-sky-400 overflow-hidden text-slate-800 flex flex-col' 
          : 'w-full max-w-[98vw] 2xl:max-w-[1600px] h-[92vh] max-h-[920px] min-h-[600px] bg-white rounded-3xl shadow-2xl border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.25)] overflow-hidden my-auto text-slate-800 flex flex-col'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* =========================================================================
          شريط رأس النافذة المنبثقة (مطابق للون الأزرق السماوي لاستعلام الحوالات)
          ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-sky-200 border border-white/20">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>تسليم الحوالات الواردة النقدية</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-sky-100 border border-white/20">
                تسلم حوالة
              </span>
            </h2>
            <p className="text-[11px] text-sky-100/80">
              صرف وتسليم الحوالات الواردة للمستفيدين نقداً من الصندوق أو على حساب الوكيل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 text-xs text-sky-100/90 font-medium bg-black/15 px-3 py-1 rounded-xl border border-white/10">
            <span>{companyName}</span>
            <span>•</span>
            <span className="font-bold text-white">{systemUser}</span>
          </div>

          {/* زر الإغلاق (ESC) */}
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
            }}
            title="إنهاء وإغلاق (ESC)"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          شريط التبويبات المدمجة كأنظمة المحاسبة والصرافة: [ تسليم الحوالات ] [ الحركات ]
          ========================================================================= */}
      <div className="bg-slate-100/80 px-4 pt-2 border-b border-slate-200 shrink-0">
        <div className="flex items-end gap-1.5">
          {/* تبويب: تسليم حوالة */}
          <button
            type="button"
            onClick={() => setActiveTab('payout')}
            className={`px-5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 flex items-center gap-2 ${
              activeTab === 'payout'
                ? 'bg-white text-sky-950 border-slate-300 relative z-10 -mb-[1px] pb-2.5 shadow-xs font-black'
                : 'bg-slate-200/80 text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-sky-600" />
            <span>تسليم الحوالات</span>
          </button>

          {/* تبويب: الحركات (اليومية يوم بيومه) */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-sky-950 border-slate-300 relative z-10 -mb-[1px] pb-2.5 shadow-xs font-black'
                : 'bg-slate-200/80 text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>الحركات (اليومية)</span>
            {dailyPayoutHistory.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'history' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-700'
              }`}>
                {dailyPayoutHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'payout' ? (
        /* جسم النافذة الرئيسي - ارتفاع متمدد وثابت تماماً بدون أي اهتزاز عند البحث */
        <div className="p-3.5 sm:p-4 space-y-3 bg-[#f8fafc] flex-1 min-h-0 overflow-y-auto flex flex-col">

          {/* إشعار نجاح الحركة إن وجد */}
          {actionSuccessNotice && (
            <div className="p-2.5 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between text-xs text-sky-950 shadow-2xs animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-bold">{actionSuccessNotice}</span>
              </div>
              <button 
                onClick={() => setActionSuccessNotice(null)} 
                className="text-sky-700 hover:text-sky-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* =========================================================================
              القسم العلوي: شروط البحث والتصفية (متناسقة ومتكاملة تملأ الشريط بدون أي مساحة فارغة)
              ========================================================================= */}
          <div className="p-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xs shrink-0">
            <div className="flex items-end gap-1.5 text-xs flex-wrap xl:flex-nowrap pb-0.5">
              
              {/* 1. اسم المستلم (مع خيار أينما وجد) */}
              <div className="flex-[1.5] min-w-[170px]">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-bold text-slate-700">اسم المستلم:</label>
                  <label className="flex items-center gap-1 text-[9px] text-slate-500 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchAnywhere}
                      onChange={(e) => setSearchAnywhere(e.target.checked)}
                      className="w-2.5 h-2.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>أينما وجد</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={receiverNameFilter}
                    onChange={(e) => setReceiverNameFilter(e.target.value)}
                    placeholder="ابحث بالمستلم..."
                    className="w-full h-7 pl-6 pr-2 py-0.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none shadow-inner"
                  />
                  <Search className="w-3 h-3 text-slate-400 absolute left-1.5 top-2 pointer-events-none" />
                </div>
              </div>

              {/* 2. مدينة الاستلام */}
              <div className="flex-1 min-w-[95px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">مدينة الاستلام:</label>
                <SearchableSelect
                  value={destinationCityFilter}
                  onChange={(val) => setDestinationCityFilter(val)}
                  options={[
                    { value: 'all', label: '(الكل)' },
                    ...destinationCities.map(city => ({ value: city, label: city })),
                    { value: 'بغداد', label: 'بغداد' },
                    { value: 'البصرة', label: 'البصرة' },
                    { value: 'أربيل', label: 'أربيل' },
                    { value: 'النجف الأشرف', label: 'النجف الأشرف' },
                    { value: 'كربلاء المقدسة', label: 'كربلاء المقدسة' },
                    { value: 'الموصل', label: 'الموصل' },
                  ]}
                  searchPlaceholder="المدن..."
                />
              </div>

              {/* 3. المبلغ مع شرط المقارنة */}
              <div className="flex-[1.2] min-w-[135px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">المبلغ:</label>
                <div className="flex items-center gap-1">
                  <div className="w-12 shrink-0">
                    <SearchableSelect
                      value={amountCompareType}
                      onChange={(val) => setAmountCompareType(val as any)}
                      options={[
                        { value: 'all', label: 'الكل' },
                        { value: 'equal', label: '=' },
                        { value: 'gte', label: '>=' },
                        { value: 'lte', label: '<=' },
                      ]}
                      searchPlaceholder="..."
                    />
                  </div>
                  <input
                    type="text"
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    placeholder="0.000"
                    className="w-full h-7 px-1.5 py-0.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              {/* 4. العملة */}
              <div className="flex-1 min-w-[90px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">العملة:</label>
                <SearchableSelect
                  value={currencyFilter}
                  onChange={(val) => setCurrencyFilter(val)}
                  options={[
                    { value: 'all', label: '(الجميع)' },
                    { value: 'USD', label: 'دولار' },
                    { value: 'IQD', label: 'دينار' },
                    { value: 'EUR', label: 'يورو' },
                    { value: 'AED', label: 'درهم' },
                    { value: 'TRY', label: 'ليرة' },
                  ]}
                  searchPlaceholder="العملات..."
                />
              </div>

              {/* 5. التاريخ */}
              <div className="flex-1 min-w-[95px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">التاريخ:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full h-7 pl-6 pr-1.5 py-0.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none shadow-inner"
                  />
                  <Calendar className="w-3 h-3 text-slate-400 absolute left-1 top-2 pointer-events-none" />
                </div>
              </div>

              {/* 6. اسم الوكيل */}
              <div className="flex-[1.4] min-w-[130px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">اسم الوكيل:</label>
                <SearchableSelect
                  value={agentFilter}
                  onChange={(val) => setAgentFilter(val)}
                  options={[
                    { value: 'all', label: '(جميع الوكلاء)' },
                    ...agentOptions.map(agent => ({ value: agent, label: agent }))
                  ]}
                  searchPlaceholder="الوكلاء..."
                />
              </div>

              {/* 7. مدينة الارسال */}
              <div className="flex-1 min-w-[95px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">مدينة الارسال:</label>
                <SearchableSelect
                  value={originCityFilter}
                  onChange={(val) => setOriginCityFilter(val)}
                  options={[
                    { value: 'all', label: '(جميع المدن)' },
                    ...originCities.map(city => ({ value: city, label: city })),
                    { value: 'إسطنبول', label: 'إسطنبول' },
                    { value: 'دبي', label: 'دبي' },
                    { value: 'بغداد', label: 'بغداد' },
                    { value: 'أربيل', label: 'أربيل' },
                    { value: 'البصرة', label: 'البصرة' },
                  ]}
                  searchPlaceholder="المدن..."
                />
              </div>

              {/* 8. حالتها */}
              <div className="flex-1 min-w-[85px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">حالتها:</label>
                <SearchableSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: 'all', label: '(الكل)' },
                    { value: 'ready', label: 'غير مسلمة' },
                    { value: 'completed', label: 'مسلمة' },
                    { value: 'canceled', label: 'ملغاة' },
                  ]}
                  searchPlaceholder="الحالة..."
                />
              </div>

              {/* 9. المستخدم */}
              <div className="flex-1 min-w-[85px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">المستخدم:</label>
                <SearchableSelect
                  value={userFilter}
                  onChange={(val) => setUserFilter(val)}
                  options={[
                    { value: 'all', label: '(الكل)' },
                    { value: systemUser, label: systemUser },
                    { value: 'أمين الصندوق', label: 'أمين الصندوق' },
                    { value: 'أحمد الكرخي', label: 'أحمد الكرخي' },
                  ]}
                  searchPlaceholder="المستخدم..."
                />
              </div>

            </div>
          </div>

          {/* =========================================================================
              السطر الأول: شريط الإجراءات والعمليات السريعة (موزع بشكل متناسق وكامل العرض)
              عرض .F5  |  تسليم من الشركة .F9  |  الغاء التسليم .F7  |  تسليم على حساب الوكيل .F2  |  الغاء على حساب الوكيل  |  تفريغ .F3  |  طباعة .F6  |  انهاء .ESC
              ========================================================================= */}
          <div className="p-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* زر عرض .F5 */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTx) onViewReceipt(selectedTx);
                    else alert('يرجى تحديد حوالة من الجدول أولاً');
                  }}
                  className="h-8 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="عرض تفاصيل الحوالة (F5)"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>عرض .F5</span>
                </button>

                {/* زر تسليم من الشركة .F9 (تسليم نقدي من الصندوق) */}
                <button
                  type="button"
                  onClick={() => handleOpenDeliveryModal(false)}
                  className="h-8 px-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white border border-[#0284c7] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                  title="تسليم الحوالة نقداً من صندوق الشركة (F9)"
                >
                  <HandCoins className="w-3.5 h-3.5 text-sky-200" />
                  <span>تسليم من الشركة .F9</span>
                </button>

                {/* زر إلغاء التسليم .F7 */}
                <button
                  type="button"
                  onClick={handleCancelDelivery}
                  className="h-8 px-3 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="إلغاء تسليم الحوالة (F7)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>الغاء التسليم .F7</span>
                </button>

                {/* زر تسليم على حساب الوكيل .F2 */}
                <button
                  type="button"
                  onClick={() => handleOpenDeliveryModal(true)}
                  className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-amber-950 border border-amber-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                  title="تسليم الحوالة مع قيد المبلغ على حساب الوكيل المدين (F2)"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-900" />
                  <span>تسليم على حساب الوكيل .F2</span>
                </button>

                {/* زر إلغاء على حساب الوكيل */}
                <button
                  type="button"
                  onClick={handleCancelDelivery}
                  className="h-8 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="إلغاء التسليم على حساب الوكيل"
                >
                  <span>الغاء على حساب الوكيل</span>
                </button>

                {/* زر تفريغ .F3 (إفراغ وتصفير شروط البحث) */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-8 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="تفريغ وإعادة تعيين شروط البحث (F3)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>تفريغ .F3</span>
                </button>

                {/* زر طباعة .F6 */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTx) onViewReceipt(selectedTx);
                    else alert('يرجى تحديد حوالة للطباعة');
                  }}
                  className="h-8 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="طباعة سند الصرف / التسليم (F6)"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>طباعة .F6</span>
                </button>
              </div>

              {/* زر إنهاء .ESC في أقصى اليسار */}
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="إنهاء وإغلاق النافذة (ESC)"
              >
                <X className="w-3.5 h-3.5 text-slate-600" />
                <span>انهاء .ESC</span>
              </button>

            </div>
          </div>

          {/* =========================================================================
              السطر الثاني: معلومات الوكيل ومبالغ العمليات وإحصائيات الحوالات
              منسق وموزع بدقة على كامل العرض بدون أي فراغات فارغة
              ========================================================================= */}
          <div className="p-2 bg-slate-50/90 border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between gap-2.5 text-xs shrink-0 flex-wrap">
            
            {/* 1. اسم الوكيل - يتسع ليشغل المساحة الطبيعية */}
            <div className="flex-1 min-w-[260px] flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">اسم الوكيل:</span>
              <div 
                className="flex-1 px-2.5 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-amber-950 shadow-inner truncate whitespace-nowrap"
                title={selectedTxAgentInfo.name}
              >
                {selectedTx ? selectedTxAgentInfo.name : '—'}
              </div>
            </div>

            {/* 2. هاتف الوكيل - سطر واحد غير ملتف نهائياً */}
            <div className="shrink-0 flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">هاتف الوكيل:</span>
              <div className="px-3 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 shadow-inner whitespace-nowrap text-center min-w-[130px]" dir="ltr">
                {selectedTx ? selectedTxAgentInfo.phone : '—'}
              </div>
            </div>

            {/* 3. مدينة الإرسال */}
            <div className="shrink-0 flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">مدينة الإرسال:</span>
              <div className="px-3 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-inner whitespace-nowrap text-center min-w-[80px]">
                {selectedTx?.originCity || '—'}
              </div>
            </div>

            {/* 4. مبالغ العمليات */}
            <div className="shrink-0 flex items-center gap-2 bg-emerald-50/90 px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs">
              <span className="font-bold text-emerald-950 whitespace-nowrap text-[11px]">مبالغ العمليات:</span>
              <div className="px-3 py-0.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-black text-emerald-800 shadow-inner whitespace-nowrap text-left" dir="ltr">
                {totals.sumString}
              </div>
            </div>

            {/* 5. عدد الحوالات */}
            <div className="shrink-0 flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">عدد الحوالات:</span>
              <div className="px-3 py-0.5 bg-sky-50 border border-sky-200 rounded-lg text-xs font-mono font-black text-sky-900 shadow-inner min-w-[32px] text-center whitespace-nowrap">
                {totals.count}
              </div>
            </div>

          </div>

          {/* =========================================================================
              الجدول الرئيسي للحوالات الواردة (كشف الحوالات)
              الأعمدة متناسقة بدون فراغات متباعدة لتلائم العرض الجديد تماماً
              ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex-1 min-h-[360px] flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto relative">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#f0f9ff] text-slate-700 font-bold sticky top-0 border-b border-sky-200/80 z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3 border-l border-slate-200/80 whitespace-nowrap w-[5cm] min-w-[5cm]">الاسم (المستلم)</th>
                    <th className="py-2.5 px-2 border-l border-slate-200/80 whitespace-nowrap w-[2.8cm] min-w-[2.8cm] text-center">هاتف المستلم</th>
                    <th className="py-2.5 px-2 border-l border-slate-200/80 whitespace-nowrap w-[2.6cm] min-w-[2.6cm] text-center">مدينة الاستلام</th>
                    <th className="py-2.5 px-2.5 border-l border-slate-200/80 text-left whitespace-nowrap w-[3cm] min-w-[3cm]">المبلغ</th>
                    <th className="py-2.5 px-1.5 border-l border-slate-200/80 text-center whitespace-nowrap w-[1.8cm] min-w-[1.8cm]">نوع العملة</th>
                    <th className="py-2.5 px-2.5 border-l border-slate-200/80 whitespace-nowrap bg-sky-50/60 text-slate-900 w-[3.8cm] min-w-[3.8cm]">اسم المرسل</th>
                    <th className="py-2.5 px-2 border-l border-slate-200/80 whitespace-nowrap bg-sky-50/60 text-slate-900 w-[2.8cm] min-w-[2.8cm] text-center">هاتف المرسل</th>
                    <th className="py-2.5 px-2 border-l border-slate-200/80 whitespace-nowrap bg-amber-50/60 text-slate-900 w-[2.6cm] min-w-[2.6cm] text-center">مدينة الإرسال</th>
                    <th className="py-2.5 px-1.5 border-l border-slate-200/80 text-center whitespace-nowrap w-[2.4cm] min-w-[2.4cm]">حالة الحوالة</th>
                    <th className="py-2.5 px-2 text-center whitespace-nowrap w-[2.2cm] min-w-[2.2cm]">رقم الحوالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-20 text-slate-400 bg-slate-50/40 font-medium">
                        لا توجد حوالات مطابقة لشروط البحث المحددة
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => {
                      const isSelected = selectedTxId === tx.id;
                      const isReady = tx.status === 'ready_for_pickup' || tx.status === 'pending';
                      const isCompleted = tx.status === 'completed';
                      const isCanceled = tx.status === 'canceled';

                      return (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedTxId(tx.id)}
                          onDoubleClick={() => onViewReceipt(tx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-sky-100/90 font-bold text-sky-950 border-y border-sky-300 ring-1 ring-sky-400' 
                              : 'hover:bg-slate-50/90'
                          }`}
                        >
                          {/* 1. الاسم (المستلم) */}
                          <td className="py-2 px-3 border-l border-slate-200/50 whitespace-nowrap w-[5cm] min-w-[5cm]">
                            <div className="flex items-center gap-1.5">
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0"></span>}
                              <span className={isSelected ? 'text-sky-950 font-bold' : 'text-slate-900 font-bold'}>
                                {tx.receiverName || 'بدون اسم'}
                              </span>
                            </div>
                          </td>

                          {/* 2. هاتف المستلم */}
                          <td className="py-2 px-2 border-l border-slate-200/50 font-mono text-slate-600 text-[11px] whitespace-nowrap text-center w-[2.8cm] min-w-[2.8cm]" dir="ltr">
                            {tx.receiverPhone || '—'}
                          </td>

                          {/* 3. مدينة الاستلام */}
                          <td className="py-2 px-2 border-l border-slate-200/50 text-slate-700 whitespace-nowrap text-center w-[2.6cm] min-w-[2.6cm]">
                            {tx.destinationCity || 'بغداد'}
                          </td>

                          {/* 4. المبلغ */}
                          <td className="py-2 px-2.5 border-l border-slate-200/50 font-mono font-black text-left whitespace-nowrap w-[3cm] min-w-[3cm] text-[#DC2626]">
                            {tx.amount.toLocaleString('en-US')}
                          </td>

                          {/* 5. نوع العملة */}
                          <td className="py-2 px-1.5 border-l border-slate-200/50 font-bold text-center whitespace-nowrap w-[1.8cm] min-w-[1.8cm] text-slate-700 text-xs">
                            {tx.currency === 'USD' ? 'دولار' : tx.currency === 'IQD' ? 'دينار' : tx.currency}
                          </td>

                          {/* 6. اسم المرسل (تم تقليص عرضه بدقة) */}
                          <td className="py-2 px-2.5 border-l border-slate-200/50 text-slate-900 font-bold whitespace-nowrap w-[3.8cm] min-w-[3.8cm]">
                            {tx.senderName || '—'}
                          </td>

                          {/* 7. هاتف المرسل */}
                          <td className="py-2 px-2 border-l border-slate-200/50 font-mono text-slate-600 text-[11px] whitespace-nowrap text-center w-[2.8cm] min-w-[2.8cm]" dir="ltr">
                            {tx.senderPhone || '—'}
                          </td>

                          {/* 8. مدينة الإرسال */}
                          <td className="py-2 px-2 border-l border-slate-200/50 text-slate-700 whitespace-nowrap text-center w-[2.6cm] min-w-[2.6cm]">
                            {tx.originCity || 'إسطنبول'}
                          </td>

                          {/* 9. حالة الحوالة */}
                          <td className="py-1 px-1.5 border-l border-slate-200/50 text-center whitespace-nowrap w-[2.4cm] min-w-[2.4cm]">
                            {isCompleted && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                مسلمة
                              </span>
                            )}
                            {isReady && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300">
                                غير مسلمة
                              </span>
                            )}
                            {isCanceled && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                ملغاة
                              </span>
                            )}
                            {!isCompleted && !isReady && !isCanceled && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                قيد المعالجة
                              </span>
                            )}
                          </td>

                          {/* 10. رقم الحوالة */}
                          <td className="py-2 px-2 text-center font-mono text-[11px] font-bold text-slate-600 whitespace-nowrap w-[2.2cm] min-w-[2.2cm]">
                            {tx.code}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* شريط ترقيم الحوالات وتحديد عدد الأسطر (10، 25، 50، 100، 1000) للنافذة */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-xs shrink-0 select-none">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <span>
                  إظهار <strong className="font-mono text-slate-900">{startIndex}</strong> إلى <strong className="font-mono text-slate-900">{endIndex}</strong> من أصل <strong className="font-mono text-slate-900">{filteredTransactions.length}</strong> حوالة
                </span>

                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-600">الأسطر:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-transparent text-[11px] font-bold text-[#0284C7] focus:outline-none cursor-pointer"
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
                  className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
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
                          className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                            p === validCurrentPage
                              ? 'bg-[#0284C7] text-white shadow-2xs'
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
                  className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
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

        </div>
      ) : (
        /* =========================================================================
            صفحة الحركات (حركات تسليم الحوالات يوم بيومه فقط مثل الصيرفة)
            ========================================================================= */
        <div className="p-3.5 sm:p-4 space-y-3 bg-[#f8fafc] flex-1 min-h-0 overflow-y-auto flex flex-col">
          
          {/* إحصائيات وبطاقات سريعة للحركات اليومية */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-bold block">إجمالي حركات اليوم</span>
              <span className="text-lg font-black text-slate-800 font-mono mt-0.5 block">{dailyHistoryTotals.count}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] text-emerald-700 font-bold block">تم تسليمها اليوم</span>
              <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">{dailyHistoryTotals.completedCount}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-blue-200 shadow-2xs">
              <span className="text-[11px] text-blue-700 font-bold block">مجموع المسلم ($ دولار)</span>
              <span className="text-lg font-black text-blue-600 font-mono mt-0.5 block">
                ${dailyHistoryTotals.totalUSD.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] text-amber-700 font-bold block">مجموع المسلم (د.ع عراقي)</span>
              <span className="text-lg font-black text-amber-600 font-mono mt-0.5 block">
                {dailyHistoryTotals.totalIQD.toLocaleString()} د.ع
              </span>
            </div>
          </div>

          {/* شريط البحث وتصفية الحركات */}
          <div className="p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="بحث في حركات اليوم برقم الحوالة، المستلم، المرسل، الوكيل..."
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-400 focus:outline-none transition-colors"
                />
                {historySearchQuery && (
                  <button 
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">حالة الحركة:</span>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  historyStatusFilter === 'all'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  historyStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                مسلمة فقط
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('canceled')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  historyStatusFilter === 'canceled'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ملغاة
              </button>
            </div>
          </div>

          {/* جدول الحركات اليومية */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-xs text-slate-700 text-[11px] font-black border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">رقم الحوالة</th>
                    <th className="py-2.5 px-3">وقت الحركة</th>
                    <th className="py-2.5 px-3">المستفيد</th>
                    <th className="py-2.5 px-3">المرسل</th>
                    <th className="py-2.5 px-3">المبلغ والعملة</th>
                    <th className="py-2.5 px-3">الجهة / الوكيل</th>
                    <th className="py-2.5 px-3">طريقة الصرف</th>
                    <th className="py-2.5 px-3">الحالة</th>
                    <th className="py-2.5 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <History className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                        <p className="font-bold text-slate-500">لا توجد حركات تسليم مسجلة لهذا اليوم حتى الآن</p>
                        <p className="text-[11px] text-slate-400 mt-1">تظهر هنا حركات تسليم الحوالات المنفذة اليوم فقط (يوم بيومه)</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDailyHistory.map((item) => (
                      <tr 
                        key={item.id}
                        className={`hover:bg-sky-50/60 transition-colors ${
                          selectedTxId === item.id ? 'bg-sky-100/70 font-bold' : ''
                        }`}
                        onClick={() => setSelectedTxId(item.id)}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-900">
                          #{item.code}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {item.completedAt ? new Date(item.completedAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : (
                            item.createdAt ? new Date(item.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '—'
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800">{item.receiverName}</span>
                          {item.receiverPhone && (
                            <span className="block text-[10px] text-slate-400 font-mono">{item.receiverPhone}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.senderName || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                          {item.amount.toLocaleString()} {item.currency === 'USD' ? '$' : 'د.ع'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.agentName || item.destinationCity || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.payoutMethod === 'agent_account' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                              <Building2 className="w-3 h-3" />
                              حساب الوكيل
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Coins className="w-3 h-3" />
                              نقداً من الصندوق
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              تم التسليم
                            </span>
                          ) : item.status === 'canceled' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <Ban className="w-3 h-3" />
                              ملغاة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              قيد الانتظار
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewReceipt(item);
                            }}
                            title="معاينة وطباعة الإيصال"
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 cursor-pointer inline-flex items-center justify-center transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ذيل جدول الحركات */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <span className="font-bold">
                عدد الحركات المعروضة: {filteredDailyHistory.length} من أصل {dailyPayoutHistory.length}
              </span>
              <span className="text-[11px] text-slate-400">
                الحركات المعروضة خاصة بتاريخ اليوم ({new Date().toLocaleDateString('ar-IQ')})
              </span>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          نافذة تسليم الحوالة للمستفيد:
          1. تسليم حوالة على حساب وكيل (مطابقة تماماً لصورة البرنامج القديم، بدون نقد)
          2. أو تسليم نقداً من الصندوق (منفصلة ومستقلة 100%)
          ========================================================================= */}
      {confirmDeliveryModal.isOpen && confirmDeliveryModal.tx && (
        <div 
          className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => {
            setConfirmDeliveryModal({ isOpen: false, tx: null, isAgentAccount: false });
          }}
        >
          {confirmDeliveryModal.isAgentAccount ? (
            /* ===============================================================
               1. نافذة: تسليم حوالة على حساب وكيل (مثل صورة البرنامج القديم تماماً)
               =============================================================== */
            <div 
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-slate-400 overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ترويسة كلاسيكية: تسليم حوالة على حساب وكيل */}
              <div className="bg-[#0284c7] text-white px-4 py-2.5 flex items-center justify-between border-b border-sky-600 select-none">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-200" />
                  <span className="font-bold text-sm tracking-wide">تسليم حوالة على حساب وكيل</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeliveryModal({ isOpen: false, tx: null, isAgentAccount: false })}
                  className="w-6 h-6 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer text-xs"
                  title="إغلاق (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* المحتوى المرتب البسيط */}
              <div className="p-4 space-y-3 text-xs bg-slate-100/60">
                
                {/* شريط معلومات الحوالة المختصر */}
                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">الحوالة:</span>
                    <strong className="font-mono text-sky-700 font-bold">#{confirmDeliveryModal.tx.code}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">المبلغ:</span>
                    <strong className="font-mono text-rose-600 font-black">
                      {confirmDeliveryModal.tx.amount.toLocaleString('en-US')} {getCurrencyNameAr(confirmDeliveryModal.tx.currency)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 truncate max-w-[150px]" title={confirmDeliveryModal.tx.receiverName}>
                    <span className="text-slate-500 font-bold">المستفيد:</span>
                    <strong className="text-slate-900 truncate">{confirmDeliveryModal.tx.receiverName}</strong>
                  </div>
                </div>

                {/* حقل اسم الوكيل وقائمة الاختيار المباشرة (اللون الأصفر الكلاسيكي مثل الصورة القديمة) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="text-blue-800 font-extrabold text-sm">اسم الوكيل:</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      اختر الوكيل أو الحساب المطلوب
                    </span>
                  </div>

                  {/* شريط بحث سريع في الوكلاء */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={accountSearchQuery}
                      onChange={(e) => setAccountSearchQuery(e.target.value)}
                      placeholder="ابحث باسم الوكيل أو الكود..."
                      className="w-full pr-8 pl-3 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none shadow-inner"
                    />
                  </div>

                  {/* صندوق قائمة الوكلاء باللون الأصفر الفاتح مثل الصورة القديمة */}
                  <div className="w-full h-48 bg-[#fffef0] border-2 border-slate-300 rounded-lg overflow-y-auto divide-y divide-slate-200 shadow-inner">
                    {filteredLedgerAccounts.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 font-bold">
                        لا يوجد وكيل أو حساب بهذا الاسم
                      </div>
                    ) : (
                      filteredLedgerAccounts.map((acc) => {
                        const isSelected = acc.id === selectedPayoutAccountId;
                        return (
                          <div
                            key={acc.id}
                            onClick={() => setSelectedPayoutAccountId(acc.id)}
                            className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors select-none ${
                              isSelected
                                ? 'bg-[#0284c7] text-white font-bold'
                                : 'hover:bg-amber-100/60 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
                              )}
                              <span>{acc.name}</span>
                              {acc.code && (
                                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  #{acc.code}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                                {acc.city || 'العراق'}
                              </span>
                              <span className="font-mono font-bold text-[11px]">
                                {confirmDeliveryModal.tx.currency === 'USD'
                                  ? `${acc.balanceUSD.toLocaleString('en-US')} $`
                                  : `${acc.balanceIQD.toLocaleString('en-US')} د.ع`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* اسم الوكيل المختار حالياً */}
                {selectedPayoutAccount && (
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        الوكيل المحدد: <strong>{selectedPayoutAccount.name}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700">
                      سيتم قيد وتنزيل المبلغ عليه
                    </span>
                  </div>
                )}

                {/* الأزرار السفلية (موافق .F9 - انهاء .ESC) تماماً كما في صورة البرنامج القديم */}
                <div className="pt-3 border-t border-slate-300 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleConfirmDelivery}
                    className="min-w-[120px] py-1.5 px-6 bg-white hover:bg-slate-50 text-blue-900 border-2 border-slate-300 hover:border-blue-600 rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    title="تأكيد التسليم على حساب الوكيل (F9 أو Enter)"
                  >
                    <span>موافق .F9</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeliveryModal({ isOpen: false, tx: null, isAgentAccount: false })}
                    className="min-w-[120px] py-1.5 px-6 bg-white hover:bg-slate-50 text-blue-900 border-2 border-slate-300 hover:border-rose-500 rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    title="إلغاء وإنهاء (ESC)"
                  >
                    <span>انهاء .ESC</span>
                  </button>
                </div>

              </div>
            </div>
          ) : (
            /* ===============================================================
               2. نافذة: تسليم الحوالة للمستفيد (نقداً من صندوق الشركة)
               =============================================================== */
            <div 
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-sky-400 overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ترويسة التسليم النقدي */}
              <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white px-4 py-2.5 flex items-center justify-between border-b border-sky-600 select-none">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-sky-200" />
                  <span className="font-bold text-sm tracking-wide">تسليم الحوالة للمستفيد (نقداً)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeliveryModal({ isOpen: false, tx: null, isAgentAccount: false })}
                  className="w-6 h-6 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer text-xs"
                  title="إغلاق (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* المحتوى */}
              <div className="p-4 space-y-3.5 text-xs">
                
                {/* بطاقة الحوالة النقدية */}
                <div className="bg-[#fffef0] border-2 border-slate-300 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-bold">رقم الحوالة:</span>
                    <strong className="font-mono text-sky-800 font-bold text-sm">#{confirmDeliveryModal.tx.code}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-bold">اسم المستفيد:</span>
                    <strong className="text-slate-900 font-bold">{confirmDeliveryModal.tx.receiverName}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-bold">المبلغ المسلّم نقداً:</span>
                    <strong className="font-mono text-rose-600 font-black text-sm">
                      {confirmDeliveryModal.tx.amount.toLocaleString('en-US')} {getCurrencyNameAr(confirmDeliveryModal.tx.currency)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-bold">الصرف من:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      صندوق النقدية الرئيسي (الخزنة معزولة 100%)
                    </span>
                  </div>
                </div>

                {/* توثيق اختياري للهوية والملاحظات */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      رقم هوية المستلم (اختياري):
                    </label>
                    <input
                      type="text"
                      value={receiverIdNumber}
                      onChange={(e) => setReceiverIdNumber(e.target.value)}
                      placeholder="رقم الهوية / الجواز..."
                      className="w-full px-3 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ملاحظات التسليم:
                    </label>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="تم التسليم نقداً للمستفيد..."
                      className="w-full px-3 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-medium text-slate-800 focus:outline-none shadow-inner"
                    />
                  </div>
                </div>

                {/* الأزرار السفلية */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleConfirmDelivery}
                    className="min-w-[120px] py-1.5 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    title="تأكيد الصرف والتسليم النقدي (F9 أو Enter)"
                  >
                    <span>موافق .F9</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeliveryModal({ isOpen: false, tx: null, isAgentAccount: false })}
                    className="min-w-[120px] py-1.5 px-6 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 hover:border-rose-400 rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    title="إلغاء وإنهاء (ESC)"
                  >
                    <span>انهاء .ESC</span>
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="flex-1 w-full min-h-full flex flex-col p-3 sm:p-5 md:p-6 text-slate-800 space-y-4" dir="rtl">
        <div className="w-full flex items-center justify-center my-auto">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto" 
      dir="rtl"
      onClick={() => {
        if (onClose) onClose();
      }}
    >
      {cardContent}
    </div>
  );
};
