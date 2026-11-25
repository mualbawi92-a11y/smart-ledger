import React from 'react';
import { 
  Bell, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  User,
  ExternalLink,
  Settings,
  LogOut,
  Shield,
  Sun,
  Moon,
  Download
} from 'lucide-react';
import { CurrencyRate } from '../../types';
import { WebScreenTab } from './WebSidebar';
import { AuthSessionUser } from './LoginScreen';
import { canUserAccessScreen } from '../../utils/permissions';

interface WebHeaderProps {
  currentTab: WebScreenTab;
  currencies: CurrencyRate[];
  onOpenNewTransaction: () => void;
  onOpenTrackModal: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  userName?: string;
  userRole?: string;
  currentUser?: AuthSessionUser | null;
  companyName?: string;
  companyLogo?: string;
  appTheme?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const WebHeader: React.FC<WebHeaderProps> = ({
  currentTab,
  currencies,
  onOpenNewTransaction,
  onOpenTrackModal,
  onOpenSettings,
  onLogout,
  userName = 'محمد علي الباوي',
  userRole = 'مدير',
  currentUser,
  companyName,
  companyLogo,
  appTheme,
  isDarkMode = true,
  onToggleTheme,
}) => {
  const getTabTitle = (tab: WebScreenTab) => {
    switch (tab) {
      case 'dashboard': return 'لوحة التحكم الرئيسية والملخص المالي';
      case 'issue_transfer': return 'إصدار حوالة مالية جديدة (سند إرسال وتثبيت)';
      case 'payout_transfer': return 'تسليم الحوالات الواردة النقدية (تسلم حوالة)';
      case 'deposit_withdrawal': return 'اضافة قبض وصرف العملاء (سحب وإيداع نقدية)';
      case 'fund_transfer': return 'مناقلة بين الصناديق (وتوريد للخزنة المركزية)';
      case 'double_entry': return 'سند قيد مزدوج يدوي (اليومية العامة)';
      case 'accounts': return 'دليل وإدارة الحسابات (عملاء وموردين وبنوك)';
      case 'transfers': return 'استعلام الحوالات وأرصدة العملاء (Smart Ledger)';
      case 'statement': return 'كشوفات حسابات العملاء (كشف حساب)';
      case 'exchange': return 'صرف العملات وحاسبة التحويل السريع';
      case 'network': return 'شبكة الحوالات بين المكاتب (P2P Network)';
      case 'deposits': return 'الإيداعات البنكية والقيود المحاسبية';
      case 'cash_flow': return 'المقبوضات والمدفوعات النقدية (سندات القبض والصرف)';
      case 'users': return 'إدارة المستخدمين وتوصيف المجموعات (أقسام الشركة)';
      case 'settings': return 'إعدادات البرنامج (الهوية، الخط، النسخ الاحتياطي، الدول والعملات)';
    }
  };

  const usdRate = currencies.find(c => c.code === 'USD');

  return (
    <header className={`h-16 px-6 flex items-center justify-between shrink-0 shadow-2xs z-10 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-[#061d30] border-b border-sky-900/60 text-white' 
        : 'bg-white border-b border-slate-200 text-slate-900'
    }`}>
      
      {/* Title & Section Breadcrumb */}
      <div className="flex items-center gap-3">
        {companyLogo && (
          <img src={companyLogo} alt="Logo" className={`w-9 h-9 object-contain rounded-lg border p-0.5 ${
            isDarkMode ? 'border-sky-800/60 bg-[#082842]' : 'border-slate-200 bg-white'
          }`} />
        )}
        <div>
          <h2 className={`text-base font-bold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {getTabTitle(currentTab)}
          </h2>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`font-semibold ${isDarkMode ? 'text-sky-200' : 'text-slate-700'}`}>
              {companyName || 'Smart Ledger'}
            </span>
            <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>•</span>
            <span className={`font-medium ${isDarkMode ? 'text-sky-400' : 'text-sky-700'}`}>
              نظام محاسبي وحوالات متكامل
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Live Rates Ticker, Quick Search, Day/Night Button, User */}
      <div className="flex items-center gap-3 text-xs">
        
        {/* Live Currency Ticker */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold border ${
          isDarkMode 
            ? 'bg-[#082842] border-sky-800/60 text-sky-200' 
            : 'bg-sky-50 border-sky-200/80 text-sky-900'
        }`}>
          <TrendingUp className={`w-3.5 h-3.5 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`} />
          <span>سعر السوق الموازي:</span>
          <span className={`font-mono px-2 py-0.5 rounded border ${
            isDarkMode 
              ? 'bg-[#031525] text-sky-300 border-sky-700/60' 
              : 'bg-white text-sky-700 border-sky-200'
          }`}>
            100$ = {usdRate ? (usdRate.sellRate * 100).toLocaleString() : '152,500'} د.ع
          </span>
        </div>

        {/* Global Day / Night (نهاري / ليلي) Mode Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              isDarkMode 
                ? 'bg-[#082842] border-sky-700/60 text-sky-300 hover:text-white hover:bg-sky-900/60 shadow-xs' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-sky-700 shadow-2xs'
            }`}
            title={isDarkMode ? 'التحويل إلى الوضع الفاتح (نهاري)' : 'التحويل إلى الوضع الليلي (كحلي مصرفي)'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">نهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-700" />
                <span className="text-[11px]">ليلي</span>
              </>
            )}
          </button>
        )}

        {/* Quick MTCN Search */}
        <button
          onClick={onOpenTrackModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
            isDarkMode 
              ? 'bg-[#082842] hover:bg-[#0a355c] text-sky-200 border border-sky-800/60' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Search className={`w-3.5 h-3.5 ${isDarkMode ? 'text-sky-400' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">تتبع حوالة (MTCN)</span>
        </button>


        {/* New Transaction shortcut */}
        {canUserAccessScreen(currentUser || null, 'issue_transfer') && (
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1 px-3 py-1.5 dynamic-theme-btn text-white rounded-xl font-bold shadow-xs border border-white/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">إضافة قيد / حوالة</span>
          </button>
        )}

        {/* Settings button */}
        {onOpenSettings && canUserAccessScreen(currentUser || null, 'settings') && (
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              currentTab === 'settings'
                ? isDarkMode ? 'bg-sky-900/60 border-sky-500 text-sky-300' : 'bg-sky-50 border-sky-600 text-sky-700'
                : isDarkMode ? 'bg-[#082842] hover:bg-[#0a355c] border-sky-800/60 text-sky-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
            title="إعدادات البرنامج"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* User Avatar & Info */}
        <div 
          onClick={onOpenSettings}
          className={`flex items-center gap-2 pr-2 border-r cursor-pointer group ${
            isDarkMode ? 'border-sky-900/60' : 'border-slate-200'
          }`}
          title="الملف الشخصي والإعدادات"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-sky-400/30 group-hover:scale-105 transition-transform">
            {userName ? userName.slice(0, 2) : 'م.ع'}
          </div>
          <div className="hidden lg:block text-right">
            <span className={`block text-xs font-bold transition-colors ${
              isDarkMode ? 'text-white group-hover:text-sky-300' : 'text-slate-800 group-hover:text-sky-700'
            }`}>
              {userName || 'محمد علي الباوي'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold">
              {userRole === 'مدير' || userRole === 'الادارة' ? (
                <span className={`px-1.5 py-0.2 rounded border ${
                  isDarkMode 
                    ? 'text-sky-300 bg-sky-950/80 border-sky-700/60' 
                    : 'text-sky-800 bg-sky-50 border-sky-200'
                }`}>
                  مدير (صلاحيات كاملة)
                </span>
              ) : userRole === 'مدير فرع' ? (
                <span className={`px-1.5 py-0.2 rounded border ${
                  isDarkMode 
                    ? 'text-teal-300 bg-teal-950/80 border-teal-700/60' 
                    : 'text-teal-700 bg-teal-50 border-teal-200'
                }`}>
                  مدير فرع
                </span>
              ) : (
                <span className={`px-1.5 py-0.2 rounded border ${
                  isDarkMode 
                    ? 'text-slate-300 bg-slate-900 border-slate-700' 
                    : 'text-slate-700 bg-slate-100 border-slate-200'
                }`}>
                  موظف
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs border ${
              isDarkMode 
                ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-700/60' 
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
            }`}
            title="تسجيل الخروج من البرنامج والعودة لشاشة الدخول"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        )}

      </div>

    </header>
  );
};
