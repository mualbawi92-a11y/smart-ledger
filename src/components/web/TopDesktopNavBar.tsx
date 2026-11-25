import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  ArrowUpRight,
  ArrowDownLeft,
  CircleDollarSign,
  Users, 
  BarChart3, 
  Settings, 
  ChevronDown, 
  Plus, 
  FileText, 
  Scale, 
  ArrowRightLeft, 
  ShieldCheck, 
  Sun, 
  Moon, 
  LogOut, 
  RotateCw,
  Coins,
  Minus,
  Square,
  X,
  Landmark,
  Wallet,
  Receipt,
  UserPlus,
  KeyRound,
  HardDrive,
  Clock,
  Layers,
  BookOpenCheck
} from 'lucide-react';
import { WebScreenTab, SettingsSubTab } from './WebSidebar';
import { AuthSessionUser } from './LoginScreen';

interface TopDesktopNavBarProps {
  currentTab: WebScreenTab;
  onSelectTab: (tab: WebScreenTab) => void;
  onSelectSettingsSubTab?: (sub: SettingsSubTab) => void;
  currentUser?: AuthSessionUser | null;
  companyName?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onOpenIssueTransfer: () => void;
  onOpenPayoutTransfer: () => void;
  onOpenExchange: () => void;
  onOpenTransfers: () => void;
  onOpenAccounts: () => void;
  onOpenAddAccount?: () => void;
  onOpenStatement: () => void;
  onOpenReceiptVoucher: () => void;
  onOpenPaymentVoucher: () => void;
  onOpenDoubleEntry: () => void;
  onOpenFundTransfer: () => void;
  onOpenTrialBalance: () => void;
  onOpenCashFlow: () => void;
  onOpenBankAccounts: () => void;
  onOpenAgents: () => void;
  onOpenUsersManagement: () => void;
  onRefreshData?: () => void;
}

export const TopDesktopNavBar: React.FC<TopDesktopNavBarProps> = ({
  currentTab,
  onSelectTab,
  onSelectSettingsSubTab,
  currentUser,
  companyName = 'شركة الصرافة والتحويلات المالية',
  isDarkMode = false,
  onToggleTheme,
  onLogout,
  onOpenIssueTransfer,
  onOpenPayoutTransfer,
  onOpenExchange,
  onOpenTransfers,
  onOpenAccounts,
  onOpenAddAccount,
  onOpenStatement,
  onOpenReceiptVoucher,
  onOpenPaymentVoucher,
  onOpenDoubleEntry,
  onOpenFundTransfer,
  onOpenTrialBalance,
  onOpenCashFlow,
  onOpenBankAccounts,
  onOpenAgents,
  onOpenUsersManagement,
  onRefreshData,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(prev => prev === menu ? null : menu);
  };

  const handleMenuClick = (action: () => void) => {
    action();
    setOpenDropdown(null);
  };

  return (
    <div className="w-full shrink-0 z-40 select-none shadow-md font-sans text-xs" dir="rtl" ref={dropdownRef}>
      
      {/* 1. Desktop Window Frame Header (Desktop title bar matching reference screenshot) */}
      <div className="w-full bg-[#07243d] text-slate-300 px-3 py-1 flex items-center justify-between text-[11px] border-b border-[#0f385c]">
        {/* Right side in RTL: Window title & icon */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-tr from-emerald-500 to-sky-600 flex items-center justify-center text-white text-[9px] font-black">
            💼
          </div>
          <span className="font-bold text-slate-200">
            تطبيق المحاسب الذكي - {companyName || 'نظام إدارة الصرافة والحوالات والحسابات المالية'}
          </span>
        </div>

        {/* Left side in RTL: Window controls (Minimize, Maximize, Close) */}
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <button 
            type="button" 
            className="w-6 h-5 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
            title="تصغير"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button 
            type="button" 
            className="w-6 h-5 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
            title="تكبير / استعادة"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button 
            type="button" 
            onClick={onLogout}
            className="w-6 h-5 rounded hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق البرنامج"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Main Navigation Bar with Dropdown Menus (#0c3356 dark navy style matching reference) */}
      <div className="w-full bg-[#0c3356] text-white px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#144773]">
        
        {/* Right side (RTL): Brand Badge + Horizontal Menu */}
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          
          {/* Logo Badge (Red/Coral framed crest badge matching screenshot layout) */}
          <div 
            onClick={() => onSelectTab('dashboard')} 
            className="flex items-center gap-2.5 bg-gradient-to-l from-white/10 to-transparent p-1.5 pr-2 pl-3 rounded-2xl border border-white/15 cursor-pointer hover:border-white/30 transition-all shadow-inner"
          >
            {/* Crest Icon in Red/Coral rounded box */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-red-600 border-2 border-white/80 text-white flex items-center justify-center shadow-md p-1.5 shrink-0">
              <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="url(#crest-badge-grad)" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M12 6V18M7.5 9.5L16.5 14.5M16.5 9.5L7.5 14.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="2.5" fill="#fde047" stroke="#ffffff" strokeWidth="1"/>
                <defs>
                  <linearGradient id="crest-badge-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f43f5e"/>
                    <stop offset="1" stopColor="#be123c"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <div className="flex flex-col text-right">
              <span className="font-black text-xs sm:text-sm tracking-tight text-white leading-tight">
                {companyName || 'المحاسب الذكي - Smart Ledger'}
              </span>
              <span className="text-[9.5px] sm:text-[10px] text-sky-200 font-medium font-sans tracking-wide">
                نظام إدارة الصرافة والحوالات المالية
              </span>
            </div>
          </div>

          {/* Horizontal Desktop Menu Items */}
          <nav className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            
            {/* 1. الرئيسية (Home - Active Cyan Pill matching screenshot) */}
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs ${
                currentTab === 'dashboard'
                  ? 'bg-[#0284c7] text-white shadow-md ring-2 ring-sky-300/30'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>

            {/* 2. الحوالات المالية 💸 ▾ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('transfers')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  openDropdown === 'transfers' || currentTab === 'transfers' || currentTab === 'issue_transfer' || currentTab === 'payout_transfer'
                    ? 'bg-white/15 text-white ring-1 ring-white/20'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-sky-300" />
                <span>الحوالات المالية</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openDropdown === 'transfers' && (
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-1.5 space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenIssueTransfer)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-sky-50 hover:text-sky-900 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-sky-600" />
                      <span>إصدار حوالة جديدة</span>
                    </span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-mono font-bold">F2</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenPayoutTransfer)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-sky-50 hover:text-sky-900 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      <span>صرف وتسليم حوالة</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">F3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenTransfers)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-sky-50 hover:text-sky-900 flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>سجل الحوالات العامة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenAgents)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-sky-50 hover:text-sky-900 flex items-center gap-2 transition-colors border-t border-slate-100"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>شبكة الوكلاء والمندوبين</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. الصرافة والعملات 💱 ▾ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('exchange')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  openDropdown === 'exchange' || currentTab === 'exchange'
                    ? 'bg-white/15 text-white ring-1 ring-white/20'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <CircleDollarSign className="w-4 h-4 text-emerald-300" />
                <span>الصرافة والعملات</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openDropdown === 'exchange' && (
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-1.5 space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenExchange)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                      <span>شراء وبيع العملات</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">F4</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenExchange)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition-colors"
                  >
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>نشرة أسعار الصرف الحية</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. الحسابات والزبائن 👥 ▾ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('accounts')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  openDropdown === 'accounts' || currentTab === 'accounts' || currentTab === 'statement' || currentTab === 'double_entry'
                    ? 'bg-white/15 text-white ring-1 ring-white/20'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4 text-purple-300" />
                <span>الحسابات والزبائن</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openDropdown === 'accounts' && (
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-1.5 space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenAccounts)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>دليل الزبائن والحسابات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenStatement)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>كشف حساب تفصيلي للزبون</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenReceiptVoucher)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between transition-colors border-t border-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      <span>سند قبض نقدي (إيداع)</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">له 🟢</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenPaymentVoucher)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-rose-50 hover:text-rose-900 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-rose-600" />
                      <span>سند صرف نقدي (سحب)</span>
                    </span>
                    <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">عليه 🔴</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenDoubleEntry)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors border-t border-slate-100"
                  >
                    <Scale className="w-4 h-4 text-purple-600" />
                    <span>سند قيد مزدوج (يومية عامة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenBankAccounts)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors"
                  >
                    <Landmark className="w-4 h-4 text-indigo-600" />
                    <span>حسابات البنوك والمصارف</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. الصناديق والخزينة 🏦 ▾ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('funds')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  openDropdown === 'funds' || currentTab === 'fund_transfer' || currentTab === 'cash_flow'
                    ? 'bg-white/15 text-white ring-1 ring-white/20'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Wallet className="w-4 h-4 text-amber-300" />
                <span>الصناديق والخزينة</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openDropdown === 'funds' && (
                <div className="absolute top-full right-0 mt-1.5 w-64 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-1.5 space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenFundTransfer)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                      <span>مناقلة وتوريد النقد للخزنة</span>
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">تحويل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenCashFlow)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 transition-colors"
                  >
                    <Coins className="w-4 h-4 text-sky-600" />
                    <span>حركة المقبوضات والمدفوعات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenTrialBalance)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 transition-colors border-t border-slate-100"
                  >
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span>كشف أرصدة الصناديق والخزينة</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. التقارير المالية 📈 ▾ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('reports')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  openDropdown === 'reports' || currentTab === 'trial_balance'
                    ? 'bg-white/15 text-white ring-1 ring-white/20'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-teal-300" />
                <span>التقارير المالية</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openDropdown === 'reports' && (
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-1.5 space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenTrialBalance)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 transition-colors"
                  >
                    <BookOpenCheck className="w-4 h-4 text-teal-600" />
                    <span>ميزان المراجعة العام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenCashFlow)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 transition-colors"
                  >
                    <Scale className="w-4 h-4 text-sky-600" />
                    <span>تقرير الأرباح والعمولات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenStatement)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 transition-colors border-t border-slate-100"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>كشوفات الحسابات الشاملة</span>
                  </button>
                </div>
              )}
            </div>

            {/* 7. الإعدادات ⚙️ ▾ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('settings')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  openDropdown === 'settings' || currentTab === 'settings' || currentTab === 'users'
                    ? 'bg-white/15 text-white ring-1 ring-white/20'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-300" />
                <span>الإعدادات</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openDropdown === 'settings' && (
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-1.5 space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(() => {
                      if (onSelectSettingsSubTab) onSelectSettingsSubTab('company');
                      onSelectTab('settings');
                    })}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span>بيانات الشركة والفرع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(onOpenUsersManagement)}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>المستخدمين والصلاحيات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(() => {
                      if (onSelectSettingsSubTab) onSelectSettingsSubTab('backup');
                      onSelectTab('settings');
                    })}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                  >
                    <HardDrive className="w-4 h-4 text-teal-600" />
                    <span>النسخ الاحتياطي والأرشفة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuClick(() => {
                      if (onSelectSettingsSubTab) onSelectSettingsSubTab('license');
                      onSelectTab('settings');
                    })}
                    className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors border-t border-slate-100"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>ترخيص النظام ورقم النسخة</span>
                  </button>

                  {onToggleTheme && (
                    <button
                      type="button"
                      onClick={() => handleMenuClick(onToggleTheme)}
                      className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                        <span>{isDarkMode ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}</span>
                      </span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => handleMenuClick(onLogout)}
                      className="w-full px-3 py-2 text-right rounded-xl font-bold hover:bg-rose-50 text-rose-700 flex items-center gap-2 transition-colors border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* Left side (RTL): User profile pill & quick refresh */}
        <div className="flex items-center gap-2">
          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-white">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-[10px] shadow-2xs">
              {currentUser?.username ? currentUser.username.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="flex flex-col text-right leading-tight">
              <span className="font-bold text-[11px] truncate max-w-[100px]">
                {currentUser?.fullName || currentUser?.username || 'admin'}
              </span>
              <span className="text-[9px] text-emerald-300 font-semibold">
                {currentUser?.userType || 'المدير العام'}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
