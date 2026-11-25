import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  CircleDollarSign, 
  FileSpreadsheet, 
  SendHorizontal, 
  ArrowDownLeft, 
  HandCoins, 
  Scale, 
  ArrowRightLeft, 
  Settings, 
  UserCog, 
  LogOut,
  Sun,
  Moon,
  Coins,
  Layers,
  Building2,
  Palette,
  Cloud,
  Globe2,
  ArrowUpCircle,
  ArrowRight,
  KeyRound,
  Cpu
} from 'lucide-react';
import { AuthSessionUser } from './LoginScreen';
import { canUserAccessScreen } from '../../utils/permissions';

export type WebScreenTab = 
  | 'dashboard' 
  | 'issue_transfer'
  | 'payout_transfer'
  | 'deposit_withdrawal'
  | 'fund_transfer'
  | 'double_entry'
  | 'trial_balance'
  | 'accounts' 
  | 'bank_accounts'
  | 'transfers' 
  | 'statement'
  | 'exchange' 
  | 'network' 
  | 'deposits' 
  | 'cash_flow' 
  | 'users'
  | 'settings';

export type SettingsSubTab = 'company' | 'license' | 'theme_font' | 'backup' | 'countries' | 'currencies' | 'updates';

interface WebSidebarProps {
  currentTab: WebScreenTab;
  onSelectTab: (tab: WebScreenTab) => void;
  onOpenNewTransaction?: () => void;
  activeView?: 'web' | 'mobile' | 'files';
  onSwitchView?: (view: 'web' | 'mobile' | 'files') => void;
  transactionsCount: number;
  companyName?: string;
  companyLogo?: string;
  onLogout?: () => void;
  userRole?: string;
  userName?: string;
  currentUser?: AuthSessionUser | null;
  appTheme?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  settingsSubTab?: SettingsSubTab;
  onSelectSettingsSubTab?: (tab: SettingsSubTab) => void;
  onBackFromSettings?: () => void;
}

const NAV_ITEM_GRAPHICS: Record<string, {
  color: string;
  bgDark: string;
  bgLight: string;
  borderDark: string;
  borderLight: string;
  accentGradient: string;
}> = {
  dashboard: {
    color: 'text-sky-400',
    bgDark: 'bg-sky-950/60',
    bgLight: 'bg-sky-50',
    borderDark: 'border-sky-700/50',
    borderLight: 'border-sky-200',
    accentGradient: 'from-sky-500 to-blue-600',
  },
  issue_transfer: {
    color: 'text-blue-400',
    bgDark: 'bg-blue-950/60',
    bgLight: 'bg-blue-50',
    borderDark: 'border-blue-700/50',
    borderLight: 'border-blue-200',
    accentGradient: 'from-blue-600 to-indigo-600',
  },
  payout_transfer: {
    color: 'text-emerald-400',
    bgDark: 'bg-emerald-950/60',
    bgLight: 'bg-emerald-50',
    borderDark: 'border-emerald-700/50',
    borderLight: 'border-emerald-200',
    accentGradient: 'from-emerald-500 to-teal-600',
  },
  exchange: {
    color: 'text-amber-400',
    bgDark: 'bg-amber-950/60',
    bgLight: 'bg-amber-50',
    borderDark: 'border-amber-700/50',
    borderLight: 'border-amber-200',
    accentGradient: 'from-amber-500 to-yellow-600',
  },
  deposit_withdrawal: {
    color: 'text-teal-400',
    bgDark: 'bg-teal-950/60',
    bgLight: 'bg-teal-50',
    borderDark: 'border-teal-700/50',
    borderLight: 'border-teal-200',
    accentGradient: 'from-teal-500 to-emerald-600',
  },
  fund_transfer: {
    color: 'text-purple-400',
    bgDark: 'bg-purple-950/60',
    bgLight: 'bg-purple-50',
    borderDark: 'border-purple-700/50',
    borderLight: 'border-purple-200',
    accentGradient: 'from-purple-500 to-indigo-600',
  },
  double_entry: {
    color: 'text-cyan-400',
    bgDark: 'bg-cyan-950/60',
    bgLight: 'bg-cyan-50',
    borderDark: 'border-cyan-700/50',
    borderLight: 'border-cyan-200',
    accentGradient: 'from-cyan-500 to-sky-600',
  },
  trial_balance: {
    color: 'text-amber-400',
    bgDark: 'bg-amber-950/60',
    bgLight: 'bg-amber-50',
    borderDark: 'border-amber-700/50',
    borderLight: 'border-amber-200',
    accentGradient: 'from-amber-500 to-orange-600',
  },
  transfers: {
    color: 'text-indigo-400',
    bgDark: 'bg-indigo-950/60',
    bgLight: 'bg-indigo-50',
    borderDark: 'border-indigo-700/50',
    borderLight: 'border-indigo-200',
    accentGradient: 'from-indigo-500 to-blue-600',
  },
  statement: {
    color: 'text-emerald-400',
    bgDark: 'bg-emerald-950/60',
    bgLight: 'bg-emerald-50',
    borderDark: 'border-emerald-700/50',
    borderLight: 'border-emerald-200',
    accentGradient: 'from-emerald-600 to-green-600',
  },
  accounts: {
    color: 'text-teal-400',
    bgDark: 'bg-teal-950/60',
    bgLight: 'bg-teal-50',
    borderDark: 'border-teal-700/50',
    borderLight: 'border-teal-200',
    accentGradient: 'from-teal-600 to-cyan-600',
  },
  bank_accounts: {
    color: 'text-sky-400',
    bgDark: 'bg-sky-950/60',
    bgLight: 'bg-sky-50',
    borderDark: 'border-sky-700/50',
    borderLight: 'border-sky-200',
    accentGradient: 'from-blue-600 to-sky-600',
  },
  users: {
    color: 'text-rose-400',
    bgDark: 'bg-rose-950/60',
    bgLight: 'bg-rose-50',
    borderDark: 'border-rose-700/50',
    borderLight: 'border-rose-200',
    accentGradient: 'from-rose-500 to-pink-600',
  },
  settings: {
    color: 'text-slate-300',
    bgDark: 'bg-slate-800/80',
    bgLight: 'bg-slate-100',
    borderDark: 'border-slate-700',
    borderLight: 'border-slate-200',
    accentGradient: 'from-slate-500 to-slate-700',
  },
};

const SETTINGS_ITEM_GRAPHICS: Record<string, {
  color: string;
  bgDark: string;
  bgLight: string;
  borderDark: string;
  borderLight: string;
  accentGradient: string;
}> = {
  company: {
    color: 'text-sky-400',
    bgDark: 'bg-sky-950/60',
    bgLight: 'bg-sky-50',
    borderDark: 'border-sky-700/50',
    borderLight: 'border-sky-200',
    accentGradient: 'from-sky-500 to-blue-600',
  },
  license: {
    color: 'text-amber-400',
    bgDark: 'bg-amber-950/60',
    bgLight: 'bg-amber-50',
    borderDark: 'border-amber-700/50',
    borderLight: 'border-amber-200',
    accentGradient: 'from-amber-500 to-emerald-600',
  },
  theme_font: {
    color: 'text-purple-400',
    bgDark: 'bg-purple-950/60',
    bgLight: 'bg-purple-50',
    borderDark: 'border-purple-700/50',
    borderLight: 'border-purple-200',
    accentGradient: 'from-purple-500 to-pink-600',
  },
  backup: {
    color: 'text-blue-400',
    bgDark: 'bg-blue-950/60',
    bgLight: 'bg-blue-50',
    borderDark: 'border-blue-700/50',
    borderLight: 'border-blue-200',
    accentGradient: 'from-blue-500 to-cyan-600',
  },
  countries: {
    color: 'text-teal-400',
    bgDark: 'bg-teal-950/60',
    bgLight: 'bg-teal-50',
    borderDark: 'border-teal-700/50',
    borderLight: 'border-teal-200',
    accentGradient: 'from-teal-500 to-emerald-600',
  },
  currencies: {
    color: 'text-yellow-400',
    bgDark: 'bg-yellow-950/60',
    bgLight: 'bg-yellow-50',
    borderDark: 'border-yellow-700/50',
    borderLight: 'border-yellow-200',
    accentGradient: 'from-amber-500 to-yellow-600',
  },
  updates: {
    color: 'text-orange-400',
    bgDark: 'bg-orange-950/60',
    bgLight: 'bg-orange-50',
    borderDark: 'border-orange-700/50',
    borderLight: 'border-orange-200',
    accentGradient: 'from-orange-500 to-rose-600',
  },
};

export const WebSidebar: React.FC<WebSidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTransaction,
  activeView,
  onSwitchView,
  transactionsCount,
  companyName = '',
  companyLogo,
  onLogout,
  userRole,
  userName,
  currentUser,
  appTheme,
  isDarkMode = true,
  onToggleTheme,
  settingsSubTab = 'company',
  onSelectSettingsSubTab,
  onBackFromSettings,
}) => {
  const [permUpdateTick, setPermUpdateTick] = useState(0);

  useEffect(() => {
    const onPermUpdated = () => setPermUpdateTick(prev => prev + 1);
    window.addEventListener('smart_ledger_permissions_updated', onPermUpdated);
    return () => window.removeEventListener('smart_ledger_permissions_updated', onPermUpdated);
  }, []);

  const isSettingsMode = currentTab === 'settings';
  const isTransfersMode = currentTab === 'transfers' || currentTab === 'issue_transfer' || currentTab === 'payout_transfer';

  // قائمة أوبشنات قسم الحوالات الموحدة (إصدار • استعلام عام • تسليم)
  const transfersNavItems = useMemo(() => [
    { 
      id: 'issue_transfer' as WebScreenTab, 
      label: 'إصدار حوالة', 
      shortLabel: 'إصدار حوالة', 
      icon: SendHorizontal,
    },
    { 
      id: 'transfers' as WebScreenTab, 
      label: 'استعلام حوالات عام', 
      shortLabel: 'استعلام حوالات عام', 
      icon: ArrowLeftRight, 
      badge: transactionsCount,
    },
    { 
      id: 'payout_transfer' as WebScreenTab, 
      label: 'تسليم حوالة', 
      shortLabel: 'تسليم حوالة', 
      icon: ArrowDownLeft,
    },
  ], [transactionsCount]);

  // قائمة الأوبشنات الفرعية للإعدادات (تظهر بدلاً من القائمة الرئيسية عند الضغط على الإعدادات)
  const settingsNavItems = useMemo(() => [
    { id: 'company' as SettingsSubTab, label: 'بيانات الشركة واللوجو', shortLabel: 'بيانات الشركة', icon: Building2 },
    { id: 'license' as SettingsSubTab, label: 'تفعيل وترخيص النسخة', shortLabel: 'تفعيل النسخة', icon: KeyRound, hasPulse: true },
    { id: 'theme_font' as SettingsSubTab, label: 'الخط والثيم والمظهر', shortLabel: 'الخط والثيم', icon: Palette },
    { id: 'backup' as SettingsSubTab, label: 'النسخ الاحتياطي والأمان', shortLabel: 'النسخ', icon: Cloud },
    { id: 'countries' as SettingsSubTab, label: 'إعداد البلدان والمدن', shortLabel: 'إعداد البلدان', icon: Globe2 },
    { id: 'currencies' as SettingsSubTab, label: 'إعداد العملات وأسعار الصرف', shortLabel: 'إعداد العملات', icon: Coins },
    { id: 'updates' as SettingsSubTab, label: 'النظام', shortLabel: 'النظام', icon: Cpu },
  ], []);

  // قائمة الأوبشنات المحاسبية الثابتة والكاملة (مجمعة الحوالات في قسم واحد)
  const rawNavItems = useMemo(() => [
    { id: 'dashboard', label: 'لوحة التحكم', shortLabel: 'الرئيسية', icon: LayoutDashboard },
    { id: 'transfers', label: 'الحوالات', shortLabel: 'الحوالات', icon: ArrowLeftRight, badge: transactionsCount },
    { id: 'exchange', label: 'صرافة', shortLabel: 'صرافة', icon: Coins },
    { id: 'deposit_withdrawal', label: 'سحب وإيداع', shortLabel: 'سحب وإيداع', icon: HandCoins },
    { id: 'fund_transfer', label: 'مناقلة الصناديق', shortLabel: 'مناقلة', icon: ArrowRightLeft },
    { id: 'double_entry', label: 'قيد مزدوج', shortLabel: 'قيد مزدوج', icon: Layers },
    { id: 'trial_balance', label: 'أرصدة الحسابات', shortLabel: 'الأرصدة', icon: Scale },
    { id: 'statement', label: 'كشف حساب', shortLabel: 'كشف حساب', icon: FileSpreadsheet },
    { id: 'accounts', label: 'دليل الحسابات', shortLabel: 'الحسابات', icon: Users },
    { id: 'bank_accounts', label: 'إدارة الوكلاء', shortLabel: 'الوكلاء', icon: Building2 },
    { id: 'users', label: 'إدارة المستخدمين', shortLabel: 'المستخدمين', icon: UserCog },
    { id: 'settings', label: 'إعدادات البرنامج', shortLabel: 'الإعدادات', icon: Settings },
  ], [transactionsCount]);

  // فلترة الأوبشنات حصراً حسب الصلاحيات الممنوحة للمستخدم مع صمام أمان لعدم فراغ القائمة
  const navItems = useMemo(() => {
    const filtered = rawNavItems.filter(item => {
      if (item.id === 'transfers') {
        return canUserAccessScreen(currentUser || null, 'transfers') || 
               canUserAccessScreen(currentUser || null, 'issue_transfer') || 
               canUserAccessScreen(currentUser || null, 'payout_transfer');
      }
      return canUserAccessScreen(currentUser || null, item.id);
    });
    return filtered.length > 0 ? filtered : rawNavItems;
  }, [rawNavItems, currentUser, permUpdateTick]);

  return (
    <aside 
      className={`w-[245px] sm:w-[250px] h-full max-h-full shrink-0 flex flex-col justify-between border-l select-none z-20 transition-colors duration-200 overflow-hidden ${
        isDarkMode 
          ? 'bg-[#041628] border-slate-800 text-white shadow-2xl' 
          : 'bg-white border-slate-200/90 text-slate-800 shadow-xl'
      }`}
      dir="rtl"
    >
      {/* Middle Section: Takes Full Screen Height */}
      <div className="flex-1 flex flex-col p-2 min-h-0 overflow-y-auto no-scrollbar justify-between">
        {isSettingsMode ? (
          <div className="flex flex-col h-full justify-between gap-2">
            {/* شبكة خيارات الإعدادات الـ 6 */}
            <nav className="grid grid-cols-2 gap-1.5 w-full flex-1 auto-rows-fr">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = (settingsSubTab || 'company') === item.id;
                const graphic = SETTINGS_ITEM_GRAPHICS[item.id] || {
                  color: 'text-sky-400',
                  bgDark: 'bg-sky-950/60',
                  bgLight: 'bg-sky-50',
                  borderDark: 'border-sky-700/50',
                  borderLight: 'border-sky-200',
                  accentGradient: 'from-sky-500 to-blue-600',
                };

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSettingsSubTab?.(item.id)}
                    title={item.label}
                    className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 cursor-pointer text-center w-full h-full min-h-[58px] ${
                      isActive
                        ? isDarkMode
                          ? 'bg-[#0284c7] text-white shadow-md font-black ring-2 ring-white/30'
                          : 'bg-[#0284c7] text-white shadow-md font-black ring-2 ring-sky-900/20'
                        : isDarkMode
                        ? 'bg-slate-800/50 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-slate-700/60 font-bold hover:scale-[1.01]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold hover:scale-[1.01]'
                    }`}
                  >
                    {/* الحاوية الرمزية المميزة للأيقونة */}
                    <div className={`relative shrink-0 mb-1 w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200 shadow-2xs ${
                      isActive 
                        ? `bg-gradient-to-tr ${graphic.accentGradient} text-white border-white/40 shadow-sm scale-105 ring-2 ring-white/30` 
                        : isDarkMode 
                        ? `${graphic.bgDark} ${graphic.borderDark} ${graphic.color} group-hover:scale-110 group-hover:shadow-xs` 
                        : `${graphic.bgLight} ${graphic.borderLight} ${graphic.color} group-hover:scale-110 group-hover:shadow-xs`
                    }`}>
                      <Icon className={`w-4.5 h-4.5 stroke-[2.3] transition-transform ${isActive ? 'text-white drop-shadow-sm' : ''}`} />
                      {item.hasPulse && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>

                    <span className={`text-[12px] sm:text-[12.5px] leading-tight tracking-tight text-center w-full truncate px-1 ${
                      isActive ? 'text-white font-black' : isDarkMode ? 'font-black text-slate-100' : 'font-black text-slate-800'
                    }`}>
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* زر الرجوع للقائمة السابقة في أسفل القائمة */}
            <div className="pt-2 border-t border-slate-700/60 mt-auto shrink-0">
              <button
                type="button"
                onClick={onBackFromSettings}
                className={`w-full py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 group cursor-pointer font-black text-[12.5px] shadow-lg active:scale-[0.98] ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-900/30 ring-1 ring-amber-400/30'
                    : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-500/20 ring-1 ring-amber-500/30'
                }`}
              >
                <ArrowRight className="w-4 h-4 stroke-[2.8] group-hover:translate-x-1 transition-transform" />
                <span>رجوع للقائمة السابقة</span>
              </button>
            </div>
          </div>
        ) : isTransfersMode ? (
          <div className="flex flex-col h-full justify-between gap-3">
            {/* الأوبشنات الـ 3 المخصصة للحوالات في أعلى القائمة الجانبية */}
            <nav className="flex flex-col gap-2.5 w-full flex-1 justify-start pt-1">
              {transfersNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const graphic = NAV_ITEM_GRAPHICS[item.id] || {
                  color: 'text-sky-400',
                  bgDark: 'bg-sky-950/60',
                  bgLight: 'bg-sky-50',
                  borderDark: 'border-sky-700/50',
                  borderLight: 'border-sky-200',
                  accentGradient: 'from-sky-500 to-blue-600',
                };

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    title={item.label}
                    className={`group relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-150 cursor-pointer text-right w-full border ${
                      isActive
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 text-white shadow-lg border-sky-400 ring-2 ring-white/20'
                          : 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white shadow-lg border-sky-600 ring-2 ring-sky-900/20'
                        : isDarkMode
                        ? 'bg-slate-800/50 hover:bg-slate-800/90 text-slate-200 hover:text-white border-slate-700/60 font-bold hover:scale-[1.01]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold hover:scale-[1.01]'
                    }`}
                  >
                    {/* الحاوية الرمزية المميزة للأيقونة */}
                    <div className={`relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-200 shadow-xs ${
                      isActive 
                        ? `bg-white/20 text-white border-white/40 shadow-sm scale-105 ring-2 ring-white/30` 
                        : isDarkMode 
                        ? `${graphic.bgDark} ${graphic.borderDark} ${graphic.color} group-hover:scale-110 group-hover:shadow-xs` 
                        : `${graphic.bgLight} ${graphic.borderLight} ${graphic.color} group-hover:scale-110 group-hover:shadow-xs`
                    }`}>
                      <Icon className={`w-5 h-5 stroke-[2.3] transition-transform ${isActive ? 'text-white drop-shadow-sm' : ''}`} />
                      
                      {item.badge !== undefined && (
                        <span className="absolute -top-1.5 -left-1.5 text-[9px] min-w-[18px] h-4 px-1 rounded-full font-mono font-bold flex items-center justify-center bg-rose-600 text-white shadow-xs border border-white/30">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className={`text-[14px] font-black truncate block leading-tight ${
                        isActive ? 'text-white' : isDarkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* زر الرجوع للقائمة الرئيسية في أسفل القائمة */}
            <div className="pt-2 border-t border-slate-700/60 mt-auto shrink-0">
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className={`w-full py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 group cursor-pointer font-black text-[12.5px] shadow-lg active:scale-[0.98] ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-900/30 ring-1 ring-amber-400/30'
                    : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-500/20 ring-1 ring-amber-500/30'
                }`}
              >
                <ArrowRight className="w-4 h-4 stroke-[2.8] group-hover:translate-x-1 transition-transform" />
                <span>رجوع للقائمة الرئيسية</span>
              </button>
            </div>
          </div>
        ) : (
          <nav className="grid grid-cols-2 gap-1.5 w-full h-full flex-1 auto-rows-fr">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const graphic = NAV_ITEM_GRAPHICS[item.id] || {
                color: 'text-sky-400',
                bgDark: 'bg-sky-950/60',
                bgLight: 'bg-sky-50',
                borderDark: 'border-sky-700/50',
                borderLight: 'border-sky-200',
                accentGradient: 'from-sky-500 to-blue-600',
              };

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as WebScreenTab)}
                  title={item.label}
                  className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 cursor-pointer text-center w-full h-full min-h-[52px] ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[#0284c7] text-white shadow-md font-black ring-2 ring-white/30'
                        : 'bg-[#1e293b] text-white shadow-md font-black ring-2 ring-slate-900/20'
                      : isDarkMode
                      ? 'bg-slate-800/50 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-slate-700/60 font-bold hover:scale-[1.01]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold hover:scale-[1.01]'
                  }`}
                >
                  {/* الحاوية الرمزية المميزة للأيقونة */}
                  <div className={`relative shrink-0 mb-1 w-8.5 h-8.5 rounded-xl flex items-center justify-center border transition-all duration-200 shadow-2xs ${
                    isActive 
                      ? `bg-gradient-to-tr ${graphic.accentGradient} text-white border-white/40 shadow-sm scale-105 ring-2 ring-white/30` 
                      : isDarkMode 
                      ? `${graphic.bgDark} ${graphic.borderDark} ${graphic.color} group-hover:scale-110 group-hover:shadow-xs` 
                      : `${graphic.bgLight} ${graphic.borderLight} ${graphic.color} group-hover:scale-110 group-hover:shadow-xs`
                  }`}>
                    <Icon className={`w-4.5 h-4.5 stroke-[2.3] transition-transform ${isActive ? 'text-white drop-shadow-sm' : ''}`} />
                    
                    {/* شارة عدد العمليات */}
                    {item.badge !== undefined && (
                      <span className="absolute -top-1.5 -left-2 text-[9px] min-w-[17px] h-4 px-1 rounded-full font-mono font-bold flex items-center justify-center bg-rose-600 text-white shadow-xs border border-white/30">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* النص بخط كبير وواضح وبارز */}
                  <span className={`text-[12.5px] sm:text-[13px] leading-tight tracking-tight text-center w-full truncate px-1 ${
                    isActive ? 'text-white font-black' : isDarkMode ? 'font-black text-slate-100' : 'font-black text-slate-800'
                  }`}>
                    {item.shortLabel || item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>



    </aside>
  );
};
