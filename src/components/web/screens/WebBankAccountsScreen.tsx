import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Phone, 
  MapPin, 
  FileText, 
  Printer, 
  RotateCcw, 
  X, 
  Check, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  SendHorizontal, 
  Wallet,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { AccountItem, CurrencyCode, TransactionRecord } from '../../../types';
import { INITIAL_PROGRAM_CITIES } from '../../../data/initialData';

export interface WebBankAccountsScreenProps {
  accounts: AccountItem[];
  onAddAccount: (acc: AccountItem) => void;
  onUpdateAccount?: (acc: AccountItem) => void;
  onDeleteAccount?: (id: string) => void;
  onToggleLockAccount?: (id: string) => void;
  onClose?: () => void;
  onNavigateToStatement?: (accountId: string) => void;
  onOpenIssueTransferWithBank?: (bankName: string, bankContact: string) => void;
  companyName?: string;
  systemUser?: string;
}

export const WebBankAccountsScreen: React.FC<WebBankAccountsScreenProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onToggleLockAccount,
  onClose,
  onNavigateToStatement,
  companyName = '',
  systemUser = 'المدير المالي',
}) => {
  // تصفية حسابات البنوك فقط من دليل الحسابات
  const bankAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'bank');
  }, [accounts]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');

  // نوافذ الإضافة والتعديل
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  // اختيار حساب الوكيل من فئة البنوك في دليل الحسابات
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');

  // حقول نموذج الوكيل (العنوان ورقم الموبايل الخاص به)
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [bankPhone, setBankPhone] = useState('');
  const [bankCity, setBankCity] = useState('بغداد');
  const [bankCurrencies, setBankCurrencies] = useState<CurrencyCode[]>(['IQD', 'USD']);
  const [bankNotes, setBankNotes] = useState('');

  // تأكيد الحذف
  const [bankToDelete, setBankToDelete] = useState<AccountItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // توليد كود تلقائي للبنوك (يبدأ بـ 200)
  const getNextBankCode = () => {
    const existingCodes = bankAccounts
      .map(b => parseInt(b.code || '0', 10))
      .filter(n => !isNaN(n) && n >= 200);
    if (existingCodes.length === 0) return '201';
    return String(Math.max(...existingCodes) + 1);
  };

  // عند اختيار حساب بنك من القائمة المنسدلة لدليل الحسابات
  const handleSelectBankAccountOption = (accId: string) => {
    setSelectedBankAccountId(accId);
    if (accId === '__NEW__') {
      setBankCode(getNextBankCode());
      setBankName('');
      setBankAddress('');
      setBankPhone('');
      setBankCity('بغداد');
      setBankNotes('');
      setBankCurrencies(['IQD', 'USD']);
    } else {
      const selected = bankAccounts.find(b => b.id === accId);
      if (selected) {
        setBankCode(selected.code || '');
        setBankName(selected.name);
        setBankAddress(selected.address || selected.notes || '');
        setBankPhone(selected.phone || '');
        setBankCity(selected.city || 'بغداد');
        setBankCurrencies(selected.currencies && selected.currencies.length > 0 ? selected.currencies : ['IQD', 'USD']);
        setBankNotes(selected.notes || '');
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingBankId(null);
    if (bankAccounts.length > 0) {
      // اختيار أول حساب بنك تلقائياً لراحة المستخدم
      const firstBank = bankAccounts[0];
      setSelectedBankAccountId(firstBank.id);
      setBankCode(firstBank.code || '');
      setBankName(firstBank.name);
      setBankAddress(firstBank.address || firstBank.notes || '');
      setBankPhone(firstBank.phone || '');
      setBankCity(firstBank.city || 'بغداد');
      setBankCurrencies(firstBank.currencies && firstBank.currencies.length > 0 ? firstBank.currencies : ['IQD', 'USD']);
      setBankNotes(firstBank.notes || '');
    } else {
      setSelectedBankAccountId('__NEW__');
      setBankCode(getNextBankCode());
      setBankName('');
      setBankAddress('');
      setBankPhone('');
      setBankCity('بغداد');
      setBankCurrencies(['IQD', 'USD']);
      setBankNotes('');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bank: AccountItem) => {
    setEditingBankId(bank.id);
    setSelectedBankAccountId(bank.id);
    setBankCode(bank.code || '');
    setBankName(bank.name);
    setBankAddress(bank.address || bank.notes || '');
    setBankPhone(bank.phone || '');
    setBankCity(bank.city || 'بغداد');
    setBankCurrencies(bank.currencies && bank.currencies.length > 0 ? bank.currencies : ['IQD', 'USD']);
    setBankNotes(bank.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      alert('يرجى اختيار أو إدخال اسم الوكيل');
      return;
    }

    if (editingBankId) {
      // تعديل بيانات الوكيل الموجود
      const target = bankAccounts.find(b => b.id === editingBankId);
      if (!target) return;

      const updatedBank: AccountItem = {
        ...target,
        code: bankCode.trim() || target.code,
        name: bankName.trim(),
        address: bankAddress.trim(),
        phone: bankPhone.trim(),
        city: bankCity.trim(),
        currencies: bankCurrencies,
        notes: bankNotes.trim(),
      };

      if (onUpdateAccount) {
        onUpdateAccount(updatedBank);
      }
      showToast('✔ تم تحديث بيانات وتفاصيل الوكيل بنجاح!');
    } else if (selectedBankAccountId && selectedBankAccountId !== '__NEW__') {
      // تحديث وتعيين بيانات الوكيل على حساب البنك المختار من دليل الحسابات
      const target = bankAccounts.find(b => b.id === selectedBankAccountId);
      if (target) {
        const updatedBank: AccountItem = {
          ...target,
          code: bankCode.trim() || target.code,
          name: bankName.trim() || target.name,
          address: bankAddress.trim(),
          phone: bankPhone.trim(),
          city: bankCity.trim(),
          currencies: bankCurrencies,
          notes: bankNotes.trim(),
        };

        if (onUpdateAccount) {
          onUpdateAccount(updatedBank);
        }
        showToast('✔ تم حفظ وتعيين تفاصيل الوكيل في دليل الحسابات بنجاح!');
      }
    } else {
      // إضافة حساب بنك جديد كوكيل إلى دليل الحسابات
      const newBank: AccountItem = {
        id: `acc-bank-${Date.now()}`,
        code: bankCode.trim() || getNextBankCode(),
        name: bankName.trim(),
        type: 'bank',
        address: bankAddress.trim(),
        phone: bankPhone.trim(),
        city: bankCity.trim(),
        currencies: bankCurrencies,
        balanceIQD: 0,
        balanceUSD: 0,
        notes: bankNotes.trim(),
      };

      onAddAccount(newBank);
      showToast('✔ تم إضافة حساب الوكيل الجديد إلى دليل الحسابات بنجاح!');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!bankToDelete) return;
    if (onDeleteAccount) {
      onDeleteAccount(bankToDelete.id);
      showToast('تم حذف حساب البنك');
    }
    setBankToDelete(null);
  };

  // فلترة قائمة البنوك
  const filteredBanks = useMemo(() => {
    return bankAccounts.filter(bank => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = 
        !q ||
        bank.name.toLowerCase().includes(q) ||
        (bank.code && bank.code.toLowerCase().includes(q)) ||
        (bank.phone && bank.phone.includes(q)) ||
        (bank.address && bank.address.toLowerCase().includes(q)) ||
        (bank.city && bank.city.toLowerCase().includes(q));

      const matchesCity = selectedCityFilter === 'all' || bank.city === selectedCityFilter;

      return matchesSearch && matchesCity;
    });
  }, [bankAccounts, searchTerm, selectedCityFilter]);

  // دعم اختصارات الكيبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (e.key === 'Escape' && !isInput) {
        if (isModalOpen) setIsModalOpen(false);
        else if (bankToDelete) setBankToDelete(null);
        else if (onClose) onClose();
      }

      if (e.key === 'F2' && !isInput && !isModalOpen) {
        e.preventDefault();
        handleOpenAddModal();
      }

      if (e.key === 'F6' && !isInput) {
        e.preventDefault();
        window.print();
      }

      if (e.key === 'F3' && !isInput) {
        e.preventDefault();
        setSearchTerm('');
        setSelectedCityFilter('all');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, bankToDelete, onClose]);

  const formatNum = (val: number) => {
    if (val === 0) return '0';
    return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="p-3.5 sm:p-5 space-y-3.5 w-full max-w-full mx-auto text-slate-800" dir="rtl">
      
      {/* 1. الترويسة العلوية الموحدة بالهوية الزرقاء الملكية */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-sky-200 border border-white/20 shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>إدارة الوكلاء</span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-sky-100 border border-white/20">
                {bankAccounts.length} وكيل معتمد
              </span>
            </h1>
            <p className="text-[11px] text-sky-100/80">
              إدارة بيانات وعناوين وأرقام هواتف الوكلاء المعتمدين لتسليم الحوالات والمربوطين بدليل الحسابات
            </p>
          </div>
        </div>

        {/* أزرار الإجراءات السريعة */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="إضافة وتحديد تفاصيل وكيل جديد (F2)"
          >
            <Plus className="w-4 h-4 text-emerald-200 stroke-[3]" />
            <span>إضافة تفاصيل وكيل .F2</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="طباعة قائمة الوكلاء (F6)"
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

      {/* توست التنبيه */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. شريط الفلاتر والبحث بسطر واحد بخلفية الحقول المعتمدة [#fffef0] */}
      <div className="p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
        <div className="flex items-end gap-2 text-xs flex-wrap sm:flex-nowrap">
          
          {/* حقل البحث السريع */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5 whitespace-nowrap">بحث سريع بالوكلاء:</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="اسم الوكيل، العنوان، رقم الموبايل، أو الكود..."
                className="w-full h-8 pl-7 pr-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-6 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* فلتر المدينة */}
          <div className="w-44 shrink-0">
            <label className="block text-[10px] font-bold text-slate-700 mb-0.5 whitespace-nowrap">المدينة / المحافظة:</label>
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="w-full h-8 px-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner cursor-pointer"
            >
              <option value="all">كافة المدن (الكل)</option>
              {INITIAL_PROGRAM_CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* زر تفريغ الفلاتر */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCityFilter('all');
              }}
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="إفراغ الفلاتر (F3)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>تفريغ .F3</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. جدول الوكلاء المعتمدين وتفاصيل العناوين وأرقام الموبايل */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-right text-xs border-collapse">
            
            {/* الترويسة المعتمدة #f0f9ff */}
            <thead className="bg-[#f0f9ff] text-slate-700 font-bold sticky top-0 border-b border-sky-200/80 z-10 shadow-2xs">
              <tr>
                <th className="py-2.5 px-3 border-l border-slate-200/80 w-12 text-center whitespace-nowrap">ت</th>
                <th className="py-2.5 px-3 border-l border-slate-200/80 w-24 text-center whitespace-nowrap">رقم الحساب</th>
                <th className="py-2.5 px-3 border-l border-slate-200/80 min-w-[220px] text-right whitespace-nowrap">اسم الوكيل (حساب البنك)</th>
                <th className="py-2.5 px-3 border-l border-slate-200/80 min-w-[240px] text-right whitespace-nowrap">عنوان الوكيل والفرع المعتمد</th>
                <th className="py-2.5 px-3 border-l border-slate-200/80 min-w-[150px] text-right whitespace-nowrap">رقم موبايل الوكيل</th>
                <th className="py-2.5 px-3 border-l border-slate-200/80 w-28 text-center whitespace-nowrap">المدينة</th>
                <th className="py-2.5 px-3.5 border-l border-slate-200/80 min-w-[130px] text-left font-mono font-bold text-slate-800 whitespace-nowrap">
                  الرصيد دينار
                </th>
                <th className="py-2.5 px-3.5 border-l border-slate-200/80 min-w-[130px] text-left font-mono font-bold text-slate-800 whitespace-nowrap">
                  الرصيد دولار
                </th>
                <th className="py-2.5 px-3 w-36 text-center whitespace-nowrap">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredBanks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-20 text-slate-400 bg-slate-50/40">
                    <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-bold text-slate-700 text-sm">لا يوجد وكلاء مطابقون للبحث</p>
                    <p className="text-xs text-slate-400 mt-1">انقر على زر «إضافة تفاصيل وكيل .F2» لتعيين تفاصيل أول وكيل من حسابات البنوك</p>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة تفاصيل وكيل الآن</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredBanks.map((bank, index) => {
                  return (
                    <tr
                      key={bank.id}
                      className="hover:bg-slate-50/90 transition-colors h-11"
                    >
                      {/* تسلسل */}
                      <td className="py-2 px-3 border-l border-slate-200/50 text-center font-mono text-slate-400 font-bold">
                        {index + 1}
                      </td>

                      {/* رقم الحساب / الكود */}
                      <td className="py-2 px-3 border-l border-slate-200/50 text-center">
                        <span className="bg-[#fffdf2] border border-[#e5dfc5] text-slate-800 font-bold text-xs font-mono px-2 py-0.5 rounded shadow-2xs">
                          {bank.code || '-'}
                        </span>
                      </td>

                      {/* اسم البنك */}
                      <td className="py-2 px-3 border-l border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {bank.name}
                            </span>
                            {bank.isLocked && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                                مقفل
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* العنوان المربوط */}
                      <td className="py-2 px-3 border-l border-slate-200/50">
                        {bank.address ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{bank.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">لم يتم تحديد العنوان</span>
                        )}
                      </td>

                      {/* رقم الموبايل الخاص به */}
                      <td className="py-2 px-3 border-l border-slate-200/50">
                        {bank.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-900 font-mono font-bold" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>{bank.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">لا يوجد رقم هاتف</span>
                        )}
                      </td>

                      {/* المدينة */}
                      <td className="py-2 px-3 border-l border-slate-200/50 text-center">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[11px] border border-slate-200">
                          {bank.city || 'بغداد'}
                        </span>
                      </td>

                      {/* الرصيد دينار (دائن 🟢 أخضر / مدين 🔴 أحمر) */}
                      <td className={`py-2 px-3.5 border-l border-slate-200/50 text-left font-mono font-black text-xs whitespace-nowrap ${
                        bank.balanceIQD > 0 ? 'text-emerald-700 bg-emerald-50/30' : bank.balanceIQD < 0 ? 'text-rose-700 bg-rose-50/30' : 'text-slate-500'
                      }`}>
                        {formatNum(bank.balanceIQD)} د.ع
                      </td>

                      {/* الرصيد دولار */}
                      <td className={`py-2 px-3.5 border-l border-slate-200/50 text-left font-mono font-black text-xs whitespace-nowrap ${
                        bank.balanceUSD > 0 ? 'text-emerald-700 bg-emerald-50/30' : bank.balanceUSD < 0 ? 'text-rose-700 bg-rose-50/30' : 'text-slate-500'
                      }`}>
                        {formatNum(bank.balanceUSD)} $
                      </td>

                      {/* أزرار الإجراءات */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* زر التعديل والربط */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(bank)}
                            className="p-1.5 bg-[#ebfbee] hover:bg-[#d3f9d8] text-[#2b8a3e] border border-[#b2f2bb] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="تعديل العنوان ورقم الموبايل وبيانات البنك"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* زر كشف الحساب */}
                          {onNavigateToStatement && (
                            <button
                              type="button"
                              onClick={() => onNavigateToStatement(bank.id)}
                              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                              title="عرض كشف حساب الوكيل"
                            >
                              <FileText className="w-3.5 h-3.5 text-sky-600" />
                            </button>
                          )}

                          {/* زر القفل */}
                          {onToggleLockAccount && (
                            <button
                              type="button"
                              onClick={() => onToggleLockAccount(bank.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer shadow-2xs ${
                                bank.isLocked
                                  ? 'bg-[#fff8e6] hover:bg-[#ffecb3] text-[#b78103] border-[#ffe082]'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                              title={bank.isLocked ? 'فك قفل الحساب' : 'قفل الحساب'}
                            >
                              {bank.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* زر الحذف */}
                          <button
                            type="button"
                            onClick={() => setBankToDelete(bank)}
                            className="p-1.5 bg-[#fdf2f2] hover:bg-[#fae1e3] text-[#b02a37] border border-[#f5c6cb] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="حذف حساب الوكيل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* شريط التحكم السفلي */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div>
            <span>إجمالي الوكلاء المسجلين: </span>
            <span className="font-bold font-mono text-slate-900">{filteredBanks.length}</span>
            <span> من أصل </span>
            <span className="font-bold font-mono text-slate-900">{bankAccounts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              * تظهر هذه الحسابات وعناوينها وأرقام هواتفها تلقائياً كخيارات في خانة (اسم الوكيل) بالحوالات الصادرة.
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          4. نافذة تحديد تفاصيل الوكيل بالعنوان ورقم الموبايل (إضافة / تعديل)
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            
            {/* ترويسة النافذة */}
            <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-sky-200 border border-white/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingBankId ? 'تعديل تفاصيل وبيانات الوكيل' : 'إضافة وتحديد تفاصيل الوكيل'}
                  </h3>
                  <p className="text-[10px] text-sky-100/80">
                    تحديد العنوان التفصيلي ورقم الموبايل للوكيل المعتمد لتسليم الحوالات
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* جسم النموذج */}
            <form onSubmit={handleSaveBank} className="p-4 space-y-3.5 bg-[#fbfdfc] text-xs">
              
              {/* اختيار الحساب من فئة البنك في دليل الحسابات عند الإضافة */}
              {!editingBankId && (
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-sky-950">
                      اسم الوكيل (يؤخذ من الحسابات في فئة البنك بدليل الحسابات) *:
                    </label>
                    <span className="text-[10px] bg-sky-200/80 text-sky-900 font-bold px-2 py-0.5 rounded">
                      فئة البنوك
                    </span>
                  </div>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => handleSelectBankAccountOption(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#fffef0] border border-sky-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner cursor-pointer"
                  >
                    <option value="">-- اضغط لاختيار حساب الوكيل من فئة البنوك --</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code ? `[#${b.code}] ` : ''}{b.name} - ({b.city || 'بغداد'})
                      </option>
                    ))}
                    <option value="__NEW__">+ إضافة حساب بنك جديد إلى دليل الحسابات...</option>
                  </select>
                  <p className="text-[10px] text-sky-700">
                    * اختر الحساب المعرف مسبقاً في فئة البنوك لربط عنوانه وتفاصيله، أو اختر إضافة بنك جديد.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* كود الحساب */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم / كود الحساب:</label>
                  <input
                    type="text"
                    required
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="201"
                    className="w-full px-2.5 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-center text-slate-900 focus:outline-none shadow-inner"
                  />
                </div>

                {/* اسم الوكيل */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الوكيل (حساب البنك) *:</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثال: مصرف بغداد - فرع المنصور"
                    className="w-full px-2.5 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              {/* عنوان الوكيل التفصيلي المربوط */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  عنوان الوكيل التفصيلي المربوط بالحساب *:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                    placeholder="مثال: بغداد - المنصور - شارع 14 رمضان قرب مطعم الساعة"
                    className="w-full px-2.5 py-1.5 pl-8 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner"
                  />
                  <MapPin className="w-3.5 h-3.5 text-rose-500 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  هذا العنوان سيتم سحبه تلقائياً إلى خانة «عنوان ورقم الوكيل» عند اختيار هذا الوكيل في الحوالة الصادرة.
                </p>
              </div>

              {/* رقم الموبايل الخاص بالوكيل + المدينة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    رقم موبايل الوكيل المخصص *:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={bankPhone}
                      onChange={(e) => setBankPhone(e.target.value)}
                      placeholder="0770xxxxxxx"
                      dir="ltr"
                      className="w-full px-2.5 py-1.5 pl-8 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:outline-none shadow-inner"
                    />
                    <Phone className="w-3.5 h-3.5 text-sky-600 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">المدينة / المحافظة:</label>
                  <select
                    value={bankCity}
                    onChange={(e) => setBankCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner cursor-pointer"
                  >
                    {INITIAL_PROGRAM_CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* العملات المعتمدة */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">العملات المعتمدة للوكيل:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (bankCurrencies.includes('IQD')) {
                        if (bankCurrencies.length > 1) setBankCurrencies(bankCurrencies.filter(c => c !== 'IQD'));
                      } else {
                        setBankCurrencies([...bankCurrencies, 'IQD']);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                      bankCurrencies.includes('IQD')
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    دينار عراقي (IQD)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (bankCurrencies.includes('USD')) {
                        if (bankCurrencies.length > 1) setBankCurrencies(bankCurrencies.filter(c => c !== 'USD'));
                      } else {
                        setBankCurrencies([...bankCurrencies, 'USD']);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                      bankCurrencies.includes('USD')
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    دولار أمريكي (USD)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (bankCurrencies.includes('EUR')) {
                        setBankCurrencies(bankCurrencies.filter(c => c !== 'EUR'));
                      } else {
                        setBankCurrencies([...bankCurrencies, 'EUR']);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                      bankCurrencies.includes('EUR')
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    يورو (EUR)
                  </button>
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={bankNotes}
                  onChange={(e) => setBankNotes(e.target.value)}
                  placeholder="مثال: رقم الحساب المصرفي IBAN أو اسم الشخص المسؤول..."
                  className="w-full px-2.5 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-medium text-slate-800 focus:outline-none shadow-inner"
                />
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBankId ? 'حفظ التعديلات' : 'حفظ تفاصيل الوكيل'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {bankToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-sm overflow-hidden p-4 space-y-3">
            <h3 className="font-bold text-sm text-rose-800">تأكيد حذف بيانات الوكيل</h3>
            <p className="text-xs text-slate-600">
              هل أنت متأكد من حذف بيانات الوكيل: <span className="font-bold text-slate-900">{bankToDelete.name}</span>؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBankToDelete(null)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                نعم، حذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
