import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  ChevronDown, 
  Printer, 
  Search, 
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  RotateCcw,
  FileDown,
  ArrowLeftRight,
  Wallet,
  Landmark,
  ShieldCheck,
  Check
} from 'lucide-react';
import { AccountItem, TransactionRecord, CurrencyRate } from '../../../types';
import { exportElementToPdf } from '../../../utils/pdfExport';

export interface WebFundTransferScreenProps {
  isOpen?: boolean;
  isEmbedded?: boolean;
  onClose?: () => void;
  accounts: AccountItem[];
  transactions: TransactionRecord[];
  currencies: CurrencyRate[];
  onCreateTransaction: (tx: TransactionRecord) => void;
  systemUser?: string;
  companyName?: string;
  onOpenReceipt?: (tx: TransactionRecord) => void;
}

export const WebFundTransferScreen: React.FC<WebFundTransferScreenProps> = ({
  isOpen = true,
  isEmbedded = false,
  onClose,
  accounts,
  transactions,
  currencies,
  onCreateTransaction,
  systemUser = 'المدير العام',
  companyName = '',
  onOpenReceipt,
}) => {
  // تصفية كافة الصناديق والخزائن والبنوك
  const availableAccounts = useMemo(() => {
    const list = accounts.filter(a => {
      const isBox = a.type === 'cash_box' || (a as any).systemType === 'cash_box' || a.name.includes('صندوق') || a.id === 'sys_cash_box';
      const isVault = a.type === 'vault' || (a as any).systemType === 'vault' || a.name.includes('خزنة') || a.id === 'sys_vault';
      const isBank = a.type === 'bank' || a.name.includes('مصرف') || a.name.includes('بنك');
      return isBox || isVault || isBank;
    });
    if (list.length === 0) return accounts;
    return list;
  }, [accounts]);

  // التبويب النشط: "مناقلة جديدة" أو "الحركات المرسلة"
  const [activeTab, setActiveTab] = useState<'new_transfer' | 'history'>('new_transfer');

  // حقول رأس المناقلة (الصف الأول)
  const [fromBranch, setFromBranch] = useState<string>(companyName || 'الفرع الرئيسي');
  const [fromAccountId, setFromAccountId] = useState<string>('');

  const [toBranch, setToBranch] = useState<string>(companyName || 'الفرع الرئيسي');
  const [toAccountId, setToAccountId] = useState<string>('');

  // حقول الصف الثاني
  const [transferNumber, setTransferNumber] = useState<string>(() => `${Date.now().toString().slice(-4)}`);
  const [transferDate, setTransferDate] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  });
  const [currencyNumber] = useState<string>('0');
  const [transferStatus] = useState<string>('جاهزة');

  // حقل البيان (الصف الثالث)
  const [notes, setNotes] = useState<string>('');

  // جدول المبالغ المنقولة
  const [iqdTransferAmount, setIqdTransferAmount] = useState<string>('0');
  const [usdTransferAmount, setUsdTransferAmount] = useState<string>('0');

  // حالة الرسائل والتنبيهات
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastCreatedTx, setLastCreatedTx] = useState<TransactionRecord | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);
  const [voucherTx, setVoucherTx] = useState<TransactionRecord | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // تصفية سجل الحركات السابقة
  const [historySearch, setHistorySearch] = useState<string>('');

  // تعيين القيم الابتدائية للصناديق بموجب القواعد المحاسبية في AGENTS.md:
  // الطرف الدائن 🟢 (المرسل / خروج النقدية): الصندوق النقدي (Cash Box)
  // الطرف المدين 🔴 (المستلم / استلام النقدية): الخزنة المركزية (Vault)
  useEffect(() => {
    if (availableAccounts.length === 0) return;

    if (!fromAccountId) {
      // تفضيل الصندوق كمرسل دائن 🟢
      const box = availableAccounts.find(a => 
        a.type === 'cash_box' || (a as any).systemType === 'cash_box' || a.name.includes('صندوق') || a.id === 'sys_cash_box'
      );
      setFromAccountId(box ? box.id : availableAccounts[0].id);
    }
  }, [availableAccounts, fromAccountId]);

  useEffect(() => {
    if (availableAccounts.length === 0) return;

    if (!toAccountId || toAccountId === fromAccountId) {
      // تفضيل الخزنة كمستلم مدين 🔴
      const vault = availableAccounts.find(a => 
        a.id !== fromAccountId && (a.type === 'vault' || (a as any).systemType === 'vault' || a.name.includes('خزنة') || a.id === 'sys_vault')
      );
      if (vault) {
        setToAccountId(vault.id);
      } else {
        const other = availableAccounts.find(a => a.id !== fromAccountId);
        if (other) setToAccountId(other.id);
      }
    }
  }, [availableAccounts, toAccountId, fromAccountId]);

  // الحساب المسلّم (منه - دائن 🟢)
  const fromAccount = useMemo(() => {
    return accounts.find(a => a.id === fromAccountId);
  }, [accounts, fromAccountId]);

  // الحساب المستلم (إليه - مدين 🔴)
  const toAccount = useMemo(() => {
    return accounts.find(a => a.id === toAccountId);
  }, [accounts, toAccountId]);

  // الأرصدة الحالية للصندوق المرسل منه
  const currentIqdBalance = Number(fromAccount?.balanceIQD) || 0;
  const currentUsdBalance = Number(fromAccount?.balanceUSD) || 0;

  // الأرصدة الحالية للصندوق/الخزنة المستلمة
  const toIqdBalance = Number(toAccount?.balanceIQD) || 0;
  const toUsdBalance = Number(toAccount?.balanceUSD) || 0;

  // تبديل طرفي المناقلة بنقرة واحدة
  const handleSwapAccounts = () => {
    if (!fromAccountId || !toAccountId) return;
    const prevFrom = fromAccountId;
    const prevTo = toAccountId;
    setFromAccountId(prevTo);
    setToAccountId(prevFrom);
  };

  // تنظيف وتحويل الأرقام العربية إلى إنجليزية
  const cleanNumberInput = (val: string) => {
    const englishDigits = val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    return englishDigits.replace(/[^0-9.]/g, '');
  };

  // التحقق من الحفظ والترحيل
  const handleSaveTransfer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!fromAccount) {
      setErrorMsg('يرجى اختيار الصندوق المرسل منه (دائن 🟢)');
      return;
    }
    if (!toAccount) {
      setErrorMsg('يرجى اختيار الصندوق أو الخزنة المستلمة (مدين 🔴)');
      return;
    }
    if (fromAccount.id === toAccount.id) {
      setErrorMsg('لا يمكن التحويل لنفس الصندوق! يرجى اختيار صندوق مستلم مختلف.');
      return;
    }

    const numIQD = parseFloat(cleanNumberInput(iqdTransferAmount)) || 0;
    const numUSD = parseFloat(cleanNumberInput(usdTransferAmount)) || 0;

    if (numIQD <= 0 && numUSD <= 0) {
      setErrorMsg('يرجى كتابة مبلغ أكبر من الصفر في حقل المبلغ المنقول للدينار أو الدولار');
      return;
    }

    const createdTxs: TransactionRecord[] = [];
    const now = new Date();
    const cleanDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // قاعدة النظام المحاسبية المعتمدة في AGENTS.md:
    // الطرف الدائن 🟢 (Credit - خروج نقدية): الصندوق المرسل منه (fromAccount)
    // الطرف المدين 🔴 (Debit - استلام نقدية): الصندوق/الخزنة المستلمة (toAccount)
    if (numIQD > 0) {
      const txIqd: TransactionRecord = {
        id: `tx-fund-iqd-${Date.now()}`,
        code: `TR-${transferNumber}-IQD`,
        type: 'journal',
        titleAr: `قيد مناقلة نقدية بالدينار (${fromAccount.name} ◄ ${toAccount.name})`,
        senderName: fromAccount.name, // دائن 🟢
        receiverName: toAccount.name, // مدين 🔴
        cashBoxId: fromAccount.id,    // الطرف الدائن (المرسل)
        accountId: toAccount.id,      // الطرف المدين (المستلم)
        accountName: toAccount.name,
        amount: numIQD,
        currency: 'IQD',
        fee: 0,
        commissionType: 'none',
        transferSettlementType: 'credit',
        settlementCurrency: 'IQD',
        settlementAmount: numIQD,
        status: 'completed',
        createdBy: systemUser,
        notes: notes.trim() || `مناقلة نقدية بالدينار من ${fromAccount.name} إلى ${toAccount.name}`,
        createdAt: cleanDate,
        completedAt: cleanDate,
      };
      onCreateTransaction(txIqd);
      createdTxs.push(txIqd);
    }

    if (numUSD > 0) {
      const txUsd: TransactionRecord = {
        id: `tx-fund-usd-${Date.now() + 1}`,
        code: `TR-${transferNumber}-USD`,
        type: 'journal',
        titleAr: `قيد مناقلة نقدية بالدولار (${fromAccount.name} ◄ ${toAccount.name})`,
        senderName: fromAccount.name, // دائن 🟢
        receiverName: toAccount.name, // مدين 🔴
        cashBoxId: fromAccount.id,    // الطرف الدائن (المرسل)
        accountId: toAccount.id,      // الطرف المدين (المستلم)
        accountName: toAccount.name,
        amount: numUSD,
        currency: 'USD',
        fee: 0,
        commissionType: 'none',
        transferSettlementType: 'credit',
        settlementCurrency: 'USD',
        settlementAmount: numUSD,
        status: 'completed',
        createdBy: systemUser,
        notes: notes.trim() || `مناقلة نقدية بالدولار من ${fromAccount.name} إلى ${toAccount.name}`,
        createdAt: cleanDate,
        completedAt: cleanDate,
      };
      onCreateTransaction(txUsd);
      createdTxs.push(txUsd);
    }

    if (createdTxs.length > 0) {
      const mainTx = createdTxs[0];
      setLastCreatedTx(mainTx);
      setVoucherTx(mainTx);
      setSuccessMsg(`تم حفظ وترحيل سند المناقلة رقم (${transferNumber}) بنجاح! تم تحديث رصيد (${fromAccount.name}) ورصيد (${toAccount.name}) فورياً.`);
      setIqdTransferAmount('0');
      setUsdTransferAmount('0');
      setNotes('');
      setTransferNumber(`${Date.now().toString().slice(-4)}`);

      setTimeout(() => {
        setSuccessMsg(null);
      }, 7000);
    }
  };

  // اختصارات لوحة المفاتيح: F9 للحفظ، ESC للإغلاق
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleSaveTransfer();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isVoucherModalOpen) {
          setIsVoucherModalOpen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isVoucherModalOpen, fromAccount, toAccount, iqdTransferAmount, usdTransferAmount, notes, onClose]);

  // سجل المناقلات السابقة
  const filteredHistory = useMemo(() => {
    return transactions.filter(t => {
      const isTransfer = t.type === 'journal' || t.titleAr.includes('مناقلة') || t.titleAr.includes('توريد');
      if (!isTransfer) return false;
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return (
        t.code?.toLowerCase().includes(q) ||
        t.senderName?.toLowerCase().includes(q) ||
        t.receiverName?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
      );
    });
  }, [transactions, historySearch]);

  // تصدير سند المناقلة كـ PDF
  const handleExportVoucherPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('printable-fund-transfer-voucher', {
        filename: `سند_مناقلة_${voucherTx?.code || transferNumber}.pdf`,
        orientation: 'portrait',
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const cardContent = (
    <div 
      className={`relative w-full ${
        isEmbedded 
          ? 'max-w-full xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto bg-white rounded-3xl shadow-2xl border-2 border-sky-400 overflow-hidden text-slate-800' 
          : 'w-full max-w-[96vw] lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1500px] bg-white rounded-3xl shadow-2xl border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.25)] overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* =========================================================================
          شريط رأس النافذة المنبثقة الموحد
          ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-sky-200 border border-white/20">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>مناقلة بين الصناديق وتوريد الخزنة</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-sky-100 border border-white/20">
                مناقلة وتوريد
              </span>
            </h2>
            <p className="text-[11px] text-sky-100/80">
              تحويل النقد بين الصناديق وتوريد النقدية وتصفير الأرصدة إلى الخزنة المركزية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* تبويبات التبديل داخل الترويسة الموحدة */}
          <div className="flex items-center bg-black/20 p-0.5 rounded-xl border border-white/15">
            <button
              type="button"
              onClick={() => setActiveTab('new_transfer')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'new_transfer' 
                  ? 'bg-white text-sky-950 shadow-sm' 
                  : 'text-sky-100 hover:text-white'
              }`}
            >
              مناقلة جديدة
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history' 
                  ? 'bg-white text-sky-950 shadow-sm' 
                  : 'text-sky-100 hover:text-white'
              }`}
            >
              <span>الحركات المرسلة</span>
              {filteredHistory.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'history' ? 'bg-sky-100 text-sky-800' : 'bg-white/20 text-white'
                }`}>
                  {filteredHistory.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-sky-100/90 font-medium bg-black/15 px-3 py-1 rounded-xl border border-white/10">
            <Building2 className="w-3.5 h-3.5 text-sky-300" />
            <span>{companyName}</span>
            <span>•</span>
            <span className="font-bold text-white">{systemUser}</span>
          </div>

          {/* زر إنهاء / إغلاق النافذة */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إنهاء وإغلاق (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* جسم النافذة الرئيسي */}
      <div className="p-3.5 sm:p-4.5 bg-[#f8fafc] space-y-3.5">
          
          {/* رسائل التنبيه والنجاح */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-sm animate-in fade-in shrink-0">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">{successMsg}</span>
              </div>
              {lastCreatedTx && (
                <button
                  type="button"
                  onClick={() => {
                    setVoucherTx(lastCreatedTx);
                    setIsVoucherModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة سند المناقلة</span>
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-bold shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'new_transfer' ? (
            <form onSubmit={handleSaveTransfer} className="space-y-4">
              
              {/* الصندوق المحيط بالحقول العلوية */}
              <div className="border border-slate-200/90 rounded-2xl p-3.5 bg-white space-y-3 shadow-xs">
                
                {/* الصف الأول: الفرع المرسل - اسم الصندوق | زر التبديل السريع | الفرع المستلم - اسم الصندوق */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-9 gap-3 text-right items-end">
                  
                  {/* 1. الفرع المرسل (عمودين) */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">الفرع المرسل</label>
                    <input
                      type="text"
                      value={fromBranch}
                      onChange={(e) => setFromBranch(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg bg-[#fffef0] text-slate-900 focus:outline-none focus:border-sky-500 shadow-inner"
                    />
                  </div>

                  {/* 2. الصندوق المرسل (دائن 🟢) (عمودين) */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-extrabold text-emerald-800 mb-1 flex items-center gap-1">
                      <span>الصندوق المرسل منه</span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px]">دائن 🟢</span>
                    </label>
                    <div className="relative">
                      <select
                        value={fromAccountId}
                        onChange={(e) => setFromAccountId(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs border-2 border-emerald-400 rounded-lg bg-[#f0fdf4] text-emerald-950 font-bold focus:outline-none focus:border-emerald-600 appearance-none pr-2.5 pl-6 cursor-pointer shadow-inner"
                      >
                        {availableAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-emerald-700 absolute left-1.5 top-2 pointer-events-none stroke-[2.5]" />
                    </div>
                  </div>

                  {/* زر التبديل السريع بين الطرفين (عمود واحد) */}
                  <div className="lg:col-span-1 flex justify-center pb-0.5">
                    <button
                      type="button"
                      onClick={handleSwapAccounts}
                      title="تبديل طرفي المناقلة (عكس الصندوقين)"
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 border border-slate-300 hover:border-sky-400 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 3. الفرع المستلم (عمودين) */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">الفرع المستلم</label>
                    <input
                      type="text"
                      value={toBranch}
                      onChange={(e) => setToBranch(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg bg-[#fffef0] text-slate-900 focus:outline-none focus:border-sky-500 shadow-inner"
                    />
                  </div>

                  {/* 4. الصندوق/الخزنة المستلمة (مدين 🔴) (عمودين) */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-extrabold text-rose-800 mb-1 flex items-center gap-1">
                      <span>الصندوق/الخزنة المستلمة</span>
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded text-[10px]">مدين 🔴</span>
                    </label>
                    <div className="relative">
                      <select
                        value={toAccountId}
                        onChange={(e) => setToAccountId(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs border-2 border-rose-400 rounded-lg bg-[#fff1f2] text-rose-950 focus:outline-none focus:border-rose-600 appearance-none pr-2.5 pl-6 font-bold cursor-pointer shadow-inner"
                      >
                        {availableAccounts.map(acc => (
                          <option 
                            key={acc.id} 
                            value={acc.id}
                            disabled={acc.id === fromAccountId}
                          >
                            {acc.name} {acc.id === fromAccountId ? '(نفس الصندوق)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-rose-700 absolute left-1.5 top-2 pointer-events-none stroke-[2.5]" />
                    </div>
                  </div>

                </div>

                {/* الصف الثاني: رقم المناقلة | التاريخ | رقم العملة | حالة المناقلة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
                  
                  {/* رقم المناقلة */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم المناقلة</label>
                    <input
                      type="text"
                      value={transferNumber}
                      readOnly
                      className="w-full h-8 px-2 text-xs border border-slate-300 rounded-lg bg-slate-100 text-slate-800 font-mono text-center font-bold"
                    />
                  </div>

                  {/* التاريخ مع أيقونة الرزنامة */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">التاريخ</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        className="w-full h-8 pr-2.5 pl-8 text-xs border border-slate-300 rounded-lg bg-[#fffef0] text-slate-900 focus:outline-none focus:border-sky-500 font-mono text-center shadow-inner"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* رقم العملة */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم العملة</label>
                    <input
                      type="text"
                      value={currencyNumber}
                      readOnly
                      className="w-full h-8 px-2 text-xs border border-slate-300 rounded-lg bg-slate-100 text-slate-800 font-mono text-center"
                    />
                  </div>

                  {/* حالة المناقلة */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">حالة المناقلة</label>
                    <input
                      type="text"
                      value={transferStatus}
                      readOnly
                      className="w-full h-8 px-2 text-xs border border-emerald-300 rounded-lg bg-emerald-50 text-emerald-800 text-center font-bold"
                    />
                  </div>

                </div>

                {/* الصف الثالث: البيان عريض بعرض النافذة بالكامل */}
                <div className="text-right">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">البيان / سبب المناقلة</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات أو سبب المناقلة (مثال: توريد وتصفير رصيد الصندوق إلى الخزنة المركزية)..."
                    className="w-full h-8 px-3 text-xs border border-slate-300 rounded-lg bg-[#fffef0] text-slate-900 focus:outline-none focus:border-sky-500 shadow-inner"
                  />
                </div>

              </div>

              {/* الجدول السفلي للعملات والرصيد الحالي والمبلغ المنقول */}
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 h-9">
                      <th className="px-4 py-2 text-right border-l border-slate-200 w-1/5">
                        العملة
                      </th>
                      <th className="px-4 py-2 text-center border-l border-slate-200 w-1/4">
                        رصيد المرسل منه (دائن 🟢)
                      </th>
                      <th className="px-4 py-2 text-center border-l border-slate-200 w-1/4">
                        رصيد المستلم (مدين 🔴)
                      </th>
                      <th className="px-4 py-2 text-center w-1/3">
                        المبلغ المطلوب نقله
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    
                    {/* صف الدينار العراقي (Iraqi Dinar) */}
                    <tr className="h-11 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 font-bold text-slate-900 border-l border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span>دينار عراقي (IQD)</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-slate-200">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {currentIqdBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          currentIqdBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {currentIqdBalance >= 0 ? 'دائن 🟢' : 'مدين 🔴'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-slate-200">
                        <div className="font-mono font-bold text-slate-800 text-sm">
                          {toIqdBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          toIqdBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {toIqdBalance >= 0 ? 'دائن 🟢' : 'مدين 🔴'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="text"
                            value={iqdTransferAmount}
                            onChange={(e) => setIqdTransferAmount(cleanNumberInput(e.target.value))}
                            onFocus={(e) => {
                              if (e.target.value === '0') e.target.select();
                            }}
                            placeholder="0"
                            className="w-full max-w-[200px] h-8 px-2 text-center font-mono font-black text-slate-900 border-2 border-slate-300 rounded-lg bg-[#fffef0] focus:border-sky-500 focus:outline-none shadow-inner text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (currentIqdBalance > 0) {
                                setIqdTransferAmount(currentIqdBalance.toString());
                              } else {
                                setIqdTransferAmount('1000000');
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-md border border-emerald-300 cursor-pointer shrink-0 transition-colors"
                            title="تصفير كامل الدينار"
                          >
                            تصفير الدينار
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* صف الدولار الأمريكي (US Dollar) */}
                    <tr className="h-11 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 font-bold text-slate-900 border-l border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span>دولار أمريكي (USD)</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-slate-200">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {currentUsdBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          currentUsdBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {currentUsdBalance >= 0 ? 'دائن 🟢' : 'مدين 🔴'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-slate-200">
                        <div className="font-mono font-bold text-slate-800 text-sm">
                          {toUsdBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          toUsdBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {toUsdBalance >= 0 ? 'دائن 🟢' : 'مدين 🔴'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="text"
                            value={usdTransferAmount}
                            onChange={(e) => setUsdTransferAmount(cleanNumberInput(e.target.value))}
                            onFocus={(e) => {
                              if (e.target.value === '0') e.target.select();
                            }}
                            placeholder="0"
                            className="w-full max-w-[200px] h-8 px-2 text-center font-mono font-black text-slate-900 border-2 border-slate-300 rounded-lg bg-[#fffef0] focus:border-sky-500 focus:outline-none shadow-inner text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (currentUsdBalance > 0) {
                                setUsdTransferAmount(currentUsdBalance.toString());
                              } else {
                                setUsdTransferAmount('1000');
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-md border border-blue-300 cursor-pointer shrink-0 transition-colors"
                            title="تصفير كامل الدولار"
                          >
                            تصفير الدولار
                          </button>
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* أزرار الحفظ والإلغاء وتصفير الصندوق */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentIqdBalance > 0) setIqdTransferAmount(currentIqdBalance.toString());
                      if (currentUsdBalance > 0) setUsdTransferAmount(currentUsdBalance.toString());
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                    title="تصفير كامل رصيد الصندوق المتوفر وتوريده للخزنة"
                  >
                    <Check className="w-4 h-4" />
                    <span>تصفير الصندوق بالكامل (توريد للخزنة 🟢)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIqdTransferAmount('0');
                      setUsdTransferAmount('0');
                      setNotes('');
                    }}
                    className="h-8 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                    title="تفريغ الحقول (F3)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                    <span>تفريغ .F3</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                    title="إنهاء وإغلاق النافذة (ESC)"
                  >
                    <X className="w-3.5 h-3.5 text-slate-600" />
                    <span>انهاء .ESC</span>
                  </button>

                  <button
                    type="submit"
                    className="h-8 px-5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer text-xs active:scale-95"
                    title="حفظ وترحيل المناقلة (F9)"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-200" />
                    <span>حفظ وترحيل المناقلة (F9)</span>
                  </button>
                </div>
              </div>

            </form>
          ) : (
            /* تبويب الحركات المرسلة السابقة */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-72">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="بحث في سجل المناقلات..."
                    className="w-full h-8 pr-8 pl-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-sky-500 shadow-xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2" />
                </div>
                <div className="text-xs text-slate-500 font-bold">
                  إجمالي الحركات: {filteredHistory.length} حركة
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-[360px] overflow-y-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold h-9">
                    <tr>
                      <th className="py-2 px-3">رقم السند</th>
                      <th className="py-2 px-3">التاريخ</th>
                      <th className="py-2 px-3">المرسل (دائن 🟢)</th>
                      <th className="py-2 px-3">المستلم (مدين 🔴)</th>
                      <th className="py-2 px-3 text-center">المبلغ</th>
                      <th className="py-2 px-3 text-center">العملة</th>
                      <th className="py-2 px-3">البيان</th>
                      <th className="py-2 px-3 text-center">طباعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                          لا توجد حركات مناقلة مسجلة بعد
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-sky-700">{tx.code}</td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{tx.createdAt}</td>
                          <td className="py-2 px-3 font-bold text-emerald-800">{tx.senderName}</td>
                          <td className="py-2 px-3 font-bold text-rose-800">{tx.receiverName}</td>
                          <td className="py-2 px-3 font-mono font-black text-slate-900 text-center">
                            {tx.amount.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              tx.currency === 'USD' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {tx.currency}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 max-w-xs truncate text-[11px]">{tx.notes || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setVoucherTx(tx);
                                setIsVoucherModalOpen(true);
                              }}
                              title="طباعة سند المناقلة"
                              className="p-1 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded cursor-pointer transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
  );

  return (
    <>
      {isEmbedded ? (
        <div className="flex-1 w-full min-h-full flex items-center justify-center p-3 sm:p-5 md:p-6 text-slate-800" dir="rtl">
          <div className="w-full flex items-center justify-center my-auto">
            {cardContent}
          </div>
        </div>
      ) : (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => onClose && onClose()}
          dir="rtl"
        >
          {cardContent}
        </div>
      )}

      {/* نافذة معاينة وطباعة سند المناقلة الرسمي */}
      {isVoucherModalOpen && voucherTx && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
          onClick={() => setIsVoucherModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-[650px] w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* أزرار التحكم العلوية */}
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700">معاينة سند المناقلة والتوريد</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportVoucherPdf}
                  disabled={isExportingPdf}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'جاري التحميل...' : 'حفظ كـ PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الآن</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ورقة السند القابلة للطباعة والتصدير */}
            <div id="printable-fund-transfer-voucher" className="p-6 bg-white space-y-4">
              
              {/* ترويسة السند */}
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <h1 className="text-base font-black text-slate-900">{companyName}</h1>
                <h2 className="text-sm font-bold text-sky-800 bg-sky-50 inline-block px-4 py-1 rounded-lg border border-sky-200">
                  سند مناقلة وتوريد نقدية بين الصناديق
                </h2>
                <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1 font-mono">
                  <span>رقم السند: <b>{voucherTx.code}</b></span>
                  <span>التاريخ: <b>{voucherTx.createdAt}</b></span>
                </div>
              </div>

              {/* أطراف القيد المحاسبي */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border-2 border-emerald-400 bg-emerald-50/60">
                  <span className="text-[10px] font-black text-emerald-800 block mb-1">الطرف الدائن 🟢 (المرسل / خروج النقدية):</span>
                  <div className="font-black text-sm text-emerald-950">{voucherTx.senderName}</div>
                </div>
                <div className="p-3 rounded-xl border-2 border-rose-400 bg-rose-50/60">
                  <span className="text-[10px] font-black text-rose-800 block mb-1">الطرف المدين 🔴 (المستلم / استلام النقدية):</span>
                  <div className="font-black text-sm text-rose-950">{voucherTx.receiverName}</div>
                </div>
              </div>

              {/* تفاصيل المبلغ والبيان */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold">المبلغ المحول:</span>
                  <span className="font-mono font-black text-lg text-slate-900">
                    {voucherTx.amount.toLocaleString()} {voucherTx.currency === 'USD' ? 'دولار أمريكي ($)' : 'دينار عراقي (د.ع)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700">
                  <span className="font-bold text-slate-900">البيان: </span>
                  <span>{voucherTx.notes || 'مناقلة وتوريد نقدية بين الصناديق والخزنة'}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold text-slate-900">منظم السند: </span>
                  <span>{voucherTx.createdBy || systemUser}</span>
                </div>
              </div>

              {/* التواقيع الرسمية */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-dashed border-slate-300 text-center text-[10px]">
                <div>
                  <span className="font-bold block text-slate-700">أمين الصندوق (المرسل)</span>
                  <div className="h-10 border-b border-dotted border-slate-400 mt-1"></div>
                  <span className="text-slate-400">التوقيع</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-700">أمين الخزنة (المستلم)</span>
                  <div className="h-10 border-b border-dotted border-slate-400 mt-1"></div>
                  <span className="text-slate-400">التوقيع</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-700">المدير المالي / الختم</span>
                  <div className="h-10 border-b border-dotted border-slate-400 mt-1"></div>
                  <span className="text-slate-400">التوقيع والختم</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
