import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  Building2, 
  Calendar, 
  User, 
  FileText, 
  Search, 
  HandCoins, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ChevronDown, 
  Clock, 
  AlertCircle,
  Wallet,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { 
  TransactionRecord, 
  AccountItem, 
  CurrencyCode 
} from '../../../types';
import { SearchableSelect } from '../../common/SearchableSelect';

interface WebDepositWithdrawalScreenProps {
  isOpen?: boolean;
  isEmbedded?: boolean;
  onClose?: () => void;
  accounts: AccountItem[];
  transactions: TransactionRecord[];
  onCreateTransaction: (newTx: TransactionRecord) => void;
  onViewReceipt: (tx: TransactionRecord) => void;
  companyName?: string;
  systemUser?: string;
}

export const WebDepositWithdrawalScreen: React.FC<WebDepositWithdrawalScreenProps> = ({
  isOpen = true,
  isEmbedded = false,
  onClose,
  accounts,
  transactions,
  onCreateTransaction,
  onViewReceipt,
  companyName: initialCompanyName = 'شركة الصرافة والتحويل المالي',
  systemUser: initialSystemUser = 'حيدر',
}) => {
  // دالة مساعدة لتنسيق الأرقام مع الفواصل
  const formatWithCommas = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null || val === '') return '';
    const str = String(val);
    const clean = str.replace(/,/g, '').replace(/[^0-9.]/g, '');
    if (!clean) return '';
    const parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const getCurrencyNameAr = (code: CurrencyCode): string => {
    switch (code) {
      case 'IQD': return 'دينار عراقي';
      case 'USD': return 'دولار أمريكي';
      case 'EUR': return 'يورو';
      case 'AED': return 'درهم إماراتي';
      case 'TRY': return 'ليرة تركية';
      case 'GBP': return 'باون استرليني';
      default: return code;
    }
  };

  // الحالة الرئيسية لحقول النموذج (مطابقة تماماً للصورة)
  const [company, setCompany] = useState(initialCompanyName);
  const [date, setDate] = useState(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  });
  const [organizer, setOrganizer] = useState(initialSystemUser || 'حيدر');

  // العملة ونوع العملية والمبلغ
  const [currency, setCurrency] = useState<CurrencyCode>('IQD');
  const [operationType, setOperationType] = useState<'deposit' | 'withdrawal'>('deposit'); // 'deposit' = قبض (إيداع), 'withdrawal' = صرف (سحب)
  const [amountStr, setAmountStr] = useState<string>('');

  // الحساب المالي والتفاصيل
  const [accountQuery, setAccountQuery] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [details, setDetails] = useState<string>('');

  // الصندوق المالي المربوط بالحركة (اختياري)
  const [selectedCashBoxId, setSelectedCashBoxId] = useState<string>('');

  // إشعار النجاح والسند الأخير
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [lastCreatedTx, setLastCreatedTx] = useState<TransactionRecord | null>(null);

  // استخراج حسابات الصناديق النقدية المتاحة حصراً (الخزائن مستبعدة تماماً وفق القاعدة المحاسبية)
  const cashBoxes = useMemo(() => {
    return accounts.filter(a => a.type === 'cash_box');
  }, [accounts]);

  // تعيين الصندوق النقدي التلقائي
  useEffect(() => {
    if (cashBoxes.length > 0 && !selectedCashBoxId) {
      setSelectedCashBoxId(cashBoxes[0].id);
    }
  }, [cashBoxes, selectedCashBoxId]);

  // دالة توحيد وتطبيع النصوص العربية للبحث الدقيق عن أسماء العملاء أينما ورد الحرف
  const normalizeForSearch = (str: string) => {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/\s*\(.*?\)/g, ' ')
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

  // تصفية الحسابات عند البحث في حقل "اسم الحساب" (مطابقة الحرف أينما وجد في الاسم، مع استبعاد الصناديق والخزائن)
  const filteredAccounts = useMemo(() => {
    const q = accountQuery.trim();
    if (!q) {
      return accounts.filter(acc => acc.type !== 'cash_box' && acc.type !== 'vault');
    }
    const normQ = normalizeForSearch(q);
    const qDigits = q.replace(/\D/g, '');

    return accounts.filter(acc => {
      if (acc.type === 'cash_box' || acc.type === 'vault') return false;
      const normName = normalizeForSearch(acc.name);
      const normCity = normalizeForSearch(acc.city || '');
      const rawPhone = acc.phone ? acc.phone.replace(/\D/g, '') : '';

      return (
        normName.includes(normQ) ||
        (qDigits.length > 0 && rawPhone.includes(qDigits)) ||
        normCity.includes(normQ)
      );
    });
  }, [accounts, accountQuery]);

  // الحساب المختار حالياً
  const currentAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  // تحديد أول حساب تلقائياً إذا كان الاستعلام يطابق
  useEffect(() => {
    if (!selectedAccountId && filteredAccounts.length > 0 && accountQuery) {
      const exact = filteredAccounts.find(a => a.name.trim() === accountQuery.trim());
      if (exact) setSelectedAccountId(exact.id);
    }
  }, [accountQuery, filteredAccounts, selectedAccountId]);

  // حساب الأرصدة قبل وبعد العملية
  const numericAmount = useMemo(() => {
    const clean = amountStr.replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }, [amountStr]);

  // الصندوق النقدي المختار (محصور في نوع الصندوق، والخزنة مستبعدة تماماً)
  const currentCashBox = useMemo(() => {
    if (selectedCashBoxId) {
      const found = cashBoxes.find(a => a.id === selectedCashBoxId);
      if (found) return found;
    }
    return cashBoxes[0] || null;
  }, [selectedCashBoxId, cashBoxes]);

  // تفريغ الحقول (F3)
  const handleReset = () => {
    setAmountStr('');
    setAccountQuery('');
    setSelectedAccountId('');
    setDetails('');
    setIsAccountDropdownOpen(false);
  };

  // تأكيد وحفظ السند (F9)
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!numericAmount || numericAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (!accountQuery.trim()) {
      alert('يرجى كتابة أو اختيار اسم الحساب (العميل)');
      return;
    }

    // إيجاد الحساب أو إنشاؤه
    let finalAccountId = selectedAccountId;
    let finalAccountName = accountQuery.trim();

    if (currentAccount) {
      finalAccountId = currentAccount.id;
      finalAccountName = currentAccount.name;
    }

    const isDeposit = operationType === 'deposit';
    const txType = isDeposit ? 'cash_in' : 'cash_out';
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeStr}`;

    const defaultTitle = isDeposit 
      ? `سند إيداع نقدي (${finalAccountName})`
      : `سند سحب وصرف نقدي (${finalAccountName})`;

    const finalNotes = details.trim()
      ? `${details.trim()} | بواسطة: ${organizer}`
      : `حركة ${isDeposit ? 'قبض نقدي من العميل' : 'صرف نقدي للعميل'} | منظم القيد: ${organizer}`;

    const boxDisplayName = currentCashBox?.name || 'الصندوق الرئيسي (كاش)';

    const newTxRecord: TransactionRecord = {
      id: `tx-voucher-${Date.now()}`,
      code: randomCode,
      type: txType,
      titleAr: defaultTitle,
      // عند القبض: العميل هو المسلم (دائن) والصندوق هو المستلم (مدين)
      // عند الصرف: الصندوق هو المسلم (دائن) والعميل هو المستلم (مدين)
      senderName: isDeposit ? finalAccountName : boxDisplayName,
      receiverName: isDeposit ? boxDisplayName : finalAccountName,
      senderPhone: currentAccount?.phone || '',
      receiverPhone: currentAccount?.phone || '',
      accountId: finalAccountId || undefined,
      accountName: finalAccountName,
      amount: numericAmount,
      currency: currency,
      fee: 0,
      transferSettlementType: 'cash',
      settlementCurrency: currency,
      settlementAmount: numericAmount,
      cashBoxId: currentCashBox?.id,
      cashBoxName: boxDisplayName,
      status: 'completed',
      notes: finalNotes,
      createdBy: organizer,
      createdAt: dateFormatted,
      completedAt: dateFormatted,
    };

    onCreateTransaction(newTxRecord);
    setLastCreatedTx(newTxRecord);
    setShowSuccessBanner(true);

    // تصفير حقول الإدخال لتجهيز سند جديد
    setAmountStr('');
    setDetails('');
  };

  // دعم اختصارات لوحة المفاتيح المعتادة (F9, F6, F3, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (lastCreatedTx) {
          onViewReceipt(lastCreatedTx);
        } else {
          alert('يرجى حفظ السند أولاً للتمكن من طباعته');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, numericAmount, accountQuery, selectedAccountId, currency, operationType, lastCreatedTx, organizer, company, details]);

  if (!isOpen && !isEmbedded) return null;

  const cardContent = (
    <div 
      className={`relative w-full ${
        isEmbedded 
          ? 'max-w-full xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto bg-white rounded-3xl shadow-xl border-2 border-sky-400 overflow-hidden text-slate-800' 
          : 'w-full max-w-[96vw] lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1500px] bg-white rounded-3xl shadow-2xl border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.25)] overflow-hidden my-auto text-slate-800'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* =========================================================================
          الترويسة الزرقاء السماوية متطابقة مع شاشة استعلام الحوالات
            ========================================================================= */}
        <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-sky-200 border border-white/20">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  {operationType === 'deposit' ? 'اضافة قبض العملاء' : 'اضافة صرف العملاء'}
                </h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  operationType === 'deposit'
                    ? 'bg-sky-400/30 text-sky-100 border-sky-300/40'
                    : 'bg-rose-400/25 text-rose-100 border-rose-300/30'
                }`}>
                  {operationType === 'deposit' ? 'قبض (إيداع)' : 'صرف (سحب)'}
                </span>
              </div>
              <p className="text-[11px] text-sky-100/80">
                {operationType === 'deposit'
                  ? 'تسجيل سندات القبض النقدي (إيداع) لحسابات العملاء في الصندوق'
                  : 'تسجيل سندات الصرف النقدي (سحب) لحسابات العملاء من الصندوق'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* اختيار نمط العملية في الترويسة أعلى الصفحة */}
            <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/15 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setOperationType('deposit')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  operationType === 'deposit'
                    ? 'bg-sky-300 text-slate-950 shadow-sm font-black'
                    : 'text-sky-100/80 hover:text-white hover:bg-white/10'
                }`}
                title="تحديد العملية كـ قبض (إيداع)"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>قبض (إيداع)</span>
              </button>
              <button
                type="button"
                onClick={() => setOperationType('withdrawal')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  operationType === 'withdrawal'
                    ? 'bg-rose-400 text-slate-950 shadow-sm font-black'
                    : 'text-sky-100/80 hover:text-white hover:bg-white/10'
                }`}
                title="تحديد العملية كـ صرف (سحب)"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                <span>صرف (سحب)</span>
              </button>
            </div>

            {/* زر الإغلاق ESC */}
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
              }}
              title="إغلاق وإنهاء (ESC)"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* جسم النافذة ومكونات الإدخال */}
        <div className="p-4 sm:p-5 max-h-[85vh] overflow-y-auto space-y-3.5 bg-[#fbfdfc]">

          {/* بانر النجاح بعد الحفظ */}
          {showSuccessBanner && lastCreatedTx && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">
                    تم تسجيل سند {lastCreatedTx.type === 'cash_in' ? 'القبض (الإيداع)' : 'الصرف (السحب)'} بنجاح!
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    رقم السند: <span className="font-mono font-bold text-slate-900">#{lastCreatedTx.code}</span> • الحساب: <span className="font-bold text-slate-900">{lastCreatedTx.accountName}</span> • المبلغ: <span className="font-mono font-bold text-slate-900">{lastCreatedTx.amount.toLocaleString()} {getCurrencyNameAr(lastCreatedTx.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewReceipt(lastCreatedTx)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة السند .F6</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessBanner(false)}
                  className="w-6 h-6 rounded-lg text-emerald-700 hover:bg-emerald-100 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              السطر الأول من النموذج: الشركة | الصندوق النقدي | التاريخ | منظم القيد
              القاعدة المحاسبية: الصندوق النقدي فقط، الخزائن مستبعدة تماماً
              ========================================================================= */}
          <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-center">
              
              {/* حقل الشركة */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>الشركة:</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="اسم الشركة أو الفرع"
                  className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner transition-colors"
                />
              </div>

              {/* حقل الصندوق النقدي المربوط بالحركة (حصراً حسابات الصندوق، والخزائن مستبعدة) */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-600" />
                    <span>الصندوق النقدي:</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    كاش فقط
                  </span>
                </label>
                {cashBoxes.length > 0 ? (
                  <select
                    value={selectedCashBoxId || cashBoxes[0].id}
                    onChange={(e) => setSelectedCashBoxId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner transition-colors cursor-pointer"
                  >
                    {cashBoxes.map(cb => (
                      <option key={cb.id} value={cb.id}>
                        {cb.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-amber-50/70 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 flex items-center justify-between">
                    <span>الصندوق الرئيسي (افتراضي)</span>
                    <span className="text-[10px] bg-amber-200/60 px-1 rounded">نقدية</span>
                  </div>
                )}
              </div>

              {/* حقل التاريخ */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>التاريخ:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none shadow-inner transition-colors text-center"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>

              {/* حقل منظم القيد */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>منظم القيد:</span>
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="اسم منظم السند"
                  className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner transition-colors"
                />
              </div>

            </div>
          </div>

          {/* =========================================================================
              السطر الثاني: العملة | نوع العملية | المبلغ (مطابق للصورة تماماً)
              ========================================================================= */}
          <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-center">
              
              {/* العملة */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-sky-600" />
                  <span>العملة:</span>
                </label>
                <SearchableSelect
                  value={currency}
                  onChange={(val) => setCurrency(val as CurrencyCode)}
                  options={[
                    { value: 'IQD', label: 'دينار عراقي (IQD)' },
                    { value: 'USD', label: 'دولار أمريكي (USD)' },
                    { value: 'EUR', label: 'يورو (EUR)' },
                    { value: 'AED', label: 'درهم إماراتي (AED)' },
                    { value: 'TRY', label: 'ليرة تركية (TRY)' },
                    { value: 'GBP', label: 'باون استرليني (GBP)' },
                  ]}
                  triggerClassName="py-2"
                  searchPlaceholder="بحث في العملات..."
                />
              </div>

              {/* نوع العملية: ثابتة وفق ما تم اختياره من أعلى الصفحة */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <HandCoins className="w-3.5 h-3.5 text-emerald-700" />
                  <span>نوع العملية:</span>
                </label>
                <div
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-bold shadow-2xs select-none flex items-center justify-between cursor-default transition-all ${
                    operationType === 'deposit'
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50/90 border-rose-300 text-rose-950'
                  }`}
                  title="نوع العملية محدد وثابت وفق الاختيار من أعلى الصفحة"
                >
                  <span className="flex items-center gap-1.5 font-black">
                    {operationType === 'deposit' ? (
                      <>
                        <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                        <span>قبض (ايداع)</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-600" />
                        <span>صرف (سحب)</span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ثابتة وفق أعلى الصفحة
                  </span>
                </div>
              </div>

              {/* المبلغ */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-sky-600" />
                    <span>المبلغ:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currency === 'IQD' ? 'د.ع' : '$'}
                  </span>
                </label>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => {
                    const formatted = formatWithCommas(e.target.value);
                    setAmountStr(formatted);
                  }}
                  placeholder="0.000"
                  className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-sm font-mono font-black text-right text-slate-900 focus:outline-none shadow-inner transition-colors"
                />
              </div>

            </div>
          </div>

          {/* =========================================================================
              السطر الثالث / المنطقة السفلية: اسم الحساب | التفاصيل (مطابق للصورة)
              ========================================================================= */}
          <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              
              {/* حقل اسم الحساب بدون رصيد أو تفاصيل مالية زائدة */}
              <div className="sm:col-span-6 relative">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>اسم الحساب (العميل):</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={accountQuery}
                    onChange={(e) => {
                      setAccountQuery(e.target.value);
                      setIsAccountDropdownOpen(true);
                      if (selectedAccountId && e.target.value !== currentAccount?.name) {
                        setSelectedAccountId('');
                      }
                    }}
                    onFocus={() => setIsAccountDropdownOpen(true)}
                    placeholder="اكتب اسم العميل أو اختر من الدليل..."
                    className="w-full pl-8 pr-3 py-2 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner transition-colors"
                  />
                  <ChevronDown 
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 cursor-pointer hover:text-slate-600" 
                  />
                </div>

                {/* القائمة المنسدلة لاختيار الحساب - عرض أسماء الحسابات بدون تفاصيل الأرصدة */}
                {isAccountDropdownOpen && (
                  <div className="absolute z-20 top-full mt-1 right-0 left-0 bg-[#fffef0] border border-slate-300 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-200">
                    {filteredAccounts.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        لا توجد حسابات مطابقة. سيتم اعتماد الاسم كمدفوع/مقبوض مباشر.
                      </div>
                    ) : (
                      filteredAccounts.map((acc) => {
                        const isMatch = selectedAccountId === acc.id;
                        return (
                          <div
                            key={acc.id}
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setAccountQuery(acc.name);
                              setIsAccountDropdownOpen(false);
                            }}
                            className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isMatch ? 'bg-[#0284c7] text-white font-bold' : 'hover:bg-sky-50 text-slate-800'
                            }`}
                          >
                            <span className="font-bold">{acc.name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* حقل التفاصيل والبيان */}
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  <span>التفاصيل (البيان / سبب الحركة):</span>
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="اكتب تفاصيل القيد، سبب الإيداع أو الصرف، أو رقم الوصل الخارجي..."
                  className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-medium text-slate-800 focus:outline-none shadow-inner resize-none transition-colors"
                />
              </div>

            </div>

            {/* شريط توضيح القيد المحاسبي المولد للسند */}
            <div className="bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-sky-600" />
                  <span>القيد المحاسبي التلقائي للسند:</span>
                </span>
                {operationType === 'deposit' ? (
                  <span className="font-mono text-slate-800 font-bold bg-white px-2.5 py-1 rounded border border-slate-200 text-xs flex items-center gap-1.5 shadow-2xs">
                    <span>من حـ/ {currentCashBox?.name || 'الصندوق'}</span>
                    <span className="text-rose-700 font-black bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[11px]">(مدين)</span>
                    <span className="text-slate-400">◄</span>
                    <span>إلى حـ/ {currentAccount?.name || accountQuery || 'العميل'}</span>
                    <span className="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">(دائن)</span>
                  </span>
                ) : (
                  <span className="font-mono text-slate-800 font-bold bg-white px-2.5 py-1 rounded border border-slate-200 text-xs flex items-center gap-1.5 shadow-2xs">
                    <span>من حـ/ {currentAccount?.name || accountQuery || 'العميل'}</span>
                    <span className="text-rose-700 font-black bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[11px]">(مدين)</span>
                    <span className="text-slate-400">◄</span>
                    <span>إلى حـ/ {currentCashBox?.name || 'الصندوق'}</span>
                    <span className="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">(دائن)</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>الخزنة معزولة 100% ولا تسجل عليها أي حركة</span>
              </div>
            </div>

          </div>

          {/* =========================================================================
              أزرار العمليات السفلية (F9, F6, F3, ESC) مطابقة للشاشات الأصلية والصورة
              ========================================================================= */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              <div className="flex items-center gap-2">
                {/* زر إفراغ الحقول -F3- */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="مسح وإفراغ الحقول (F3)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>تفريغ .F3</span>
                </button>

                {/* زر طباعة السند -F6- */}
                <button
                  type="button"
                  onClick={() => {
                    if (lastCreatedTx) onViewReceipt(lastCreatedTx);
                    else alert('يرجى حفظ السند أولاً ثم الضغط على طباعة');
                  }}
                  className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="طباعة سند القبض / الصرف (F6)"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>طباعة .F6</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* زر انهاء -ESC- */}
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="إنهاء وإغلاق الشاشة (ESC)"
                >
                  <X className="w-3.5 h-3.5 text-slate-600" />
                  <span>انهاء .ESC</span>
                </button>

                {/* زر موافق -F9- */}
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="h-8 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
                  title="تثبيت وحفظ السند (F9)"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-200" />
                  <span>موافق .F9.</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
  );

  if (isEmbedded) {
    return (
      <div className="h-full min-h-full w-full flex items-center justify-center p-3 sm:p-6 overflow-y-auto text-slate-800" dir="rtl">
        <div className="my-auto w-full flex items-center justify-center">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" 
      dir="rtl"
      onClick={() => {
        if (onClose) onClose();
      }}
    >
      {cardContent}
    </div>
  );
};
