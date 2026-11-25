import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Printer, 
  Building2, 
  Calendar, 
  Search, 
  Scale, 
  FileText, 
  Coins, 
  Wallet,
  Vault,
  RotateCcw
} from 'lucide-react';
import { 
  TransactionRecord, 
  AccountItem, 
  CurrencyCode 
} from '../../../types';
import { SearchableSelect } from '../../common/SearchableSelect';

interface WebDoubleEntryScreenProps {
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

export type EntryNature = 'debit' | 'credit';

export const WebDoubleEntryScreen: React.FC<WebDoubleEntryScreenProps> = ({
  isOpen = true,
  isEmbedded = false,
  onClose,
  accounts,
  transactions: _transactions,
  onCreateTransaction,
  onViewReceipt,
  companyName: initialCompanyName = 'شركة الصرافة والتحويل المالي',
  systemUser: initialSystemUser = 'محمد علي الباوي',
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

  // الحقول الأساسية للنافذة
  const [company, setCompany] = useState(initialCompanyName);
  const [date, setDate] = useState(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  });
  const [currency, setCurrency] = useState<CurrencyCode>('IQD');
  const [amountStr, setAmountStr] = useState<string>('');
  const [details, setDetails] = useState<string>('');

  // خيار طبيعة قيد الحساب الأيمن (واحد فقط مشترك في السطر: نوع العملة | خيار دائن مدين | المبلغ)
  // إذا اختار "مدين": يكون الطرف الأيمن مديناً والأيسر دائناً.
  // إذا اختار "دائن": يكون الطرف الأيمن دائناً والأيسر مديناً.
  const [rightSideNature, setRightSideNature] = useState<EntryNature>('debit');

  const handleToggleNature = (nature: EntryNature) => {
    setRightSideNature(nature);
  };

  // الحسابات المختارة
  const [rightAccountId, setRightAccountId] = useState<string>('');
  const [leftAccountId, setLeftAccountId] = useState<string>('');
  const [rightSearch, setRightSearch] = useState<string>('');
  const [leftSearch, setLeftSearch] = useState<string>('');

  // إشعار النجاح
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [lastCreatedTx, setLastCreatedTx] = useState<TransactionRecord | null>(null);

  // اختيار أولي تلقائي للحسابات إن لم تكن مختارة
  useEffect(() => {
    if (accounts.length > 0) {
      if (!rightAccountId) {
        const found = accounts.find(a => a.name.includes('الباز')) || accounts[0];
        if (found) setRightAccountId(found.id);
      }
      if (!leftAccountId) {
        const found = accounts.find(a => a.name.includes('بيروت') || a.name.includes('الرافدين')) || accounts[1] || accounts[0];
        if (found) setLeftAccountId(found.id);
      }
    }
  }, [accounts, rightAccountId, leftAccountId]);

  // استماع لاختصارات لوحة المفاتيح: F9 للموافقة و ESC للإنهاء
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, amountStr, rightAccountId, leftAccountId, currency, details, company, date, rightSideNature]);

  // الحساب المحدد في الطرف الأيمن والأيسر
  const selectedRightAccount = useMemo(() => {
    return accounts.find(a => a.id === rightAccountId);
  }, [accounts, rightAccountId]);

  const selectedLeftAccount = useMemo(() => {
    return accounts.find(a => a.id === leftAccountId);
  }, [accounts, leftAccountId]);

  // فلترة قائمة الحساب الأيمن
  const filteredRightAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (rightSearch.trim()) {
        const q = rightSearch.trim().toLowerCase();
        return acc.name.toLowerCase().includes(q) || acc.phone.includes(q) || (acc.city && acc.city.toLowerCase().includes(q));
      }
      return true;
    });
  }, [accounts, rightSearch]);

  // فلترة قائمة الحساب الأيسر
  const filteredLeftAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (leftSearch.trim()) {
        const q = leftSearch.trim().toLowerCase();
        return acc.name.toLowerCase().includes(q) || acc.phone.includes(q) || (acc.city && acc.city.toLowerCase().includes(q));
      }
      return true;
    });
  }, [accounts, leftSearch]);

  // معالجة تغيير المبلغ
  const handleAmountChange = (val: string) => {
    const numeric = val.replace(/,/g, '').replace(/[^0-9.]/g, '');
    setAmountStr(numeric);
  };

  const parsedAmount = parseFloat(amountStr) || 0;

  // إرسال وحفظ القيد اليومي المزدوج
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!parsedAmount || parsedAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح للقيد اليومي');
      return;
    }

    if (!rightAccountId || !leftAccountId) {
      alert('يرجى تحديد كلا الحسابين في القيد المزدوج');
      return;
    }

    if (rightAccountId === leftAccountId) {
      alert('لا يمكن اختيار نفس الحساب لطرفي القيد المزدوج');
      return;
    }

    // تحديد الحساب المدين والدائن بناءً على طبيعة القيد المختارة
    const debitAccount = rightSideNature === 'debit' ? selectedRightAccount : selectedLeftAccount;
    const creditAccount = rightSideNature === 'credit' ? selectedRightAccount : selectedLeftAccount;

    if (!debitAccount || !creditAccount) {
      alert('خطأ في استرجاع بيانات الحسابين');
      return;
    }

    const now = new Date();
    const entrySeq = Math.floor(100000 + Math.random() * 900000);
    const code = `JV-${entrySeq}`;

    const finalDetails = details.trim() || `قيد يومية مزدوج من حساب (${creditAccount.name}) إلى حساب (${debitAccount.name})`;

    const newTx: TransactionRecord = {
      id: `tx-jv-${Date.now()}`,
      code: code,
      type: 'journal',
      titleAr: 'قيد يومية مزدوج',
      senderName: creditAccount.name, // الطرف الدائن
      senderPhone: creditAccount.phone,
      receiverName: debitAccount.name, // الطرف المدين
      receiverPhone: debitAccount.phone,
      accountId: debitAccount.id,
      accountName: debitAccount.name,
      amount: parsedAmount,
      currency: currency,
      fee: 0,
      commissionType: 'none',
      transferSettlementType: 'credit',
      settlementCurrency: currency,
      settlementAmount: parsedAmount,
      status: 'completed',
      createdBy: initialSystemUser,
      notes: `${finalDetails} [التاريخ: ${date}] [الشركة: ${company}]`,
      createdAt: now.toISOString().replace('T', ' ').slice(0, 16),
      completedAt: now.toISOString().replace('T', ' ').slice(0, 16),
    };

    onCreateTransaction(newTx);
    setLastCreatedTx(newTx);
    setActionSuccessNotice(`تم تثبيت وترحيل القيد اليومي رقم #${code} بنجاح!`);

    // تفريغ الحقول لقيد جديد
    setAmountStr('');
    setDetails('');
  };


  if (!isOpen && !isEmbedded) return null;

  const cardContent = (
    <div 
      className={`relative w-full flex flex-col ${
        isEmbedded 
          ? 'mx-auto bg-white rounded-3xl shadow-xl border-2 border-sky-400 overflow-hidden text-slate-800' 
          : 'w-full max-w-[96vw] lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1500px] bg-white rounded-3xl shadow-2xl border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.25)] overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150'
      }`}
      style={{ height: '533px', width: '750px', maxWidth: '100%' }}
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* =========================================================================
          شريط رأس النافذة (التدرج الأزرق السماوي المعتمد)
          ========================================================================= */}
      <div 
        className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 flex items-center justify-between shadow-sm shrink-0 h-[36px] w-[750px] max-w-full"
        style={{ height: '36px', width: '750px' }}
      >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-sky-200 border border-white/20 shadow-inner">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                <span>اضافة قيد يومية مزدوج</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="إغلاق النافذة (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            جسم النافذة الرئيسي - الحقول مصفوفة مباشرة فوق بعضها وملاصقة لقائمة الحسابات
            ========================================================================= */}
        <div className="p-3.5 bg-[#f8fafc] flex flex-col space-y-2.5 flex-1 overflow-y-auto">
          
          {/* إشعار نجاح الحركة إن وجد */}
          {actionSuccessNotice && (
            <div className="p-2.5 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between text-xs text-sky-950 shadow-2xs animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-bold">{actionSuccessNotice}</span>
              </div>
              <div className="flex items-center gap-2">
                {lastCreatedTx && (
                  <button
                    onClick={() => onViewReceipt(lastCreatedTx)}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Printer className="w-3 h-3" />
                    <span>طباعة سند القيد</span>
                  </button>
                )}
                <button 
                  onClick={() => setActionSuccessNotice(null)}
                  className="text-sky-700 hover:text-sky-950 cursor-pointer p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}


          {/* =========================================================================
              السطر الأول: التاريخ + اسم الشركة
              ========================================================================= */}
          <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* التاريخ */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800 min-w-[70px] text-right flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>التاريخ:</span>
                </label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full h-8 px-3 text-xs font-bold font-mono text-slate-800 bg-[#fffef0] border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              {/* اسم الشركة */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800 min-w-[80px] text-right flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>اسم الشركة:</span>
                </label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="اسم الشركة"
                    className="w-full h-8 px-3 text-xs font-bold text-slate-800 bg-[#fffef0] border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              السطر الثاني في صف واحد بالضبط حسب طلب المستخدم:
              نوع العملة    دائن مدين    المبلغ
              ========================================================================= */}
          <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs shrink-0">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              
              {/* 1. نوع العملة */}
              <div className="flex items-center gap-2 w-full md:w-auto md:flex-1">
                <label className="text-xs font-bold text-slate-800 min-w-[70px] text-right flex items-center gap-1 shrink-0">
                  <Coins className="w-3.5 h-3.5 text-sky-600" />
                  <span>نوع العملة:</span>
                </label>
                <div className="relative flex-1">
                  <SearchableSelect
                    value={currency}
                    onChange={(val) => setCurrency(val as CurrencyCode)}
                    options={[
                      { value: 'IQD', label: 'دينار عراقي' },
                      { value: 'USD', label: 'دولار أمريكي' },
                      { value: 'EUR', label: 'يورو' },
                      { value: 'AED', label: 'درهم إماراتي' },
                      { value: 'TRY', label: 'ليرة تركية' },
                      { value: 'GBP', label: 'باون استرليني' },
                    ]}
                    triggerClassName="h-8 py-1"
                    searchPlaceholder="بحث في العملات..."
                  />
                </div>
              </div>

              {/* 2. خيار دائن / مدين (واحد فقط في المنتصف بجانب المبلغ ونوع العملة) */}
              <div className="flex items-center justify-center shrink-0">
                <div className="inline-flex items-center gap-3 px-3.5 py-1 bg-[#ede8e1] border border-slate-400 rounded select-none shadow-2xs">
                  {/* خيار دائن (أخضر) */}
                  <label 
                    onClick={() => handleToggleNature('credit')}
                    className={`flex items-center gap-1.5 cursor-pointer text-xs font-black transition-colors ${
                      rightSideNature === 'credit' ? 'text-emerald-800' : 'text-slate-700 hover:text-emerald-700'
                    }`}
                  >
                    <span>دائن</span>
                    <span className="w-3.5 h-3.5 rounded-full border border-emerald-700 flex items-center justify-center bg-white">
                      {rightSideNature === 'credit' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </span>
                  </label>

                  {/* خيار مدين (أحمر) */}
                  <label 
                    onClick={() => handleToggleNature('debit')}
                    className={`flex items-center gap-1.5 cursor-pointer text-xs font-black transition-colors ${
                      rightSideNature === 'debit' ? 'text-rose-800' : 'text-slate-700 hover:text-rose-700'
                    }`}
                  >
                    <span>مدين</span>
                    <span className="w-3.5 h-3.5 rounded-full border border-rose-700 flex items-center justify-center bg-white">
                      {rightSideNature === 'debit' && (
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* 3. المبلغ */}
              <div className="flex items-center gap-2 w-full md:w-auto md:flex-1">
                <label className="text-xs font-bold text-slate-800 min-w-[50px] text-right flex items-center gap-1 shrink-0">
                  <Wallet className="w-3.5 h-3.5 text-sky-600" />
                  <span>المبلغ:</span>
                </label>
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={amountStr ? formatWithCommas(amountStr) : ''}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.000"
                    className="w-full h-8 pl-3 pr-16 text-sm font-black font-mono text-slate-900 bg-[#fffef0] border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-inner text-left"
                    dir="ltr"
                  />
                  <span className="absolute right-2 text-[10px] font-bold text-slate-500 pointer-events-none">
                    {getCurrencyNameAr(currency)}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* =========================================================================
              السطر الثالث: عامودا الحسابات (يكونان فوق التفاصيل وملاصقين لها تماماً دون بروز للخارج)
              ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
            
            {/* -------------------------------------------------------------
                العمود الأيمن: الحساب 
                ------------------------------------------------------------- */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-black ${rightSideNature === 'debit' ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {rightSideNature === 'debit' ? 'الحساب المدين (منه / عليه):' : 'الحساب الدائن (إليه / له):'}
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  rightSideNature === 'debit' 
                    ? 'text-rose-700 bg-rose-50 border-rose-200' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  {rightSideNature === 'debit' ? 'الطرف المدين' : 'الطرف الدائن'}
                </span>
              </div>

              {/* مربع البحث عن الحساب */}
              <div className="relative">
                <input
                  type="text"
                  value={rightSearch}
                  onChange={(e) => setRightSearch(e.target.value)}
                  placeholder="بحث عن الحساب..."
                  className="w-full h-7 pl-8 pr-2.5 text-xs font-bold text-slate-800 bg-[#fffef0] border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-inner"
                />
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
              </div>

              {/* قائمة الحسابات بارتفاع محدد وملاصق تماماً */}
              <div className="h-[145px] overflow-y-auto border border-slate-300 rounded-lg bg-[#fffef0] divide-y divide-slate-200 shadow-inner">
                {filteredRightAccounts.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    لا يوجد حساب مطابق للبحث
                  </div>
                ) : (
                  filteredRightAccounts.map(acc => {
                    const isSelected = acc.id === rightAccountId;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setRightAccountId(acc.id)}
                        className={`px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#0284c7] text-white' 
                            : 'text-slate-800 hover:bg-sky-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isSelected && <span className="font-mono text-[11px]">✔</span>}
                          <span className="truncate">{acc.name}</span>
                        </div>
                        {acc.type === 'vault' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
                            خزنة
                          </span>
                        )}
                        {acc.type === 'cash_box' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                            صندوق
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* -------------------------------------------------------------
                العمود الأيسر: الحساب
                ------------------------------------------------------------- */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-black ${rightSideNature === 'debit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {rightSideNature === 'debit' ? 'الحساب الدائن (إليه / له):' : 'الحساب المدين (منه / عليه):'}
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  rightSideNature === 'debit' 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}>
                  {rightSideNature === 'debit' ? 'الطرف الدائن' : 'الطرف المدين'}
                </span>
              </div>

              {/* مربع البحث عن الحساب */}
              <div className="relative">
                <input
                  type="text"
                  value={leftSearch}
                  onChange={(e) => setLeftSearch(e.target.value)}
                  placeholder="بحث عن الحساب..."
                  className="w-full h-7 pl-8 pr-2.5 text-xs font-bold text-slate-800 bg-[#fffef0] border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-inner"
                />
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
              </div>

              {/* قائمة الحسابات بارتفاع محدد وملاصق تماماً */}
              <div className="h-[145px] overflow-y-auto border border-slate-300 rounded-lg bg-[#fffef0] divide-y divide-slate-200 shadow-inner">
                {filteredLeftAccounts.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    لا يوجد حساب مطابق للبحث
                  </div>
                ) : (
                  filteredLeftAccounts.map(acc => {
                    const isSelected = acc.id === leftAccountId;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setLeftAccountId(acc.id)}
                        className={`px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#0284c7] text-white' 
                            : 'text-slate-800 hover:bg-sky-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isSelected && <span className="font-mono text-[11px]">✔</span>}
                          <span className="truncate">{acc.name}</span>
                        </div>
                        {acc.type === 'vault' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
                            خزنة
                          </span>
                        )}
                        {acc.type === 'cash_box' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                            صندوق
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* =========================================================================
              السطر الرابع: حقل التفاصيل (فوقه الحسابات مباشرة وملاصقة تماماً)
              ========================================================================= */}
          <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
            <label className="text-xs font-bold text-slate-800 min-w-[70px] text-right flex items-center gap-1 shrink-0">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>التفاصيل:</span>
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="التفاصيل..."
              className="w-full h-8 px-3 text-xs font-medium text-slate-800 bg-[#fffef0] border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-inner"
            />
          </div>

        </div>

        {/* =========================================================================
            شريط أزرار التحكم السفلي الموحد (موافق .F9.، طباعة .F6.، تفريغ .F3.، انهاء .ESC.)
            ========================================================================= */}
        <div className="bg-slate-100/90 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 mt-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAmountStr('');
                setDetails('');
              }}
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="تفريغ الحقول (F3)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>تفريغ .F3</span>
            </button>

            {lastCreatedTx && (
              <button
                type="button"
                onClick={() => onViewReceipt(lastCreatedTx)}
                className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="طباعة سند القيد (F6)"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>طباعة .F6</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="إلغاء وإغلاق النافذة (ESC)"
            >
              <X className="w-3.5 h-3.5 text-slate-600" />
              <span>انهاء .ESC</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="h-8 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
              title="تثبيت وترحيل القيد اليومي (F9)"
            >
              <CheckCircle2 className="w-4 h-4 text-sky-200" />
              <span>موافق .F9.</span>
            </button>
          </div>
        </div>

      </div>
  );

  if (isEmbedded) {
    return (
      <div 
        className="flex-1 w-full min-h-full flex items-center justify-center p-3 sm:p-5 md:p-6 text-slate-800" 
        dir="rtl"
        style={{ paddingLeft: '47px', paddingRight: '47px', paddingBottom: '24px', marginRight: '0px' }}
      >
        <div className="w-full flex items-center justify-center my-auto">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={() => {
        if (onClose) onClose();
      }}
    >
      {cardContent}
    </div>
  );
};
