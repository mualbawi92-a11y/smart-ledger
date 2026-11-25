import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Landmark, 
  Wallet, 
  Users, 
  Scale, 
  ArrowRightLeft, 
  FileText, 
  Coins, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  RefreshCw, 
  ChevronRight,
  HandCoins,
  SendHorizontal,
  FolderTree,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { AccountItem, TransactionRecord, CurrencyRate } from '../../../types';
import { AuthSessionUser } from '../LoginScreen';

interface WebDashboardScreenProps {
  accounts: AccountItem[];
  transactions: TransactionRecord[];
  currencies: CurrencyRate[];
  onOpenNewTransaction: () => void;
  onViewReceipt: (tx: TransactionRecord) => void;
  onNavigateTab: (tab: any) => void;
  currentUser?: AuthSessionUser | null;
  isDarkMode?: boolean;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyLogo?: string;
  onToggleSidebar?: () => void;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onOpenSetup?: () => void;
}

export const WebDashboardScreen: React.FC<WebDashboardScreenProps> = ({
  accounts,
  transactions,
  currencies,
  onOpenNewTransaction,
  onViewReceipt,
  onNavigateTab,
  currentUser,
  isDarkMode = false,
  companyName,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'transfer' | 'deposit' | 'withdrawal' | 'fund_transfer'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. حساب أرصدة الخزنة المركزية (Central Vault) - معزولة 100% عن الزبائن
  const vaultAccounts = useMemo(() => {
    return accounts.filter(a => 
      a.type === 'vault' || 
      (a as any).systemType === 'vault' || 
      (a.name || '').includes('خزنة') || 
      a.id === 'acc-vault-1' || 
      a.id === 'sys_vault'
    );
  }, [accounts]);

  const vaultTotalIQD = useMemo(() => {
    return vaultAccounts.reduce((acc, a) => acc + (Number(a.balanceIQD) || 0), 0);
  }, [vaultAccounts]);

  const vaultTotalUSD = useMemo(() => {
    return vaultAccounts.reduce((acc, a) => acc + (Number(a.balanceUSD) || 0), 0);
  }, [vaultAccounts]);

  // 2. حساب أرصدة الصناديق النقدية (Cash Box)
  const boxAccounts = useMemo(() => {
    return accounts.filter(a => 
      a.type === 'cash_box' || 
      (a as any).systemType === 'cash_box' || 
      (a.name || '').includes('صندوق') || 
      a.id === 'acc-box-1' || 
      a.id === 'sys_cash_box'
    );
  }, [accounts]);

  const boxTotalIQD = useMemo(() => {
    return boxAccounts.reduce((acc, a) => acc + (Number(a.balanceIQD) || 0), 0);
  }, [boxAccounts]);

  const boxTotalUSD = useMemo(() => {
    return boxAccounts.reduce((acc, a) => acc + (Number(a.balanceUSD) || 0), 0);
  }, [boxAccounts]);

  // 3. حساب أرصدة العملاء (مدين 🔴 أحمر / دائن 🟢 أخضر) وفق القواعد المحاسبية الصارمة
  const clientAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'client' || (!a.type && !a.systemType));
  }, [accounts]);

  // إجمالي ديون العملاء (المدين / عليه 🔴)
  const totalDebtorIQD = useMemo(() => {
    return clientAccounts.reduce((acc, a) => {
      const b = Number(a.balanceIQD) || 0;
      return b < 0 ? acc + Math.abs(b) : acc;
    }, 0);
  }, [clientAccounts]);

  const totalDebtorUSD = useMemo(() => {
    return clientAccounts.reduce((acc, a) => {
      const b = Number(a.balanceUSD) || 0;
      return b < 0 ? acc + Math.abs(b) : acc;
    }, 0);
  }, [clientAccounts]);

  // إجمالي مستحقات العملاء (الدائن / له 🟢)
  const totalCreditorIQD = useMemo(() => {
    return clientAccounts.reduce((acc, a) => {
      const b = Number(a.balanceIQD) || 0;
      return b > 0 ? acc + b : acc;
    }, 0);
  }, [clientAccounts]);

  const totalCreditorUSD = useMemo(() => {
    return clientAccounts.reduce((acc, a) => {
      const b = Number(a.balanceUSD) || 0;
      return b > 0 ? acc + b : acc;
    }, 0);
  }, [clientAccounts]);

  // 4. إحصائيات الحوالات
  const pendingTransfers = useMemo(() => {
    return transactions.filter(t => t.type === 'issue_transfer' && t.status === 'pending');
  }, [transactions]);

  const completedTransfers = useMemo(() => {
    return transactions.filter(t => t.type === 'payout_transfer' || (t.type === 'issue_transfer' && t.status === 'completed'));
  }, [transactions]);

  // 5. تصفية العمليات الأخيرة
  const filteredRecentTransactions = useMemo(() => {
    let list = [...transactions].reverse();
    if (filterType !== 'all') {
      if (filterType === 'transfer') {
        list = list.filter(t => t.type === 'issue_transfer' || t.type === 'payout_transfer');
      } else if (filterType === 'deposit') {
        list = list.filter(t => t.type === 'deposit');
      } else if (filterType === 'withdrawal') {
        list = list.filter(t => t.type === 'withdrawal');
      } else if (filterType === 'fund_transfer') {
        list = list.filter(t => t.type === 'fund_transfer');
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        (t.code || '').toLowerCase().includes(q) ||
        (t.senderName || '').toLowerCase().includes(q) ||
        (t.receiverName || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.sourceAccountName || '').toLowerCase().includes(q) ||
        (t.destinationAccountName || '').toLowerCase().includes(q)
      );
    }
    return list.slice(0, 10);
  }, [transactions, filterType, searchQuery]);

  // سعر صرف الدولار
  const usdRate = currencies.find(c => c.code === 'USD');

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`} dir="rtl">
      
      {/* 1. بطاقات أرصدة الخزنة المركزية والصناديق النقدية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* بطاقة الخزنة المركزية (Central Vault) */}
        <div className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden flex flex-col justify-between transition-all ${
          isDarkMode 
            ? 'bg-[#061d30] border-sky-800/70 hover:border-sky-600' 
            : 'bg-white border-sky-200 hover:border-sky-400'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-sky-900 dark:text-sky-300">الخزنة المركزية</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
            }`}>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">رصيد الدينار العراقي</span>
              <span className="font-mono text-lg font-black text-slate-900 dark:text-white">
                {vaultTotalIQD.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">د.ع</span>
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
            }`}>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">رصيد الدولار الأمريكي</span>
              <span className="font-mono text-lg font-black text-emerald-600">
                ${vaultTotalUSD.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* بطاقة الصناديق النقدية (Cash Boxes) */}
        <div className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden flex flex-col justify-between transition-all ${
          isDarkMode 
            ? 'bg-[#061d30] border-emerald-900/60 hover:border-emerald-600' 
            : 'bg-white border-emerald-200 hover:border-emerald-400'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-emerald-900 dark:text-emerald-300">الصناديق النقدية</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
            }`}>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">رصيد الدينار العراقي</span>
              <span className="font-mono text-lg font-black text-slate-900 dark:text-white">
                {boxTotalIQD.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">د.ع</span>
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
            }`}>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">رصيد الدولار الأمريكي</span>
              <span className="font-mono text-lg font-black text-emerald-600">
                ${boxTotalUSD.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. جدول آخر العمليات المالية والحوالات والسندات (Recent Transactions) */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDarkMode ? 'bg-[#061d30] border-sky-900/60' : 'bg-white border-slate-200'
      }`}>
        
        {/* شريط عنوان الجدول والتصفية والبحث */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0284c7]" />
            <h2 className="font-black text-sm text-slate-800 dark:text-slate-100">
              آخر الحركات والعمليات المالية الحديثة
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-[#0284c7] font-bold">
              {transactions.length} عملية
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* أزرار التصفية السريعة */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterType === 'all' 
                    ? 'bg-white dark:bg-sky-700 text-[#0284c7] dark:text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterType('deposit')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterType === 'deposit' 
                    ? 'bg-white dark:bg-sky-700 text-[#0284c7] dark:text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                قبض
              </button>
              <button
                onClick={() => setFilterType('withdrawal')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterType === 'withdrawal' 
                    ? 'bg-white dark:bg-sky-700 text-[#0284c7] dark:text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                صرف
              </button>
              <button
                onClick={() => setFilterType('transfer')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterType === 'transfer' 
                    ? 'bg-white dark:bg-sky-700 text-[#0284c7] dark:text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                حوالات
              </button>
              <button
                onClick={() => setFilterType('fund_transfer')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterType === 'fund_transfer' 
                    ? 'bg-white dark:bg-sky-700 text-[#0284c7] dark:text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                توريد خزنة
              </button>
            </div>

            {/* حقل البحث السريع */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برقم السند أو الاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-bold outline-none transition-colors w-44 sm:w-56 ${
                  isDarkMode 
                    ? 'bg-slate-900/80 border-slate-700 text-white focus:border-[#0284c7]' 
                    : 'bg-white border-slate-200 text-slate-800 focus:border-[#0284c7]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* جسم الجدول */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className={`border-b font-black ${
              isDarkMode ? 'bg-[#082842] border-sky-900/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <tr>
                <th className="p-3">رقم السند / الكود</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">النوع</th>
                <th className="p-3">العميل / الحساب المعني</th>
                <th className="p-3">المبلغ والعملة</th>
                <th className="p-3">أطراف القيد المحاسبي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    لا توجد حركات مالية مسجلة تطابق التصفية الحالية
                  </td>
                </tr>
              ) : (
                filteredRecentTransactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  const isWithdrawal = tx.type === 'withdrawal';
                  const isIssue = tx.type === 'issue_transfer';
                  const isPayout = tx.type === 'payout_transfer';
                  const isSweep = tx.type === 'fund_transfer';

                  return (
                    <tr 
                      key={tx.id} 
                      className={`hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {/* كود الحركة */}
                      <td className="p-3 font-mono font-black text-[#0284c7]">
                        {tx.code || tx.id.slice(0, 8)}
                      </td>

                      {/* التاريخ */}
                      <td className="p-3 text-slate-500 font-bold font-mono">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('ar-IQ') : 'اليوم'}
                      </td>

                      {/* النوع */}
                      <td className="p-3 font-bold">
                        {isDeposit && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md text-[11px]">
                            <Plus className="w-3 h-3" /> سند قبض
                          </span>
                        )}
                        {isWithdrawal && (
                          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md text-[11px]">
                            <ArrowDownLeft className="w-3 h-3" /> سند صرف
                          </span>
                        )}
                        {isIssue && (
                          <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md text-[11px]">
                            <SendHorizontal className="w-3 h-3" /> حوالة صادرة
                          </span>
                        )}
                        {isPayout && (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md text-[11px]">
                            <HandCoins className="w-3 h-3" /> تسليم حوالة
                          </span>
                        )}
                        {isSweep && (
                          <span className="inline-flex items-center gap-1 text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md text-[11px]">
                            <ArrowRightLeft className="w-3 h-3" /> مناقلة للخزنة
                          </span>
                        )}
                      </td>

                      {/* الحساب / العميل */}
                      <td className="p-3 font-bold">
                        {tx.senderName || tx.receiverName || tx.sourceAccountName || 'حساب عام'}
                      </td>

                      {/* المبلغ والعملة */}
                      <td className="p-3 font-mono font-black text-sm">
                        <span className={isDeposit ? 'text-emerald-600' : isWithdrawal ? 'text-rose-600' : 'text-slate-900 dark:text-white'}>
                          {(tx.amount || 0).toLocaleString()} {tx.currency || 'IQD'}
                        </span>
                      </td>

                      {/* أطراف القيد */}
                      <td className="p-3 text-[11px] text-slate-500 font-bold">
                        {isDeposit && 'الصندوق (مدين) ← العميل (دائن له 🟢)'}
                        {isWithdrawal && 'العميل (مدين عليه 🔴) ← الصندوق (دائن)'}
                        {isSweep && 'الصندوق (دائن 🟢) ← الخزنة (مدين 🔴)'}
                        {(isIssue || isPayout) && (tx.sourceAccountName || 'الصندوق النقدي')}
                      </td>

                      {/* الحالة */}
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3" /> تم التثبيت
                        </span>
                      </td>

                      {/* زر المعاينة والطباعة */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onViewReceipt(tx)}
                          className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] hover:bg-sky-100 transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-bold"
                          title="عرض وطباعة السند"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>السند</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* تذييل الجدول مع رابط الانتقال للسجل الشامل */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>يتم عرض آخر 10 عمليات بشكل مباشر</span>
          <button
            onClick={() => onNavigateTab('transfers')}
            className="text-[#0284c7] font-black hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>استعراض كافة الحوالات والقيود</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
