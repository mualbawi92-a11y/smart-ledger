import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2,
  Lock,
  Unlock,
  Pencil,
  X,
  Check,
  Building2,
  Users,
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  FolderTree,
  RotateCcw,
  Vault,
  ArrowRightLeft,
  CheckCircle2,
  Coins,
  Printer
} from 'lucide-react';
import { AccountItem, AccountType, CurrencyCode, TransactionRecord } from '../../../types';
import { SearchableSelect } from '../../common/SearchableSelect';

interface WebAccountsScreenProps {
  accounts: AccountItem[];
  onAddAccount: (acc: AccountItem) => void;
  onUpdateAccount?: (acc: AccountItem) => void;
  onDeleteAccount?: (id: string) => void;
  onToggleLockAccount?: (id: string) => void;
  onClearAllAccounts?: () => void;
  onCreateTransaction?: (tx: TransactionRecord) => void;
  onOpenNewTransaction: () => void;
  onClose?: () => void;
  onNavigateToBankAccounts?: () => void;
}

const AVAILABLE_CURRENCIES: { code: CurrencyCode; nameAr: string; flag: string }[] = [
  { code: 'IQD', nameAr: 'دينار عراقي', flag: '🇮🇶' },
  { code: 'USD', nameAr: 'دولار أمريكي', flag: '🇺🇸' },
  { code: 'EUR', nameAr: 'يورو أوروبي', flag: '🇪🇺' },
  { code: 'TRY', nameAr: 'ليرة تركية', flag: '🇹🇷' },
  { code: 'AED', nameAr: 'درهم إماراتي', flag: '🇦🇪' },
  { code: 'GBP', nameAr: 'باوند إسترليني', flag: '🇬🇧' },
];

export const WebAccountsScreen: React.FC<WebAccountsScreenProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onToggleLockAccount,
  onClearAllAccounts,
  onCreateTransaction,
  onClose,
  onNavigateToBankAccounts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Sweep Modal state (تصفير وتوريد الصندوق إلى الخزنة)
  const [isSweepModalOpen, setIsSweepModalOpen] = useState(false);
  const [sweepCashBoxId, setSweepCashBoxId] = useState('');
  const [sweepVaultId, setSweepVaultId] = useState('');
  const [sweepCurrency, setSweepCurrency] = useState<CurrencyCode>('USD');
  const [sweepAmountStr, setSweepAmountStr] = useState('');
  const [sweepSuccessMessage, setSweepSuccessMessage] = useState<string | null>(null);

  // Delete confirmations
  const [accountToDelete, setAccountToDelete] = useState<AccountItem | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash_box');
  const [linkedVaultId, setLinkedVaultId] = useState<string>('');
  const [selectedCurrencies, setSelectedCurrencies] = useState<CurrencyCode[]>(['IQD']);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('بغداد');
  const [notes, setNotes] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // قائمة حسابات الخزائن والصناديق
  const availableVaults = useMemo(() => {
    return accounts.filter(a => a.type === 'vault');
  }, [accounts]);

  const availableCashBoxes = useMemo(() => {
    return accounts.filter(a => a.type === 'cash_box');
  }, [accounts]);

  // Auto-generate next code
  const getNextSuggestedCode = () => {
    if (accounts.length === 0) return '1';
    const numericCodes = accounts
      .map(a => parseInt(a.code || '', 10))
      .filter(n => !isNaN(n));
    if (numericCodes.length === 0) return String(accounts.length + 1);
    return String(Math.max(...numericCodes) + 1);
  };

  const openAddModal = () => {
    setEditingAccountId(null);
    setCode(getNextSuggestedCode());
    setName('');
    setType('cash_box');
    setLinkedVaultId(availableVaults[0]?.id || '');
    setSelectedCurrencies(['IQD']);
    setPhone('');
    setAddress('');
    setCity('بغداد');
    setNotes('');
    setIsLocked(false);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: AccountItem) => {
    setEditingAccountId(acc.id);
    setCode(acc.code || '');
    setName(acc.name);
    setType(acc.type);
    setLinkedVaultId(acc.linkedVaultId || '');
    setSelectedCurrencies(acc.currencies && acc.currencies.length > 0 ? acc.currencies : ['IQD']);
    setPhone(acc.phone || '');
    setAddress(acc.address || '');
    setCity(acc.city || 'بغداد');
    setNotes(acc.notes || '');
    setIsLocked(!!acc.isLocked);
    setIsModalOpen(true);
  };

  // فتح نافذة تصفير الصندوق وتوريد النقد إلى الخزنة
  const openSweepModal = () => {
    const firstBox = availableCashBoxes[0];
    const defaultBoxId = firstBox?.id || '';
    setSweepCashBoxId(defaultBoxId);

    // اختيار الخزنة المرتبطة بالصندوق أو أول خزنة متاحة
    const linked = firstBox?.linkedVaultId;
    const defaultVaultId = linked && availableVaults.some(v => v.id === linked)
      ? linked
      : (availableVaults[0]?.id || '');
    setSweepVaultId(defaultVaultId);

    setSweepCurrency('USD');
    setSweepAmountStr('');
    setSweepSuccessMessage(null);
    setIsSweepModalOpen(true);
  };

  // الصندوق المختار في نافذة التصفير
  const selectedSweepCashBox = useMemo(() => {
    return accounts.find(a => a.id === sweepCashBoxId);
  }, [accounts, sweepCashBoxId]);

  // الخزنة المختارة في نافذة التصفير
  const selectedSweepVault = useMemo(() => {
    return accounts.find(a => a.id === sweepVaultId);
  }, [accounts, sweepVaultId]);

  // تحديث الخزنة تلقائياً عند تغيير الصندوق المختار
  const handleSweepCashBoxChange = (boxId: string) => {
    setSweepCashBoxId(boxId);
    const box = accounts.find(a => a.id === boxId);
    if (box?.linkedVaultId && availableVaults.some(v => v.id === box.linkedVaultId)) {
      setSweepVaultId(box.linkedVaultId);
    }
  };

  // زر تصفير كامل الرصيد للعملة المحددة
  const handleFillFullBalance = () => {
    if (!selectedSweepCashBox) return;
    const bal = sweepCurrency === 'USD' 
      ? selectedSweepCashBox.balanceUSD 
      : selectedSweepCashBox.balanceIQD;
    const positiveBal = Math.max(0, bal);
    setSweepAmountStr(String(positiveBal));
  };

  // تنفيذ وتثبيت قيد تصفير وتوريد الصندوق إلى الخزنة
  const handleConfirmSweep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSweepCashBox || !selectedSweepVault) return;

    const cleanAmount = parseFloat(sweepAmountStr.replace(/,/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert('يرجى كتابة مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (onCreateTransaction) {
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeStr}`;

      const sweepTx: TransactionRecord = {
        id: `tx-sweep-${Date.now()}`,
        code: `SW-${Date.now().toString().slice(-4)}`,
        type: 'journal',
        titleAr: `قيد تصفير وتوريد نقدية إلى الخزنة (${selectedSweepVault.name})`,
        senderName: selectedSweepCashBox.name, // الطرف الدائن: الصندوق ينقص رصيده ويتصفر
        receiverName: selectedSweepVault.name,  // الطرف المدين: الخزنة تستلم النقدية ويزيد رصيدها
        accountId: selectedSweepVault.id,
        accountName: selectedSweepVault.name,
        amount: cleanAmount,
        currency: sweepCurrency,
        fee: 0,
        commissionType: 'none',
        transferSettlementType: 'credit',
        settlementCurrency: sweepCurrency,
        settlementAmount: cleanAmount,
        status: 'completed',
        createdBy: 'المدير المالي',
        notes: `تصفير رصيد الصندوق (${selectedSweepCashBox.name}) وتوريد المبلغ إلى الخزنة (${selectedSweepVault.name}) [القيد: الصندوق دائن • الخزنة مدين]`,
        createdAt: dateFormatted,
        completedAt: dateFormatted,
      };

      onCreateTransaction(sweepTx);
      setSweepSuccessMessage(`تم ترحيل مبلغ ${cleanAmount.toLocaleString()} ${sweepCurrency === 'USD' ? '$' : 'د.ع'} من (${selectedSweepCashBox.name}) إلى (${selectedSweepVault.name}) بنجاح!`);
      setSweepAmountStr('');
      setTimeout(() => {
        setIsSweepModalOpen(false);
        setSweepSuccessMessage(null);
      }, 1800);
    } else {
      setIsSweepModalOpen(false);
    }
  };

  // Currency selection toggle
  const toggleCurrency = (curr: CurrencyCode) => {
    if (selectedCurrencies.includes(curr)) {
      if (selectedCurrencies.length === 1) return;
      setSelectedCurrencies(selectedCurrencies.filter(c => c !== curr));
    } else {
      setSelectedCurrencies([...selectedCurrencies, curr]);
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAccountId) {
      const existing = accounts.find(a => a.id === editingAccountId);
      if (existing && onUpdateAccount) {
        onUpdateAccount({
          ...existing,
          code: code.trim() || existing.code,
          name: name.trim(),
          type,
          linkedVaultId: type === 'cash_box' ? (linkedVaultId || undefined) : undefined,
          currencies: selectedCurrencies,
          phone,
          address: address.trim() || undefined,
          city,
          notes,
          isLocked,
        });
      }
    } else {
      const newAcc: AccountItem = {
        id: `acc-${Date.now()}`,
        code: code.trim() || getNextSuggestedCode(),
        name: name.trim(),
        type,
        linkedVaultId: type === 'cash_box' ? (linkedVaultId || undefined) : undefined,
        currencies: selectedCurrencies,
        phone: phone || '07700000000',
        address: address.trim() || undefined,
        city: city || 'بغداد',
        balanceIQD: 0,
        balanceUSD: 0,
        notes,
        isLocked,
      };
      onAddAccount(newAcc);
    }

    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (accountToDelete && onDeleteAccount) {
      onDeleteAccount(accountToDelete.id);
      setAccountToDelete(null);
    }
  };

  const confirmClearAll = () => {
    if (onClearAllAccounts) {
      onClearAllAccounts();
    }
    setShowClearAllModal(false);
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const searchLower = searchTerm.trim().toLowerCase();
      const matchesSearch = 
        !searchLower ||
        acc.name.toLowerCase().includes(searchLower) ||
        (acc.code && acc.code.toLowerCase().includes(searchLower)) ||
        (acc.phone && acc.phone.includes(searchLower)) ||
        (acc.city && acc.city.toLowerCase().includes(searchLower));

      const matchesType = 
        typeFilter === 'all' ? true :
        typeFilter === 'locked' ? !!acc.isLocked :
        acc.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [accounts, searchTerm, typeFilter]);

  const getTypeLabel = (accType: AccountType) => {
    switch (accType) {
      case 'bank': return 'بنك';
      case 'client': return 'عميل';
      case 'expenses': return 'مصروفات';
      case 'revenues': return 'ايرادات';
      case 'cash_box': return 'صندوق';
      case 'vault': return 'خزنة';
      case 'supplier': return 'مورد';
      default: return accType;
    }
  };

  const getTypeBadge = (accType: AccountType) => {
    switch (accType) {
      case 'cash_box':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1 rounded-md text-xs font-bold shadow-2xs">
            <Wallet className="w-3.5 h-3.5 text-amber-600" />
            <span>صندوق</span>
          </span>
        );
      case 'vault':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-300 px-3 py-1 rounded-md text-xs font-bold shadow-2xs">
            <Vault className="w-3.5 h-3.5 text-purple-700" />
            <span>خزنة</span>
          </span>
        );
      case 'bank':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-md text-xs font-bold shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>بنك</span>
          </span>
        );
      case 'client':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-300 px-3 py-1 rounded-md text-xs font-bold shadow-2xs">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>عميل</span>
          </span>
        );
      case 'expenses':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-300 px-3 py-1 rounded-md text-xs font-bold shadow-2xs">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            <span>مصروفات</span>
          </span>
        );
      case 'revenues':
        return (
          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-300 px-3 py-1 rounded-md text-xs font-bold shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>ايرادات</span>
          </span>
        );
      case 'supplier':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1 rounded-md text-xs font-bold shadow-2xs">
            <span>مورد</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-xs font-bold">
            {accType}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 w-full max-w-full mx-auto text-slate-800" dir="rtl">
      
      {/* 1. TOP HEADER (MATCHING THE UNIFIED SKY GRADIENT BANNER) */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-sky-200 border border-white/20 shadow-inner">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>دليل الحسابات والمجموعات المالية</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-sky-100 border border-white/20">
                {filteredAccounts.length} حساب
              </span>
            </h1>
            <p className="text-[11px] text-sky-100/80">
              إدارة الصناديق النقدية، الخزنات، البنوك، العملاء، ومناقلة النقدية المركزية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق والعودة للرئيسية (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. شريط البحث والتصفية السريعة */}
      <div className="bg-white rounded-2xl border border-sky-200/90 p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 flex items-center">
          <button 
            type="button"
            className="w-10 h-9 bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center rounded-r-xl transition-colors cursor-pointer shrink-0"
            title="بحث"
          >
            <Search className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="بحث برقم الحساب، اسم الحساب، أو نوع الحساب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 h-9 px-3 bg-[#fffef0] border border-slate-300 border-r-0 rounded-l-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* فلاتر النوع السريعة تشمل الخزنة */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold text-slate-600 shrink-0">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'all' ? 'bg-[#0284c7] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            الكل ({accounts.length})
          </button>
          <button
            onClick={() => setTypeFilter('cash_box')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'cash_box' ? 'bg-[#0284c7] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            صندوق ({accounts.filter(a => a.type === 'cash_box').length})
          </button>
          <button
            onClick={() => setTypeFilter('vault')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'vault' ? 'bg-purple-700 text-white shadow-2xs' : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            🏛️ خزنة ({accounts.filter(a => a.type === 'vault').length})
          </button>
          <button
            onClick={() => setTypeFilter('bank')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'bank' ? 'bg-[#0284c7] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            بنك
          </button>
          <button
            onClick={() => setTypeFilter('client')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'client' ? 'bg-[#0284c7] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            عميل
          </button>
          <button
            onClick={() => setTypeFilter('expenses')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'expenses' ? 'bg-[#0284c7] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            مصروفات
          </button>
          <button
            onClick={() => setTypeFilter('revenues')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'revenues' ? 'bg-[#0284c7] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            ايرادات
          </button>
          {accounts.some(a => a.isLocked) && (
            <button
              onClick={() => setTypeFilter('locked')}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                typeFilter === 'locked' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              🔒 مقفلة ({accounts.filter(a => a.isLocked).length})
            </button>
          )}
        </div>
      </div>

      {/* 3. شريط عمليات الدليل */}
      <div className="bg-slate-100/90 border border-slate-200/90 px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold">
            عدد الحسابات المعروضة: {filteredAccounts.length}
          </span>
          {accounts.length > 0 && onClearAllAccounts && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer font-bold"
              title="مسح جميع الحسابات"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح الكل</span>
            </button>
          )}
        </div>

        {/* أزرار الإجراءات السريعة */}
        <div className="flex items-center gap-2">
          <button
            onClick={openSweepModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs"
            title="تصفير الصندوق وتوريد النقدية إلى الخزنة (الصندوق دائن • الخزنة مدين)"
          >
            <Vault className="w-3.5 h-3.5 text-purple-200" />
            <span>تصفير وتوريد للخزنة</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-sky-200" />
            <span>إضافة حساب .F2</span>
          </button>
        </div>
      </div>

      {/* 4. ترويسة الأعمدة الأربعة المطلوبة بدقة:
          من اليمين: 
          1. عدد الحسابات
          2. اسم الحساب
          3. نوع الحساب
          4. الاجرائات
      */}
      <div className="bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 grid grid-cols-12 gap-3 items-center rounded-t-xl select-none">
        {/* العمود 1: عدد الحسابات (اليمين) */}
        <div className="col-span-2 sm:col-span-2 text-right flex items-center gap-1.5">
          <span className="bg-[#0284c7] text-white rounded-md px-2 py-0.5 text-[11px] font-mono font-bold">ت</span>
          <span>رقم الحساب</span>
        </div>

        {/* العمود 2: اسم الحساب */}
        <div className="col-span-5 sm:col-span-5 text-right">
          <span>اسم الحساب</span>
        </div>

        {/* العمود 3: نوع الحساب */}
        <div className="col-span-3 sm:col-span-3 text-center sm:text-right">
          <span>نوع الحساب</span>
        </div>

        {/* العمود 4: الاجرائات (اليسار) */}
        <div className="col-span-2 sm:col-span-2 text-left sm:text-center pl-1">
          <span>الإجراءات</span>
        </div>
      </div>

      {/* 4. قائمة صفوف الحسابات (بدون رصيد وبدون عملات بجانب الحساب) */}
      <div className="bg-slate-50 border border-slate-300 border-t-0 rounded-b-2xl p-2 sm:p-3 space-y-2 shadow-xs min-h-[300px]">
        {filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500 space-y-4 my-2">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-[#0b5340]">
              <FolderTree className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">الدليل فارغ ولا توجد حسابات حالياً</p>
              <p className="text-xs text-slate-500 mt-1">
                يمكنك البدء بإضافة حساباتك الجديدة (صندوق، خزنة، بنك، عميل، مصروفات، ايرادات) مباشرة
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0b5340] hover:bg-[#083e30] text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة حساب جديد الآن</span>
            </button>
          </div>
        ) : (
          filteredAccounts.map((acc, index) => {
            const rowNumber = acc.code || String(index + 1);

            return (
              <div
                key={acc.id}
                className={`bg-white rounded-md border transition-all duration-150 p-2.5 grid grid-cols-12 gap-3 items-center shadow-2xs hover:shadow-xs hover:border-slate-400 ${
                  acc.isLocked ? 'border-amber-300 bg-amber-50/20' : 'border-slate-300'
                }`}
              >
                {/* 1. عمود: عدد الحسابات (رقم الحساب / التسلسل) - من اليمين */}
                <div className="col-span-2 sm:col-span-2 flex items-center gap-2 text-right">
                  <div className="bg-[#fffdf2] border border-[#e5dfc5] text-slate-800 font-bold text-xs sm:text-sm font-mono px-2.5 py-1 rounded min-w-[36px] text-center shadow-2xs shrink-0 select-text">
                    {rowNumber}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                    #{index + 1}
                  </span>
                </div>

                {/* 2. عمود: اسم الحساب (بدون رصيد وبدون عملة) */}
                <div className="col-span-5 sm:col-span-5 flex items-center gap-2 text-right overflow-hidden">
                  <span className="font-bold text-slate-900 text-sm sm:text-base truncate select-text">
                    {acc.name}
                  </span>
                  {acc.type === 'cash_box' && acc.linkedVaultId && (
                    <span className="hidden md:inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                      <Vault className="w-3 h-3 text-purple-600" />
                      <span>مرتبط بخزنة</span>
                    </span>
                  )}
                  {acc.isLocked && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                      <Lock className="w-3 h-3 text-amber-700" />
                      <span>مقفل</span>
                    </span>
                  )}
                </div>

                {/* 3. عمود: نوع الحساب */}
                <div className="col-span-3 sm:col-span-3 flex items-center justify-start">
                  {getTypeBadge(acc.type)}
                </div>

                {/* 4. عمود: الاجرائات (أزرار: حذف - قفل - تعديل وبدون +) - من اليسار */}
                <div className="col-span-2 sm:col-span-2 flex items-center justify-end sm:justify-center gap-1.5 shrink-0">
                  
                  {/* زر التعديل (أخضر زمردي) */}
                  <button
                    onClick={() => openEditModal(acc)}
                    className="w-8 h-8 bg-[#ebfbee] hover:bg-[#d3f9d8] text-[#2b8a3e] border border-[#b2f2bb] rounded flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    title="تعديل بيانات الحساب"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* زر القفل (أصفر/رمادي لتبديل حالة قفل الحساب) */}
                  <button
                    onClick={() => onToggleLockAccount && onToggleLockAccount(acc.id)}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors shadow-2xs cursor-pointer border ${
                      acc.isLocked
                        ? 'bg-[#fff8e6] hover:bg-[#ffecb3] text-[#b78103] border-[#ffe082]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                    title={acc.isLocked ? 'الحساب مقفل - انقر لفك القفل' : 'قفل الحساب'}
                  >
                    {acc.isLocked ? <Lock className="w-4 h-4 text-amber-700" /> : <Unlock className="w-4 h-4" />}
                  </button>

                  {/* زر الحذف (أحمر نبيذي) */}
                  <button
                    onClick={() => setAccountToDelete(acc)}
                    className="w-8 h-8 bg-[#fdf2f2] hover:bg-[#fae1e3] text-[#b02a37] border border-[#f5c6cb] rounded flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    title="حذف الحساب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* شريط التحكم السفلي الموحد */}
      <div className="bg-slate-100/90 px-5 py-3 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
            }}
            className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="إفراغ وتصفير الفلاتر (F3)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>تفريغ .F3</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="طباعة الدليل (F6)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>طباعة .F6</span>
          </button>

          <button
            type="button"
            onClick={openSweepModal}
            className="h-8 px-3.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="تصفير الصندوق وتوريد النقدية إلى الخزنة المركزية"
          >
            <Vault className="w-3.5 h-3.5 text-purple-200" />
            <span>تصفير وتوريد للخزنة</span>
          </button>

          {onNavigateToBankAccounts && (
            <button
              type="button"
              onClick={onNavigateToBankAccounts}
              className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              title="إدارة بيانات وعناوين الوكلاء (حسابات البنوك)"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>إدارة الوكلاء</span>
            </button>
          )}
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
            onClick={openAddModal}
            className="h-8 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
            title="إضافة حساب جديد (F2)"
          >
            <Plus className="w-4 h-4 text-sky-200" />
            <span>إضافة حساب .F2</span>
          </button>
        </div>
      </div>

      {/* 5. نافذة إنشاء / تعديل الحساب المحاسبي */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" 
          dir="rtl"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-sky-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* ترويسة النافذة بالنسق الموحد */}
            <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 flex items-center justify-between shadow-sm select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center text-sky-200 border border-white/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">
                  {editingAccountId ? 'تعديل بيانات الحساب' : 'إنشاء حساب جديد'}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
                title="إغلاق (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 space-y-4 text-xs">
              
              {/* الصف الأول: رقم الحساب + اسم الحساب */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">
                    رقم الحساب *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="101"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono font-bold text-center text-sm text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    اسم الحساب *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اكتب اسم الحساب..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-sm text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                  />
                </div>
              </div>

              {/* الصف الثاني: نوع الحساب + الخزنة المرتبطة في حال كان صندوق */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    نوع الحساب *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                  >
                    <option value="cash_box">صندوق</option>
                    <option value="vault">خزنة</option>
                    <option value="bank">بنك</option>
                    <option value="client">عميل</option>
                    <option value="expenses">مصروفات</option>
                    <option value="revenues">ايرادات</option>
                  </select>
                </div>

                {type === 'cash_box' ? (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      الخزنة المرتبطة
                    </label>
                    <select
                      value={linkedVaultId}
                      onChange={(e) => setLinkedVaultId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                    >
                      <option value="">-- بدون ربط --</option>
                      {availableVaults.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.code || '-'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      المدينة / الفرع
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="بغداد"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                    />
                  </div>
                )}
              </div>

              {/* في حال كان بنك، نعرض عنوان البنك التفصيلي ورقم موبايل البنك المخصص */}
              {type === 'bank' && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      عنوان البنك والفرع التفصيلي المربوط بالحساب *
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: بغداد - المنصور - شارع 14 رمضان قرب مطعم الساعة"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      * يرتبط هذا العنوان تلقائياً مع الحوالة الصادرة كعنوان للوكيل المسلم
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      رقم موبايل البنك المخصص *
                    </label>
                    <input
                      type="tel"
                      placeholder="0770xxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                    />
                  </div>
                </>
              )}

              {/* في حال كان صندوق، نعرض المدينة ورقم الهاتف في صف مستقل */}
              {type === 'cash_box' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      المدينة / الفرع
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="بغداد"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      placeholder="0770xxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                    />
                  </div>
                </div>
              )}

              {/* إذا لم يكن صندوق ولا بنك، نعرض رقم الهاتف هنا */}
              {type !== 'cash_box' && type !== 'bank' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    placeholder="0770xxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                  />
                </div>
              )}

              {/* العملات المعتمدة - أزرار مباشرة ونظيفة */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  العملة المعتمدة
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCurrencies(['IQD'])}
                    className={`py-2 px-3 rounded border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedCurrencies.length === 1 && selectedCurrencies.includes('IQD')
                        ? 'bg-[#0b5a49] text-white border-[#0b5a49] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    دينار عراقي (IQD)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCurrencies(['USD'])}
                    className={`py-2 px-3 rounded border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedCurrencies.length === 1 && selectedCurrencies.includes('USD')
                        ? 'bg-[#0b5a49] text-white border-[#0b5a49] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    دولار أمريكي (USD)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCurrencies(['IQD', 'USD'])}
                    className={`py-2 px-3 rounded border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedCurrencies.includes('IQD') && selectedCurrencies.includes('USD')
                        ? 'bg-[#0b5a49] text-white border-[#0b5a49] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    العملتان (IQD + USD)
                  </button>
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ملاحظات
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b5a49] focus:ring-1 focus:ring-[#0b5a49]"
                />
              </div>

              {/* خيار تجميد الحساب */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lockAccountCheckbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="w-4 h-4 text-[#0b5a49] rounded border-slate-300 focus:ring-[#0b5a49] cursor-pointer"
                />
                <label htmlFor="lockAccountCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  قفل الحساب (تجميد العمليات)
                </label>
              </div>

              {/* أزرار الحفظ والإلغاء الموحدة */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء (ESC)
                </button>
                <button
                  type="submit"
                  className="h-9 px-6 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAccountId ? 'حفظ التعديلات' : 'حفظ الحساب .F9'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. نافذة تصفير الصندوق وتوريد النقد إلى الخزنة */}
      {isSweepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border-2 border-purple-400 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* رأس النافذة */}
            <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
                  <Vault className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">تصفير الصندوق وتوريد النقد إلى الخزنة</h3>
                  <p className="text-xs text-purple-200">القيد: الصندوق دائن (تصفير) • الخزنة مدين (استلام النقد)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSweepModalOpen(false)} 
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sweepSuccessMessage ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">تم ترحيل القيد بنجاح!</h4>
                <p className="text-xs text-slate-600 font-medium">{sweepSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmSweep} className="p-5 space-y-4 text-xs">
                
                {/* تنبيه إذا لم تكن هناك خزائن مضافة بعد */}
                {availableVaults.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl text-amber-900 space-y-2 text-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
                    <p className="font-bold text-sm">لا توجد حسابات من نوع "خزنة" حالياً في الدليل</p>
                    <p className="text-xs text-amber-800">
                      يرجى أولاً إنشاء حساب جديد وتحديد نوعه كـ <strong>خزنة</strong> (مثل: الخزنة المركزية، أو خزنة الإدارة) لتتمكن من تصفير الصناديق إليها.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSweepModalOpen(false);
                          openAddModal();
                          setType('vault');
                          setName('الخزنة المركزية');
                        }}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-sm"
                      >
                        إضافة "الخزنة المركزية" الآن
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* اختيار الصندوق المراد تصفيره */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-amber-600" />
                          <span>الصندوق المسلّم (الطرف الدائن - ينقص رصيده):</span>
                        </span>
                        {selectedSweepCashBox && (
                          <span className="text-[11px] font-mono font-bold text-slate-600">
                            الرصيد: {selectedSweepCashBox.balanceUSD.toLocaleString()} $ | {selectedSweepCashBox.balanceIQD.toLocaleString()} د.ع
                          </span>
                        )}
                      </label>
                      <select
                        value={sweepCashBoxId}
                        onChange={(e) => handleSweepCashBoxChange(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 rounded-lg font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                      >
                        {availableCashBoxes.length === 0 && (
                          <option value="">لا توجد صناديق مضافة</option>
                        )}
                        {availableCashBoxes.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} (رقم: {b.code || '-'}) [رصيده: {b.balanceUSD.toLocaleString()} $ / {b.balanceIQD.toLocaleString()} د.ع]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* سهم الانتقال البصري */}
                    <div className="flex items-center justify-center py-0.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-300 shadow-2xs">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>
                    </div>

                    {/* اختيار الخزنة المستلمة */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Vault className="w-4 h-4 text-purple-700" />
                          <span>الخزنة المستلمة (الطرف المدين - يزيد رصيدها):</span>
                        </span>
                        {selectedSweepVault && (
                          <span className="text-[11px] font-mono font-bold text-purple-800">
                            الرصيد: {selectedSweepVault.balanceUSD.toLocaleString()} $ | {selectedSweepVault.balanceIQD.toLocaleString()} د.ع
                          </span>
                        )}
                      </label>
                      <select
                        value={sweepVaultId}
                        onChange={(e) => setSweepVaultId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#fffef0] border border-purple-300 rounded-lg font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                      >
                        {availableVaults.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} (رقم: {v.code || '-'}) [رصيده: {v.balanceUSD.toLocaleString()} $ / {v.balanceIQD.toLocaleString()} د.ع]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* نوع العملة والمبلغ وزر تصفير كامل الرصيد */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">العملة</label>
                        <select
                          value={sweepCurrency}
                          onChange={(e) => setSweepCurrency(e.target.value as CurrencyCode)}
                          className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                        >
                          <option value="USD">دولار أمريكي ($)</option>
                          <option value="IQD">دينار عراقي (د.ع)</option>
                          <option value="EUR">يورو (€)</option>
                          <option value="TRY">ليرة تركية (TL)</option>
                          <option value="AED">درهم إماراتي (AED)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-700 font-bold">المبلغ المراد ترحيله *</label>
                          <button
                            type="button"
                            onClick={handleFillFullBalance}
                            className="text-[11px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
                          >
                            تصفير كامل رصيد الصندوق
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            required
                            min="0.01"
                            value={sweepAmountStr}
                            onChange={(e) => setSweepAmountStr(e.target.value)}
                            placeholder="مثال: 1000"
                            className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-purple-600 shadow-inner"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500 font-mono">
                            {sweepCurrency}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* البطاقة الإيضاحية للقيد المحاسبي المولد كما طلبه المستخدم بالتمام */}
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-700 space-y-2 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                        <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          <span>القيد المحاسبي المزدوج الناتج عن هذه العملية:</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">قيد يومية معتمد</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* الطرف المدين (أحمر) */}
                        <div className="bg-rose-950/40 p-2 rounded-lg border border-rose-700/50">
                          <span className="block text-[10px] font-bold text-rose-400">الطرف المدين (Debit) 🔴</span>
                          <span className="font-bold text-slate-100 block truncate">
                            {selectedSweepVault ? selectedSweepVault.name : 'الخزنة'}
                          </span>
                          <span className="text-[11px] text-rose-200 font-mono">
                            +{parseFloat(sweepAmountStr || '0').toLocaleString()} {sweepCurrency}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5">استلام النقدية في الخزنة</p>
                        </div>

                        {/* الطرف الدائن (أخضر) */}
                        <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-700/50">
                          <span className="block text-[10px] font-bold text-emerald-400">الطرف الدائن (Credit) 🟢</span>
                          <span className="font-bold text-slate-100 block truncate">
                            {selectedSweepCashBox ? selectedSweepCashBox.name : 'الصندوق'}
                          </span>
                          <span className="text-[11px] text-emerald-200 font-mono">
                            -{parseFloat(sweepAmountStr || '0').toLocaleString()} {sweepCurrency}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5">تصفير ونقصان نقدية الصندوق</p>
                        </div>
                      </div>
                    </div>

                    {/* الأزرار */}
                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsSweepModalOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedSweepCashBox || !selectedSweepVault}
                        className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Vault className="w-3.5 h-3.5" />
                        <span>تأكيد القيد وتصفير الصندوق</span>
                      </button>
                    </div>
                  </>
                )}

              </form>
            )}

          </div>
        </div>
      )}

      {/* 7. نافذة تأكيد حذف الحساب */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-slate-300 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">تأكيد حذف الحساب المحاسبي</h3>
                <p className="text-[11px] text-slate-500">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>اسم الحساب:</span>
                <span>{accountToDelete.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>رقم الحساب:</span>
                <span className="font-mono">{accountToDelete.code || '-'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>النوع:</span>
                <span>{getTypeLabel(accountToDelete.type)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                نعم، احذف الحساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. نافذة تأكيد مسح كافة الحسابات */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-slate-300 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">مسح كافة الحسابات من الدليل</h3>
                <p className="text-[11px] text-slate-500">سيتم تفريغ دليل الحسابات بالكامل والبدء من جديد</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-rose-50 p-3 rounded border border-rose-200 font-medium">
              هل أنت متأكد من رغبتك في حذف جميع الحسابات ({accounts.length} حساب) من الدليل؟
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                تأكيد مسح الكل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
