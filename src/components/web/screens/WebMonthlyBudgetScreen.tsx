import React, { useState, useMemo } from 'react';
import { 
  PieChart as PieChartIcon, 
  Wallet, 
  Landmark, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Printer, 
  RefreshCw, 
  Filter, 
  Coins, 
  Building2, 
  Layers, 
  TrendingUp, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import * as XLSX from 'xlsx';
import { AccountItem, TransactionRecord, CurrencyRate } from '../../../types';

interface WebMonthlyBudgetScreenProps {
  accounts: AccountItem[];
  transactions: TransactionRecord[];
  currencies?: CurrencyRate[];
  onClose?: () => void;
  onNavigateTab?: (tab: any) => void;
  companyName?: string;
}

// ألوان متناسقة وفاخرة متوافقة مع القواعد المحاسبية
const PIE_COLORS = [
  '#0284c7', // Sky Blue
  '#0ea5e9', // Light Sky
  '#059669', // Emerald Green (دائن / له)
  '#10b981', // Light Emerald
  '#e11d48', // Rose Red (مدين / عليه)
  '#f43f5e', // Light Rose
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const WebMonthlyBudgetScreen: React.FC<WebMonthlyBudgetScreenProps> = ({
  accounts,
  transactions,
  currencies = [],
  onClose,
  companyName = '',
}) => {
  // تصفية العملة والشهر
  const [selectedCurrency, setSelectedCurrency] = useState<'IQD' | 'USD'>('USD');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [accountTypeFilter, setAccountTypeFilter] = useState<'all' | 'cash_box' | 'vault' | 'client' | 'agent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // استخراج قائمة الأشهر المتاحة للاختيار (آخر 12 شهر)
  const availableMonths = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long' });
      list.push({ id, label });
    }
    return list;
  }, []);

  // حساب الأرصدة المصنفة بحسب القواعد المحاسبية:
  // 1. الصناديق (Cash Boxes)
  // 2. الخزائن (Vaults)
  // 3. العملاء والوكلاء (Clients & Agents)
  const financialSummary = useMemo(() => {
    let totalCashBoxesUSD = 0;
    let totalCashBoxesIQD = 0;
    let totalVaultsUSD = 0;
    let totalVaultsIQD = 0;
    let totalClientsCreditUSD = 0; // له (أخضر)
    let totalClientsCreditIQD = 0;
    let totalClientsDebitUSD = 0;  // عليه (أحمر)
    let totalClientsDebitIQD = 0;

    accounts.forEach(acc => {
      if (acc.type === 'cash_box') {
        totalCashBoxesUSD += acc.balanceUSD;
        totalCashBoxesIQD += acc.balanceIQD;
      } else if (acc.type === 'vault') {
        totalVaultsUSD += acc.balanceUSD;
        totalVaultsIQD += acc.balanceIQD;
      } else {
        // عميل أو وكيل أو حساب خارجي
        if (acc.balanceUSD > 0) {
          totalClientsCreditUSD += acc.balanceUSD; // دائن (له)
        } else if (acc.balanceUSD < 0) {
          totalClientsDebitUSD += Math.abs(acc.balanceUSD); // مدين (عليه)
        }

        if (acc.balanceIQD > 0) {
          totalClientsCreditIQD += acc.balanceIQD;
        } else if (acc.balanceIQD < 0) {
          totalClientsDebitIQD += Math.abs(acc.balanceIQD);
        }
      }
    });

    const isUSD = selectedCurrency === 'USD';
    const cashBoxesVal = isUSD ? totalCashBoxesUSD : totalCashBoxesIQD;
    const vaultsVal = isUSD ? totalVaultsUSD : totalVaultsIQD;
    const clientsCreditVal = isUSD ? totalClientsCreditUSD : totalClientsCreditIQD;
    const clientsDebitVal = isUSD ? totalClientsDebitUSD : totalClientsDebitIQD;

    return {
      cashBoxesVal,
      vaultsVal,
      clientsCreditVal,
      clientsDebitVal,
      totalLiquidCash: cashBoxesVal + vaultsVal,
      totalUSD: totalCashBoxesUSD + totalVaultsUSD + (totalClientsCreditUSD - totalClientsDebitUSD),
      totalIQD: totalCashBoxesIQD + totalVaultsIQD + (totalClientsCreditIQD - totalClientsDebitIQD),
    };
  }, [accounts, selectedCurrency]);

  // بيانات الرسم البياني الدائري لتوزيع الأرصدة بين الصناديق والعملاء
  const pieChartData = useMemo(() => {
    const isUSD = selectedCurrency === 'USD';
    const data: { name: string; value: number; type: string; color: string }[] = [];

    // 1. أرصدة الصناديق النقدية مجتمعة
    if (financialSummary.cashBoxesVal > 0) {
      data.push({
        name: 'الصناديق النقدية (Cash)',
        value: financialSummary.cashBoxesVal,
        type: 'cash_box',
        color: '#0284c7', // Sky Blue
      });
    }

    // 2. أرصدة الخزائن المركزية (معزولة)
    if (financialSummary.vaultsVal > 0) {
      data.push({
        name: 'الخزائن المركزية (Vaults)',
        value: financialSummary.vaultsVal,
        type: 'vault',
        color: '#0369a1', // Navy Blue
      });
    }

    // 3. أرصدة العملاء الدائنة (له 🟢 أخضر)
    if (financialSummary.clientsCreditVal > 0) {
      data.push({
        name: 'أمانات العملاء (دائن 🟢 له)',
        value: financialSummary.clientsCreditVal,
        type: 'client_credit',
        color: '#059669', // Emerald Green (دائن)
      });
    }

    // 4. ذمم العملاء المدينة (عليه 🔴 أحمر)
    if (financialSummary.clientsDebitVal > 0) {
      data.push({
        name: 'ديون العملاء (مدين 🔴 عليه)',
        value: financialSummary.clientsDebitVal,
        type: 'client_debit',
        color: '#e11d48', // Rose Red (مدين)
      });
    }

    return data;
  }, [financialSummary, selectedCurrency]);

  // تفصيل الأرصدة حسب كل صندوق وعميل بالاسم للرسم البياني الدائري المفصل
  const detailedPieData = useMemo(() => {
    const isUSD = selectedCurrency === 'USD';
    return accounts
      .map(acc => {
        const val = isUSD ? Math.abs(acc.balanceUSD) : Math.abs(acc.balanceIQD);
        let category = 'عميل';
        let color = '#059669'; // افتراضي دائن أخضر

        if (acc.type === 'cash_box') {
          category = 'صندوق نقدي';
          color = '#0284c7';
        } else if (acc.type === 'vault') {
          category = 'خزنة مركزية';
          color = '#0369a1';
        } else {
          const bal = isUSD ? acc.balanceUSD : acc.balanceIQD;
          if (bal < 0) {
            category = 'عميل مدين (عليه)';
            color = '#e11d48'; // أحمر دائماً للمدين
          } else {
            category = 'عميل دائن (له)';
            color = '#059669'; // أخضر دائماً للدائن
          }
        }

        return {
          name: `${acc.name} (${category})`,
          shortName: acc.name,
          value: val,
          category,
          color,
          balance: isUSD ? acc.balanceUSD : acc.balanceIQD,
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // أفضل 8 حسابات لتجنب الازدحام في الرسم البياني
  }, [accounts, selectedCurrency]);

  // قائمة الحسابات المفلترة للجدول
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (accountTypeFilter !== 'all') {
        if (accountTypeFilter === 'client') {
          if (acc.type === 'cash_box' || acc.type === 'vault') return false;
        } else if (acc.type !== accountTypeFilter) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        (acc.code && acc.code.toLowerCase().includes(q)) ||
        (acc.phone && acc.phone.includes(q))
      );
    });
  }, [accounts, accountTypeFilter, searchQuery]);

  // تصدير التقرير إلى Excel
  const handleExportExcel = () => {
    const exportData = filteredAccounts.map(acc => ({
      'رمز الحساب': acc.code || '',
      'اسم الحساب': acc.name,
      'نوع الحساب': acc.type === 'cash_box' ? 'صندوق نقدي' : acc.type === 'vault' ? 'خزنة مركزية' : 'عميل / زبون',
      'الرصيد بالدولار ($)': acc.balanceUSD,
      'الحالة بالدولار': acc.balanceUSD > 0 ? 'دائن (له 🟢)' : acc.balanceUSD < 0 ? 'مدين (عليه 🔴)' : 'متوازن',
      'الرصيد بالدينار (د.ع)': acc.balanceIQD,
      'الحالة بالدينار': acc.balanceIQD > 0 ? 'دائن (له 🟢)' : acc.balanceIQD < 0 ? 'مدين (عليه 🔴)' : 'متوازن',
      'رقم الهاتف': acc.phone || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الميزانية الشهرية');
    XLSX.writeFile(wb, `تقرير_الميزانية_${selectedMonth}.xlsx`);
  };

  const currencySymbol = selectedCurrency === 'USD' ? '$' : 'د.ع';

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full mx-auto" dir="rtl">
      
      {/* =========================================================================
          شريط الرأس الموحد بالثيم المصرفي الأزرق السماوي والأزرق الداكن
          ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-sky-400/30">
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-100 text-xs font-semibold backdrop-blur-md border border-white/20 mb-2">
              <PieChartIcon className="w-3.5 h-3.5 text-sky-200" />
              <span>التقارير المالية والمحاسبية المعتمدة</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>تقرير الميزانية الشهرية وتوزيع الأرصدة</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-white/20 border border-white/25">
                {companyName}
              </span>
            </h1>
            <p className="text-xs text-sky-100/90 mt-1 max-w-2xl">
              عرض بياني دائري لتوزيع السيولة النقدية وأرصدة الصناديق والخزائن وذمم وأمانات العملاء بدقة، وفقاً للقواعد المحاسبية الثابتة.
            </p>
          </div>

          {/* أزرار الإجراءات السريعة */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-200" />
              <span>طباعة التقرير</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          شريط التحكم والتصفية: الشهر والعملة
          ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
        
        {/* اختيار الشهر */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold text-slate-700">شهر التقرير:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {availableMonths.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* التبديل بين العملات */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <span className="text-xs text-slate-500 font-bold px-2">عملة التقرير:</span>
          <button
            onClick={() => setSelectedCurrency('USD')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
              selectedCurrency === 'USD'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            $ دولار أمريكي
          </button>
          <button
            onClick={() => setSelectedCurrency('IQD')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
              selectedCurrency === 'IQD'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            د.ع دينار عراقي
          </button>
        </div>

      </div>

      {/* =========================================================================
          بطاقات المؤشرات الإجمالية المتوافقة مع ألوان القواعد المحاسبية
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* نقدية الصناديق */}
        <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>نقدية الصناديق النقدية</span>
            <Wallet className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-950 mt-1">
            {financialSummary.cashBoxesVal.toLocaleString()} {currencySymbol}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">السيولة المباشرة بالصندوق</span>
        </div>

        {/* نقدية الخزائن المركزية */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>الخزائن المركزية (معزولة)</span>
            <Landmark className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-900 mt-1">
            {financialSummary.vaultsVal.toLocaleString()} {currencySymbol}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">الاحتياطي النقدي المركزي</span>
        </div>

        {/* أمانات العملاء (دائن 🟢 أخضر) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>أمانات العملاء (دائن 🟢 له)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 mt-1">
            {financialSummary.clientsCreditVal.toLocaleString()} {currencySymbol}
          </div>
          <span className="text-[11px] text-emerald-700/80 mt-0.5 block font-bold">أرصدة لصالح العملاء (مطلوبات)</span>
        </div>

        {/* ذمم العملاء (مدين 🔴 أحمر) */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
            <span>ديون العملاء (مدين 🔴 عليه)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 mt-1">
            {financialSummary.clientsDebitVal.toLocaleString()} {currencySymbol}
          </div>
          <span className="text-[11px] text-rose-700/80 mt-0.5 block font-bold">مستحقات على العملاء (موجودات)</span>
        </div>

      </div>

      {/* =========================================================================
          قسم الرسوم البيانية الدائرية باستخدام Recharts
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* الرسم البياني الدائري الرئيسي: توزيع الأرصدة الإجمالية بين الصناديق والعملاء */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-sky-600" />
                  <span>توزيع الأرصدة الإجمالية (الصناديق vs العملاء)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  نسبة السيولة النقدية مقارنة بأمانات وديون الزبائن والوكلاء
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {selectedCurrency}
              </span>
            </div>

            {/* الرسم الدائري Recharts */}
            <div className="h-[280px] w-full">
              {pieChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <PieChartIcon className="w-10 h-10 mb-2 stroke-1" />
                  <p className="text-xs font-bold">لا توجد بيانات أرصدة كافية للعرض</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [`${val.toLocaleString()} ${currencySymbol}`, 'القيمة']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        direction: 'rtl',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(value) => <span className="text-slate-700 font-bold">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* تفاصيل نسب التوزيع */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
            {pieChartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-800">
                  {item.value.toLocaleString()} {currencySymbol}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* الرسم البياني الدائري الثاني: أكبر 8 حسابات نقدية وعملاء */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>توزيع أكبر الحسابات وزناً (Top Accounts)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  توزيع الأرصدة الفردية بين الصناديق والعملاء الأعلى رصيداً
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                أعلى 8 حسابات
              </span>
            </div>

            {/* الرسم الدائري Recharts للحسابات التفصيلية */}
            <div className="h-[280px] w-full">
              {detailedPieData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <PieChartIcon className="w-10 h-10 mb-2 stroke-1" />
                  <p className="text-xs font-bold">لا توجد أرصدة بالحسابات</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={detailedPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      dataKey="value"
                      label={({ shortName, percent }) => `${shortName}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {detailedPieData.map((entry, index) => (
                        <Cell key={`cell-det-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [`${val.toLocaleString()} ${currencySymbol}`, 'الرصيد']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        direction: 'rtl',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(value) => <span className="text-slate-700 font-bold">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 text-xs text-sky-950 mt-4 flex items-center justify-between">
            <span className="font-bold">القاعدة المحاسبية المعتمدة:</span>
            <span className="text-emerald-700 font-bold">الدائن (له 🟢 أخضر)</span>
            <span className="text-rose-700 font-bold">المدين (عليه 🔴 أحمر)</span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          جدول الأرصدة الشامل لجميع الحسابات والصناديق والعملاء
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <span>كشف تفصيلي بتوزيع الأرصدة المحاسبية</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              قائمة متكاملة بالصناديق والخزائن وحسابات الزبائن والوكلاء مع تطبيق ألوان الدائن والمدين
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* بحث في الجدول */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الحساب أو الرمز..."
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:bg-white focus:outline-none focus:border-sky-500"
            />

            {/* فلتر النوع */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setAccountTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  accountTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setAccountTypeFilter('cash_box')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  accountTypeFilter === 'cash_box' ? 'bg-white text-sky-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                الصناديق
              </button>
              <button
                onClick={() => setAccountTypeFilter('vault')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  accountTypeFilter === 'vault' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                الخزائن
              </button>
              <button
                onClick={() => setAccountTypeFilter('client')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  accountTypeFilter === 'client' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                العملاء
              </button>
            </div>
          </div>
        </div>

        {/* الجدول الفعلي */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 text-[11px] font-black border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">رمز الحساب</th>
                <th className="py-3 px-4">اسم الحساب</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">الرصيد بالدولار ($)</th>
                <th className="py-3 px-4">المركز بالدولار</th>
                <th className="py-3 px-4">الرصيد بالدينار (د.ع)</th>
                <th className="py-3 px-4">المركز بالدينار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد حسابات مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => {
                  const isVault = acc.type === 'vault';
                  const isCash = acc.type === 'cash_box';

                  return (
                    <tr key={acc.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        {acc.code || '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {acc.name}
                      </td>
                      <td className="py-3 px-4">
                        {isCash ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                            <Wallet className="w-3 h-3" />
                            صندوق نقدي
                          </span>
                        ) : isVault ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            <Landmark className="w-3 h-3" />
                            خزنة مركزية
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Users className="w-3 h-3" />
                            عميل / زبون
                          </span>
                        )}
                      </td>

                      {/* الدولار */}
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        ${acc.balanceUSD.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {isCash || isVault ? (
                          <span className="text-[11px] font-bold text-slate-500">نقدية فعلية</span>
                        ) : acc.balanceUSD > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            دائن (له 🟢)
                          </span>
                        ) : acc.balanceUSD < 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            مدين (عليه 🔴)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">متوازن</span>
                        )}
                      </td>

                      {/* الدينار */}
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        {acc.balanceIQD.toLocaleString()} د.ع
                      </td>
                      <td className="py-3 px-4">
                        {isCash || isVault ? (
                          <span className="text-[11px] font-bold text-slate-500">نقدية فعلية</span>
                        ) : acc.balanceIQD > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            دائن (له 🟢)
                          </span>
                        ) : acc.balanceIQD < 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            مدين (عليه 🔴)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">متوازن</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* إحصائيات الذيل */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold">
            عدد الحسابات المعروضة: {filteredAccounts.length} من أصل {accounts.length}
          </span>
          <span className="text-[11px] text-slate-400">
            تقرير الميزانية صادر بتاريخ {new Date().toLocaleDateString('ar-IQ')}
          </span>
        </div>

      </div>

    </div>
  );
};
