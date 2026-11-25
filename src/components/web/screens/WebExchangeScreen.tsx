import React, { useState, useMemo, useEffect } from 'react';
import { 
  Coins, 
  ArrowRightLeft, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  X, 
  Wallet, 
  CreditCard, 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Calendar,
  Filter,
  Receipt,
  Ban,
  FileText,
  AlertTriangle,
  Edit3,
  Undo2,
  Plus
} from 'lucide-react';
import { 
  CurrencyRate, 
  TransactionRecord, 
  CurrencyCode, 
  AccountItem 
} from '../../../types';

interface WebExchangeScreenProps {
  accounts: AccountItem[];
  currencies: CurrencyRate[];
  transactions: TransactionRecord[];
  onCreateTransaction: (newTx: TransactionRecord) => void;
  onUpdateTransaction?: (updatedTx: TransactionRecord) => void;
  onCancelTransaction?: (id: string, reason?: string) => void;
  onViewReceipt: (tx: TransactionRecord) => void;
  companyName?: string;
  systemUser?: string;
  onClose?: () => void;
}

// دالة التفقيط باللغة العربية
function tafqeetArabic(amount: number, currency: CurrencyCode): string {
  if (amount <= 0 || isNaN(amount)) return '';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertChunk(num: number): string {
    let str = '';
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    if (h > 0) str += hundreds[h];
    if (h > 0 && remainder > 0) str += ' و';
    if (remainder > 0) {
      if (remainder < 20) {
        str += ones[remainder];
      } else {
        const o = remainder % 10;
        const t = Math.floor(remainder / 10);
        if (o > 0) str += ones[o] + ' و';
        str += tens[t];
      }
    }
    return str.trim();
  }

  const billions = Math.floor(amount / 1000000000);
  let rem = amount % 1000000000;
  const millions = Math.floor(rem / 1000000);
  rem %= 1000000;
  const thousands = Math.floor(rem / 1000);
  const units = Math.floor(rem % 1000);

  const parts: string[] = [];

  if (billions > 0) {
    if (billions === 1) parts.push('مليار');
    else if (billions === 2) parts.push('ملياران');
    else if (billions >= 3 && billions <= 10) parts.push(convertChunk(billions) + ' مليارات');
    else parts.push(convertChunk(billions) + ' مليار');
  }

  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions >= 3 && millions <= 10) parts.push(convertChunk(millions) + ' ملايين');
    else parts.push(convertChunk(millions) + ' مليون');
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(convertChunk(thousands) + ' آلاف');
    else parts.push(convertChunk(thousands) + ' ألف');
  }

  if (units > 0) {
    parts.push(convertChunk(units));
  }

  let currName = '';
  switch (currency) {
    case 'USD': currName = 'دولار أمريكي'; break;
    case 'IQD': currName = 'دينار عراقي'; break;
    case 'EUR': currName = 'يورو'; break;
    case 'TRY': currName = 'ليرة تركية'; break;
    case 'AED': currName = 'درهم إماراتي'; break;
    case 'GBP': currName = 'باوند إسترليني'; break;
    default: currName = currency;
  }

  const fullText = parts.join(' و ');
  return fullText ? `فقط ${fullText} ${currName} لا غير` : '';
}

export const WebExchangeScreen: React.FC<WebExchangeScreenProps> = ({
  accounts,
  currencies,
  transactions,
  onCreateTransaction,
  onUpdateTransaction,
  onCancelTransaction,
  onViewReceipt,
  companyName: initialCompanyName = '',
  systemUser: initialSystemUser = 'المدير العام',
  onClose,
}) => {
  const formatWithCommas = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null || val === '') return '';
    const clean = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    if (!clean) return '';
    const parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const parseNum = (val: string | number | undefined | null): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  // التبويب المدمج النشط (صرافة | الحركات) كما في أنظمة المحاسبة الكلاسيكية
  const [activeTab, setActiveTab] = useState<'exchange' | 'history'>('exchange');

  // وضع تعديل أصل الحركة: عند النقر على "أصل الحركة" يتم تحميل القيد الأصلي وتفعيله للتعديل
  const [editingTx, setEditingTx] = useState<TransactionRecord | null>(null);

  // نوع العملية والتسوية
  const [operationType, setOperationType] = useState<'buy' | 'sell'>('buy'); // شراء | بيع
  const [settlementType, setSettlementType] = useState<'cash' | 'credit'>('cash'); // نقدي | آجل

  // الحقول الخمسة الأساسية المطلوبة: العملة، المبلغ، سعر الصرف، الناتج، التفاصيل
  const [currency, setCurrency] = useState<CurrencyCode>('USD'); // 1. العملة
  const [amountStr, setAmountStr] = useState<string>('10,000'); // 2. المبلغ
  const [rateStr, setRateStr] = useState<string>('1,520'); // 3. سعر الصرف
  const [details, setDetails] = useState<string>(''); // 5. التفاصيل

  // أطراف العملية (الصندوق أو حساب العميل)
  const [selectedCashBoxId, setSelectedCashBoxId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [accountQuery, setAccountQuery] = useState<string>('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState<boolean>(false);

  // فلترة سجل الحركات
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');

  // نافذة تأكيد الإلغاء
  const [cancellingTx, setCancellingTx] = useState<TransactionRecord | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');

  // إشعار نجاح
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [lastCreatedTx, setLastCreatedTx] = useState<TransactionRecord | null>(null);

  // الصناديق النقدية (الخزنة معزولة تماماً)
  const cashBoxes = useMemo(() => {
    return accounts.filter(a => a.type === 'cash_box');
  }, [accounts]);

  useEffect(() => {
    if (cashBoxes.length > 0 && !selectedCashBoxId) {
      setSelectedCashBoxId(cashBoxes[0].id);
    }
  }, [cashBoxes, selectedCashBoxId]);

  // تحديث سعر الصرف الافتراضي عند تغيير العملة أو نوع العملية (فقط في حال عدم وجود وضع تعديل قائم)
  useEffect(() => {
    if (editingTx) return; // عند التعديل نلتزم بسعر القيد الأصلي ولا نفرض السعر الافتراضي
    const cur = currencies.find(c => c.code === currency) || currencies.find(c => c.code === 'USD');
    if (cur) {
      setRateStr(formatWithCommas(operationType === 'buy' ? cur.buyRate : cur.sellRate));
    }
  }, [currency, operationType, currencies, editingTx]);

  // الحسابات الآجلة
  const clientAccounts = useMemo(() => {
    return accounts.filter(a => a.type !== 'cash_box' && a.type !== 'vault');
  }, [accounts]);

  const filteredClientAccounts = useMemo(() => {
    if (!accountQuery.trim()) return clientAccounts.slice(0, 10);
    const q = accountQuery.trim().toLowerCase();
    return clientAccounts.filter(a => 
      a.name.toLowerCase().includes(q) || 
      (a.code && a.code.toLowerCase().includes(q)) ||
      (a.phone && a.phone.includes(q))
    ).slice(0, 10);
  }, [clientAccounts, accountQuery]);

  const selectedAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  const selectedCashBox = useMemo(() => {
    return accounts.find(a => a.id === selectedCashBoxId);
  }, [accounts, selectedCashBoxId]);

  // 4. الناتج (احتساب لحظي)
  const parsedAmount = parseNum(amountStr);
  const parsedRate = parseNum(rateStr);
  const calculatedTotal = Math.round(parsedAmount * parsedRate);
  const tafqeetText = tafqeetArabic(calculatedTotal, 'IQD');

  // تحديث التفاصيل تلقائياً عند تغيير الحقول إذا لم تكن مخصصة يدوياً أو عند إنشاء جديد
  useEffect(() => {
    if (editingTx) return; // الحفاظ على بيان أصل الحركة عند التعديل إلا إذا عدله المستخدم
    const op = operationType === 'buy' ? 'شراء' : 'بيع';
    const sett = settlementType === 'cash' ? 'نقداً' : 'آجل';
    const party = settlementType === 'cash' 
      ? (customerName.trim() ? `الزبون: ${customerName}` : (selectedCashBox ? selectedCashBox.name : '')) 
      : (selectedAccount ? `حساب: ${selectedAccount.name}` : '');
    
    setDetails(`${op} ${formatWithCommas(parsedAmount)} ${currency} بسعر ${formatWithCommas(parsedRate)} د.ع (${sett}) ${party}`.trim());
  }, [operationType, settlementType, parsedAmount, parsedRate, currency, customerName, selectedCashBox, selectedAccount, editingTx]);

  // الضغط على "أصل الحركة": يعيد المستخدم إلى القيد مع تحميل كامل بياناته للتعديل
  const handleOpenOriginalTransaction = (tx: TransactionRecord) => {
    setEditingTx(tx);
    setActiveTab('exchange');

    // تحميل كافة بيانات القيد الأصلي للحقول مباشرة
    const isBuy = tx.exchangeOperationType === 'buy' || tx.titleAr.includes('شراء');
    const isCredit = tx.exchangeSettlementType === 'credit' || tx.transferSettlementType === 'credit';

    setOperationType(isBuy ? 'buy' : 'sell');
    setSettlementType(isCredit ? 'credit' : 'cash');
    if (tx.currency) setCurrency(tx.currency);
    setAmountStr(formatWithCommas(tx.amount));
    setRateStr(formatWithCommas(tx.exchangeRate || 0));
    setDetails(tx.notes || '');

    if (tx.cashBoxId) setSelectedCashBoxId(tx.cashBoxId);
    if (tx.accountId) {
      setSelectedAccountId(tx.accountId);
      if (tx.accountName) setAccountQuery(tx.accountName);
    } else if (tx.accountName) {
      const found = accounts.find(a => a.name === tx.accountName);
      if (found) {
        setSelectedAccountId(found.id);
        setAccountQuery(found.name);
      }
    }

    if (isCredit) {
      setCustomerName('');
    } else {
      const cust = isBuy ? (tx.senderName !== selectedCashBox?.name ? tx.senderName : '') : (tx.receiverName !== selectedCashBox?.name ? tx.receiverName : '');
      setCustomerName(cust || '');
    }

    setShowSuccessToast(`تم فتح أصل الحركة (${tx.code}). يمكنك الآن تعديل أي بيان وحفظ التعديلات.`);
  };

  // تفريغ الحقول والبدء بسند جديد فارغ
  const handleResetToNew = () => {
    setEditingTx(null);
    setAmountStr('');
    setCustomerName('');
    setSelectedAccountId('');
    setAccountQuery('');
    setDetails('');
  };

  // حفظ وقيد الحركة (جديدة أو معدلة)
  const handleSave = () => {
    if (parsedAmount <= 0) {
      alert('يرجى كتابة مبلغ صحيح');
      return;
    }
    if (parsedRate <= 0) {
      alert('يرجى كتابة سعر صرف صحيح');
      return;
    }
    if (settlementType === 'credit' && !selectedAccountId) {
      alert('يرجى اختيار حساب العميل للعملية الآجلة');
      return;
    }
    if (settlementType === 'cash' && !selectedCashBoxId) {
      alert('يرجى اختيار الصندوق النقدي');
      return;
    }

    const opTitle = operationType === 'buy' ? 'شراء عملة' : 'بيع عملة';
    const settTitle = settlementType === 'cash' ? 'نقدي' : 'آجل';

    const sender = settlementType === 'cash' 
      ? (operationType === 'buy' ? (customerName.trim() || 'عميل نقدي') : (selectedCashBox?.name || 'الصندوق الرئيسي'))
      : (operationType === 'buy' ? (selectedAccount?.name || 'حساب العميل') : 'حساب الصرافة');

    const receiver = settlementType === 'cash'
      ? (operationType === 'buy' ? (selectedCashBox?.name || 'الصندوق الرئيسي') : (customerName.trim() || 'عميل نقدي'))
      : (operationType === 'buy' ? 'حساب الصرافة' : (selectedAccount?.name || 'حساب العميل'));

    // إذا كنا في وضع تعديل أصل حركة قائم
    if (editingTx) {
      const updatedTx: TransactionRecord = {
        ...editingTx,
        exchangeOperationType: operationType,
        exchangeSettlementType: settlementType,
        transferSettlementType: settlementType,
        titleAr: `${opTitle} ${currency} (${settTitle}) [معدل]`,
        senderName: sender,
        receiverName: receiver,
        accountId: settlementType === 'credit' ? selectedAccountId : undefined,
        accountName: settlementType === 'credit' ? selectedAccount?.name : undefined,
        cashBoxId: settlementType === 'cash' ? selectedCashBoxId : undefined,
        cashBoxName: settlementType === 'cash' ? selectedCashBox?.name : undefined,
        amount: parsedAmount,
        currency: currency,
        targetAmount: calculatedTotal,
        targetCurrency: 'IQD',
        exchangeRate: parsedRate,
        notes: details.trim(),
        completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      if (onUpdateTransaction) {
        onUpdateTransaction(updatedTx);
      } else {
        onCreateTransaction(updatedTx);
      }

      setLastCreatedTx(updatedTx);
      setShowSuccessToast(`تم حفظ وتعديل أصل حركة الصرافة (${editingTx.code}) بنجاح وتحديث القيود المحاسبية.`);
      setEditingTx(null);
      return;
    }

    // سند جديد أصلي
    const newTx: TransactionRecord = {
      id: `ex-${Date.now()}`,
      code: `EX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'exchange',
      exchangeOperationType: operationType,
      exchangeSettlementType: settlementType,
      transferSettlementType: settlementType,
      titleAr: `${opTitle} ${currency} (${settTitle})`,
      senderName: sender,
      receiverName: receiver,
      accountId: settlementType === 'credit' ? selectedAccountId : undefined,
      accountName: settlementType === 'credit' ? selectedAccount?.name : undefined,
      cashBoxId: settlementType === 'cash' ? selectedCashBoxId : undefined,
      cashBoxName: settlementType === 'cash' ? selectedCashBox?.name : undefined,
      amount: parsedAmount,
      currency: currency,
      targetAmount: calculatedTotal,
      targetCurrency: 'IQD',
      exchangeRate: parsedRate,
      fee: 0,
      status: 'completed',
      createdBy: initialSystemUser,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes: details.trim(),
    };

    onCreateTransaction(newTx);
    setLastCreatedTx(newTx);
    setShowSuccessToast(`تم تثبيت عملية ${opTitle} ${formatWithCommas(parsedAmount)} ${currency} بنجاح وترحيل القيد.`);
  };

  // تأكيد الإلغاء الفعلي للحركة
  const handleConfirmCancel = () => {
    if (!cancellingTx) return;
    if (onCancelTransaction) {
      onCancelTransaction(cancellingTx.id, cancelReasonInput.trim() || 'إلغاء حركة الصرافة');
    }
    setShowSuccessToast(`تم إلغاء حركة الصرافة ${cancellingTx.code} بنجاح وعكس الأثر المالي.`);
    setCancellingTx(null);
    setCancelReasonInput('');
  };

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cancellingTx) {
          setCancellingTx(null);
          return;
        }
        if (editingTx) {
          setEditingTx(null);
          return;
        }
        if (onClose) onClose();
      } else if (e.key === 'F9' || e.key === 'F2') {
        if (activeTab === 'exchange') {
          e.preventDefault();
          handleSave();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleResetToNew();
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (lastCreatedTx) onViewReceipt(lastCreatedTx);
        else window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, lastCreatedTx, parsedAmount, parsedRate, settlementType, selectedAccountId, selectedCashBoxId, details, activeTab, cancellingTx, editingTx]);

  // سجل العمليات السابقة
  const exchangeHistory = useMemo(() => {
    return transactions.filter(t => t.type === 'exchange');
  }, [transactions]);

  // تصفية سجل الحركات للبحث
  const filteredHistory = useMemo(() => {
    return exchangeHistory.filter(item => {
      const isBuy = item.exchangeOperationType === 'buy' || item.titleAr.includes('شراء');
      if (historyTypeFilter === 'buy' && !isBuy) return false;
      if (historyTypeFilter === 'sell' && isBuy) return false;

      if (!historySearchQuery.trim()) return true;
      const q = historySearchQuery.trim().toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.senderName && item.senderName.toLowerCase().includes(q)) ||
        (item.receiverName && item.receiverName.toLowerCase().includes(q)) ||
        (item.accountName && item.accountName.toLowerCase().includes(q))
      );
    });
  }, [exchangeHistory, historyTypeFilter, historySearchQuery]);

  // إجماليات سجل الحركات
  const historyTotals = useMemo(() => {
    let totalBuyUSD = 0;
    let totalSellUSD = 0;
    let totalIQD = 0;

    filteredHistory.forEach(item => {
      if (item.status === 'canceled') return; // استبعاد الملغاة من الإجماليات
      const isBuy = item.exchangeOperationType === 'buy' || item.titleAr.includes('شراء');
      if (item.currency === 'USD') {
        if (isBuy) totalBuyUSD += item.amount;
        else totalSellUSD += item.amount;
      }
      totalIQD += item.targetAmount || 0;
    });

    return { totalBuyUSD, totalSellUSD, totalIQD };
  }, [filteredHistory]);

  return (
    <div className="p-3 sm:p-5 w-full max-w-full 2xl:max-w-7xl mx-auto text-slate-800 font-sans space-y-2 select-none" dir="rtl">
      
      {/* الترويسة الزرقاء الأنيقة والموجزة */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-4 py-3 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sky-100">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide">صرافة - بيع وشراء العملات</h1>
              {editingTx && (
                <span className="bg-amber-400 text-amber-950 text-[10px] px-2 py-0.5 rounded-md font-black animate-pulse">
                  وضع تعديل: {editingTx.code}
                </span>
              )}
            </div>
            <p className="text-[11px] text-sky-100/90 font-medium">سند صرافة مباشر نقدي وبالآجل مع القيد الفوري</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* محدد شراء / بيع في شاشة الصرافة */}
          {activeTab === 'exchange' && (
            <>
              <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setOperationType('buy')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    operationType === 'buy' ? 'bg-emerald-500 text-white shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>شراء</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperationType('sell')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    operationType === 'sell' ? 'bg-sky-400 text-slate-950 shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  <span>بيع</span>
                </button>
              </div>

              {/* محدد نقدي / آجل */}
              <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setSettlementType('cash')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    settlementType === 'cash' ? 'bg-white text-sky-900 shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>نقدي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementType('credit')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    settlementType === 'credit' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>آجل</span>
                </button>
              </div>
            </>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer mr-1"
              title="إغلاق (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* إشعار النجاح المباشر */}
      {showSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{showSuccessToast}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastCreatedTx && (
              <button
                type="button"
                onClick={() => onViewReceipt(lastCreatedTx)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السند</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          شريط التبويبات المدمجة كأنظمة المحاسبة تماماً: [ الحركات ] [ صرافة ]
          ========================================================================= */}
      <div className="pt-1">
        <div className="flex items-end gap-1 px-3">
          
          {/* تبويب: صرافة (النافذة الرئيسية لإدخال وتعديل القيد) */}
          <button
            type="button"
            onClick={() => setActiveTab('exchange')}
            className={`px-6 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 flex items-center gap-2 ${
              activeTab === 'exchange'
                ? 'bg-white text-sky-950 border-slate-300 relative z-10 -mb-[2px] pb-2.5 shadow-xs font-black'
                : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-200/80 mb-0'
            }`}
          >
            <span>صرافة</span>
            {editingTx && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          {/* تبويب: الحركات (سجل العمليات المدمج) */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-sky-950 border-slate-300 relative z-10 -mb-[2px] pb-2.5 shadow-xs font-black'
                : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-200/80 mb-0'
            }`}
          >
            <span>الحركات</span>
            {exchangeHistory.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'history' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {exchangeHistory.length}
              </span>
            )}
          </button>

        </div>

        {/* الحاوية المدمجة التي تفتح التبويب المحدد */}
        <div className="bg-white rounded-b-2xl rounded-tl-2xl border-2 border-slate-300 p-4 sm:p-5 shadow-2xs relative z-0">
          
          {/* =========================================================================
              النافذة 1: صرافة (الحقول: العملة، المبلغ، سعر الصرف، الناتج، التفاصيل)
              ========================================================================= */}
          {activeTab === 'exchange' && (
            <div className="space-y-4">
              
              {/* شريط تنبيه عند تعديل أصل حركة مع زر العودة لسند جديد */}
              {editingTx && (
                <div className="bg-amber-50 border border-amber-300 px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="text-amber-950">
                        أنت تقوم الآن بتعديل أصل الحركة رقم: <strong className="font-mono text-amber-900 font-black">({editingTx.code})</strong>
                      </span>
                      <p className="text-[11px] text-amber-800 font-normal">
                        تاريخ الإنشاء الأصلي: {editingTx.createdAt} — يمكنك تعديل الحقول وحفظ التعديل مباشرة.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToNew}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-700" />
                    <span>إلغاء التعديل والبدء بسند جديد فارغ</span>
                  </button>
                </div>
              )}

              {/* السطر الأول: العملة | المبلغ | سعر الصرف | الناتج */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
                
                {/* 1. العملة */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">العملة</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] cursor-pointer"
                  >
                    <option value="USD">USD 🇺🇸 دولار أمريكي</option>
                    <option value="EUR">EUR 🇪🇺 يورو</option>
                    <option value="TRY">TRY 🇹🇷 ليرة تركية</option>
                    <option value="AED">AED 🇦🇪 درهم إماراتي</option>
                    <option value="GBP">GBP 🇬🇧 باوند إسترليني</option>
                    <option value="IQD">IQD 🇮🇶 دينار عراقي</option>
                  </select>
                </div>

                {/* 2. المبلغ */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">المبلغ</label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{currency}</span>
                  </div>
                  <input
                    type="text"
                    value={amountStr}
                    onChange={(e) => setAmountStr(formatWithCommas(e.target.value))}
                    placeholder="0"
                    className="w-full h-10 px-3 bg-[#fffef0] border border-slate-300 rounded-xl font-mono text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>

                {/* 3. سعر الصرف */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">سعر الصرف</label>
                    <span className="text-[10px] text-slate-400 font-mono">1{currency}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={rateStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '');
                        if (Number(val) > 10000) {
                          setRateStr(formatWithCommas(Math.round(Number(val) / 100)));
                        } else {
                          setRateStr(formatWithCommas(e.target.value));
                        }
                      }}
                      placeholder="1,520"
                      className="w-full h-10 px-3 pl-8 bg-[#fffef0] border border-slate-300 rounded-xl font-mono text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    />
                    <span className="absolute left-2.5 top-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">
                      د.ع
                    </span>
                  </div>
                </div>

                {/* 4. الناتج */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">الناتج الإجمالي</label>
                    <span className="text-[10px] text-emerald-700 font-bold">المعادل بالدينار</span>
                  </div>
                  <div className="h-10 px-3 bg-emerald-50/80 border border-emerald-300 rounded-xl font-mono text-base font-black text-emerald-950 flex items-center justify-between">
                    <span>{formatWithCommas(calculatedTotal)}</span>
                    <span className="text-xs font-bold text-emerald-700 font-sans">د.ع</span>
                  </div>
                </div>

              </div>

              {/* سطر التفقيط التلقائي الهادئ */}
              {tafqeetText && (
                <div className="text-[11px] text-emerald-900 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-200/60 font-medium">
                  {tafqeetText}
                </div>
              )}

              {/* السطر الثاني: الطرف المحاسبي (الصندوق أو حساب العميل) + 5. التفاصيل */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start pt-1">
                
                {/* الطرف المحاسبي (نقدي أو آجل) */}
                <div className="lg:col-span-4 space-y-1.5">
                  {settlementType === 'cash' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">الصندوق النقدي</label>
                      <select
                        value={selectedCashBoxId}
                        onChange={(e) => setSelectedCashBoxId(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284c7] cursor-pointer"
                      >
                        {cashBoxes.map((box) => (
                          <option key={box.id} value={box.id}>
                            {box.name} ({formatWithCommas(box.balanceIQD)} د.ع | ${formatWithCommas(box.balanceUSD)})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        حساب العميل (دليل الحسابات) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={accountQuery}
                          onChange={(e) => {
                            setAccountQuery(e.target.value);
                            setIsAccountDropdownOpen(true);
                          }}
                          onFocus={() => setIsAccountDropdownOpen(true)}
                          placeholder="اختر أو ابحث عن اسم العميل..."
                          className="w-full h-10 pr-8 pl-3 bg-white border border-amber-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
                      </div>

                      {/* قائمة الحسابات */}
                      {isAccountDropdownOpen && (
                        <div className="absolute z-30 right-0 left-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {filteredClientAccounts.map((acc) => (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                setSelectedAccountId(acc.id);
                                setAccountQuery(acc.name);
                                setIsAccountDropdownOpen(false);
                              }}
                              className="w-full p-2.5 text-right hover:bg-amber-50 flex items-center justify-between text-xs cursor-pointer"
                            >
                              <span className="font-bold text-slate-900">{acc.name}</span>
                              <div className="text-left font-mono text-[11px]">
                                <span className={acc.balanceIQD >= 0 ? 'text-emerald-700 font-bold block' : 'text-rose-700 font-bold block'}>
                                  {formatWithCommas(acc.balanceIQD)} د.ع {acc.balanceIQD >= 0 ? '(له 🟢)' : '(عليه 🔴)'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* في حالة النقدي: اسم الزبون اختياري للطباعة */}
                {settlementType === 'cash' ? (
                  <div className="lg:col-span-3 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">اسم الزبون (للطباعة)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="عميل نقدي"
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    />
                  </div>
                ) : (
                  <div className="lg:col-span-3 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">رصيد العميل الحالي</label>
                    <div className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl flex items-center text-xs font-mono">
                      {selectedAccount ? (
                        <span className={selectedAccount.balanceIQD >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {formatWithCommas(selectedAccount.balanceIQD)} د.ع {selectedAccount.balanceIQD >= 0 ? '(له 🟢)' : '(عليه 🔴)'}
                        </span>
                      ) : (
                        <span className="text-slate-400">حدد العميل</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. التفاصيل / البيان */}
                <div className="lg:col-span-5 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">التفاصيل / البيان</label>
                  <input
                    type="text"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="بيان العملية..."
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>

              </div>

              {/* شريط الأزرار والاختصارات الموحد داخل نافذة الإدخال */}
              <div className="pt-2">
                <div className="bg-slate-100 px-4 py-2.5 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* تفريغ .F3 / جديد */}
                    <button
                      type="button"
                      onClick={handleResetToNew}
                      className="h-8 px-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="تفريغ الحقول وسند جديد (F3)"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      <span>{editingTx ? 'إلغاء التعديل (F3)' : 'تفريغ .F3'}</span>
                    </button>

                    {/* طباعة .F6 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (lastCreatedTx) onViewReceipt(lastCreatedTx);
                        else if (editingTx) onViewReceipt(editingTx);
                        else window.print();
                      }}
                      className="h-8 px-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="طباعة السند (F6)"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>طباعة .F6</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* انهاء .ESC */}
                    {onClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-8 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="إغلاق الشاشة (ESC)"
                      >
                        <X className="w-3.5 h-3.5 text-slate-600" />
                        <span>انهاء .ESC</span>
                      </button>
                    )}

                    {/* موافق / حفظ .F9 / F2 */}
                    <button
                      type="button"
                      onClick={handleSave}
                      className={`h-8 px-6 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                        editingTx 
                          ? 'bg-amber-600 hover:bg-amber-700' 
                          : 'bg-[#0284c7] hover:bg-[#0369a1]'
                      }`}
                      title={editingTx ? 'حفظ وتعديل أصل الحركة (F9)' : 'تثبيت وقيد العملية المحاسبية (F9 / F2)'}
                    >
                      <CheckCircle2 className="w-4 h-4 text-white/90" />
                      <span>{editingTx ? 'حفظ التعديل .F9.' : 'موافق .F9.'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              النافذة 2: الحركات (سجل العمليات المدمج مع عامود الإجراءات: إلغاء | أصل الحركة | طباعة)
              ========================================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-3.5">
              
              {/* شريط الفلترة والبحث السريع داخل الحركات */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="بحث في الحركات برقم السند، العميل، البيان..."
                      className="w-full h-8 pr-8 pl-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-bold">النوع:</span>
                  <button
                    type="button"
                    onClick={() => setHistoryTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      historyTypeFilter === 'all' ? 'bg-[#0284c7] text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    الكل ({exchangeHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTypeFilter('buy')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      historyTypeFilter === 'buy' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    شراء
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTypeFilter('sell')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      historyTypeFilter === 'sell' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    بيع
                  </button>
                </div>
              </div>

              {/* بطاقات الإجماليات السريعة للحركات المفلترة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-emerald-50/60 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-emerald-900 font-bold">إجمالي شراء USD:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    ${formatWithCommas(historyTotals.totalBuyUSD)}
                  </span>
                </div>
                <div className="bg-sky-50/60 border border-sky-200 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-sky-900 font-bold">إجمالي بيع USD:</span>
                  <span className="font-mono font-black text-sky-700 text-sm">
                    ${formatWithCommas(historyTotals.totalSellUSD)}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-slate-700 font-bold">المقابل الإجمالي (IQD):</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {formatWithCommas(historyTotals.totalIQD)} د.ع
                  </span>
                </div>
              </div>

              {/* جدول الحركات المدمج مع عامود الإجراءات: إلغاء | أصل الحركة | طباعة */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">رقم السند</th>
                        <th className="py-2.5 px-3">التاريخ والوقت</th>
                        <th className="py-2.5 px-3">النوع</th>
                        <th className="py-2.5 px-3">التسوية</th>
                        <th className="py-2.5 px-3">المبلغ</th>
                        <th className="py-2.5 px-3">سعر الصرف</th>
                        <th className="py-2.5 px-3">الناتج (د.ع)</th>
                        <th className="py-2.5 px-3">البيان / الحساب</th>
                        <th className="py-2.5 px-3 text-center min-w-[210px]">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => {
                          const isBuy = item.exchangeOperationType === 'buy' || item.titleAr.includes('شراء');
                          const isCredit = item.exchangeSettlementType === 'credit' || item.transferSettlementType === 'credit';
                          const isCanceled = item.status === 'canceled';

                          return (
                            <tr 
                              key={item.id} 
                              className={`transition-colors ${
                                isCanceled ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span>{item.code}</span>
                                  {isCanceled && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-md font-bold">
                                      ملغى
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                                {item.createdAt ? item.createdAt.slice(0, 16) : '-'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  isCanceled 
                                    ? 'bg-slate-200 text-slate-600'
                                    : isBuy ? 'bg-emerald-100 text-emerald-900' : 'bg-sky-100 text-sky-900'
                                }`}>
                                  {isBuy ? 'شراء' : 'بيع'} {item.currency}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  isCredit ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'
                                }`}>
                                  {isCredit ? 'آجل' : 'نقدي'}
                                </span>
                              </td>
                              <td className={`py-2.5 px-3 font-mono font-bold whitespace-nowrap ${isCanceled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {formatWithCommas(item.amount)} {item.currency}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {formatWithCommas(item.exchangeRate || 0)}
                              </td>
                              <td className={`py-2.5 px-3 font-mono font-bold whitespace-nowrap ${isCanceled ? 'line-through text-slate-400' : 'text-emerald-800'}`}>
                                {formatWithCommas(item.targetAmount || 0)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[170px]" title={item.notes || ''}>
                                {item.accountName || item.senderName || item.notes || '-'}
                              </td>

                              {/* عامود الإجراءات: [ إلغاء | أصل الحركة | طباعة ] */}
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  
                                  {/* 1. إجراء: إلغاء */}
                                  {isCanceled ? (
                                    <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-200">
                                      ملغى
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancellingTx(item);
                                        setCancelReasonInput('');
                                      }}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/80 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                      title="إلغاء حركة الصرافة وعكس الأثر المالي"
                                    >
                                      <Ban className="w-3 h-3 text-rose-600" />
                                      <span>إلغاء</span>
                                    </button>
                                  )}

                                  {/* 2. إجراء: أصل الحركة (يعيد المستخدم للقيد للتعديل) */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenOriginalTransaction(item)}
                                    className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 hover:text-sky-950 border border-sky-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    title="العودة للقيد وإجراء التعديلات عليه"
                                  >
                                    <FileText className="w-3 h-3 text-sky-600" />
                                    <span>أصل الحركه</span>
                                  </button>

                                  {/* 3. إجراء: طباعة */}
                                  <button
                                    type="button"
                                    onClick={() => onViewReceipt(item)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    title="طباعة سند الصرافة"
                                  >
                                    <Printer className="w-3 h-3 text-slate-600" />
                                    <span>طباعة</span>
                                  </button>

                                </div>
                              </td>

                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            لا توجد حركات مطابقة للبحث أو التصفية الحالية.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* شريط الإجراءات في نافذة الحركات */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTx(null);
                    setActiveTab('exchange');
                  }}
                  className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>العودة لإنشاء سند صرافة جديد</span>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    إغلاق (ESC)
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* =========================================================================
          نافذة منبثقة: تأكيد إلغاء حركة الصرافة وعكس القيد المحاسبي
          ========================================================================= */}
      {cancellingTx && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setCancellingTx(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-rose-300 shadow-2xl w-full max-w-md overflow-hidden text-slate-800"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* ترويسة نافذة الإلغاء */}
            <div className="bg-rose-600 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-rose-100">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">تأكيد إلغاء حركة الصرافة</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingTx(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* تفاصيل تأكيد الإلغاء */}
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700 font-medium leading-relaxed">
                هل أنت متأكد من إلغاء حركة الصرافة رقم <strong className="font-mono text-slate-900">({cancellingTx.code})</strong>؟
              </p>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1.5 font-medium text-rose-950">
                <div className="flex justify-between">
                  <span>المبلغ:</span>
                  <span className="font-bold font-mono">{formatWithCommas(cancellingTx.amount)} {cancellingTx.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>الناتج بالدينار:</span>
                  <span className="font-bold font-mono">{formatWithCommas(cancellingTx.targetAmount || 0)} د.ع</span>
                </div>
                <div className="flex justify-between text-[11px] text-rose-800 pt-1 border-t border-rose-200/80">
                  <span>الأثر المالي:</span>
                  <span>سيتم عكس المبلغ وإرجاع الرصيد في الصندوق أو الحساب تلقائياً.</span>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-slate-700">سبب الإلغاء (اختياري):</label>
                <input
                  type="text"
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="اكتب سبب إلغاء السند هنا..."
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* أزرار تأكيد الإلغاء */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>تأكيد الإلغاء وعكس القيد</span>
              </button>

              <button
                type="button"
                onClick={() => setCancellingTx(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تراجع (ESC)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
