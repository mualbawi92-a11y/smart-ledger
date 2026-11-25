import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Landmark, 
  Search, 
  Plus, 
  Printer, 
  CheckCircle2, 
  Wallet,
  Download,
  FileDown,
  Loader2,
  Calendar,
  RotateCcw,
  RefreshCw,
  X,
  TrendingUp,
  TrendingDown,
  FileText
} from 'lucide-react';
import { TransactionRecord, AccountItem } from '../../../types';
import { exportElementToPdf } from '../../../utils/pdfExport';

interface WebCashFlowScreenProps {
  transactions: TransactionRecord[];
  accounts?: AccountItem[];
  onOpenNewTransaction: () => void;
  onViewReceipt: (tx: TransactionRecord) => void;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyLogo?: string;
  systemUser?: string;
}

export const WebCashFlowScreen: React.FC<WebCashFlowScreenProps> = ({
  transactions,
  accounts = [],
  onOpenNewTransaction,
  onViewReceipt,
  companyName = '',
  companyPhone,
  companyAddress,
  companyLogo,
  systemUser = 'المدير العام',
}) => {
  // 1. الفلاتر
  const [activeFilter, setActiveFilter] = useState<'all' | 'cash_in' | 'cash_out' | 'bank_deposit'>('all');
  const [selectedBoxId, setSelectedBoxId] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // 2. حالات الطباعة وتصدير PDF
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // استخراج الصناديق النقدية المتاحة في النظام
  const cashBoxAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'cash_box' || a.name.includes('صندوق'));
  }, [accounts]);

  // وقت وتاريخ الطباعة
  const printTimestamp = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${year}/${month}/${day} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
  }, [isPrintModalOpen]);

  // تصفية السندات الخاصة بالنقدية والبنوك
  const cashRecords = useMemo(() => {
    return transactions.filter(t => 
      t.type === 'cash_in' || t.type === 'cash_out' || t.type === 'bank_deposit'
    );
  }, [transactions]);

  // تطبيق كافة الفلاتر والبحث
  const filteredRecords = useMemo(() => {
    return cashRecords.filter(t => {
      // نوع الحركة
      if (activeFilter !== 'all' && t.type !== activeFilter) return false;

      // العملة
      if (selectedCurrency !== 'all' && t.currency !== selectedCurrency) return false;

      // الصندوق
      if (selectedBoxId !== 'all') {
        if (t.cashBoxId && t.cashBoxId !== selectedBoxId) return false;
      }

      // نطاق التاريخ
      if (dateFrom && t.createdAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && t.createdAt.slice(0, 10) > dateTo) return false;

      // البحث النصي
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = t.code.toLowerCase().includes(q);
        const nameMatch = (t.senderName || t.receiverName || t.accountName || '').toLowerCase().includes(q);
        const notesMatch = (t.notes || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [cashRecords, activeFilter, selectedCurrency, selectedBoxId, dateFrom, dateTo, searchQuery]);

  // الإحصائيات المالية المباشرة
  const stats = useMemo(() => {
    let totalCashInIQD = 0;
    let totalCashInUSD = 0;
    let totalCashOutIQD = 0;
    let totalCashOutUSD = 0;
    let totalBankDepositIQD = 0;
    let totalBankDepositUSD = 0;

    filteredRecords.forEach(t => {
      if (t.type === 'cash_in') {
        if (t.currency === 'USD') totalCashInUSD += t.amount;
        else totalCashInIQD += t.amount;
      } else if (t.type === 'cash_out') {
        if (t.currency === 'USD') totalCashOutUSD += t.amount;
        else totalCashOutIQD += t.amount;
      } else if (t.type === 'bank_deposit') {
        if (t.currency === 'USD') totalBankDepositUSD += t.amount;
        else totalBankDepositIQD += t.amount;
      }
    });

    return {
      totalCashInIQD,
      totalCashInUSD,
      totalCashOutIQD,
      totalCashOutUSD,
      totalBankDepositIQD,
      totalBankDepositUSD,
      netIQD: totalCashInIQD - totalCashOutIQD,
      netUSD: totalCashInUSD - totalCashOutUSD,
    };
  }, [filteredRecords]);

  // إعادة ضبط الفلاتر
  const handleResetFilters = () => {
    setActiveFilter('all');
    setSelectedBoxId('all');
    setSelectedCurrency('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  // تصدير PDF رسمي
  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      let printEl = document.getElementById('printable-cash-flow-report-sheet');
      if (!printEl) {
        setIsPrintModalOpen(true);
        await new Promise(r => setTimeout(r, 200));
        printEl = document.getElementById('printable-cash-flow-report-sheet');
      }

      if (printEl) {
        const boxLabel = selectedBoxId === 'all' ? 'كافة_الصناديق' : 'الصندوق';
        const dateStr = new Date().toISOString().slice(0, 10);
        await exportElementToPdf(printEl, {
          filename: `تقرير_حركة_الصندوق_${boxLabel}_${dateStr}.pdf`,
          orientation: 'portrait',
          marginMm: 6,
        });
      } else {
        window.print();
      }
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // تصدير CSV / Excel
  const handleExportCSV = () => {
    const rows = [
      ['رقم السند', 'نوع الحركة', 'الطرف المعني / الزبون', 'المبلغ', 'العملة', 'البيان والملاحظات', 'التاريخ'],
      ...filteredRecords.map(item => [
        item.code,
        item.titleAr,
        item.senderName || item.receiverName || item.accountName || '-',
        item.amount.toString(),
        item.currency,
        `"${item.notes || ''}"`,
        item.createdAt
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `تقرير_حركة_الصندوق_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCurrencyArabic = (curr: string) => {
    switch (curr) {
      case 'IQD': return 'دينار عراقي';
      case 'USD': return 'دولار أمريكي';
      case 'all': return 'كافة العملات';
      default: return curr;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 w-full max-w-full mx-auto text-slate-800" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0C7A66] via-[#095749] to-[#043d33] text-white px-5 py-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-200 border border-white/20 shadow-inner">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>تقرير حركة الصندوق والمقبوضات والمدفوعات</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 border border-white/20">
                سندات الصندوق النقدي
              </span>
            </h1>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              كشف حركات القبض والصرف اليومية وتغذية البنوك مع إمكانية التصدير والطباعة الرسمية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* تحرير سند جديد */}
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-bold border border-white/20 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تحرير سند / إيداع جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Advanced Filters and Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3.5">
        
        {/* السطر الأول من الفلاتر */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* اختيار الصندوق */}
          {cashBoxAccounts.length > 0 && (
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="font-bold text-slate-700 text-[11px] whitespace-nowrap">الصندوق:</span>
              <select
                value={selectedBoxId}
                onChange={(e) => setSelectedBoxId(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-inner"
              >
                <option value="all">كافة الصناديق النقدية</option>
                {cashBoxAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* العملة */}
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="font-bold text-slate-700 text-[11px] whitespace-nowrap">العملة:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-inner"
            >
              <option value="all">كافة العملات</option>
              <option value="IQD">دينار عراقي (IQD)</option>
              <option value="USD">دولار أمريكي (USD)</option>
            </select>
          </div>

          {/* نطاق التاريخ */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 text-[11px]">التاريخ:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-32 px-2 py-1.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-32 px-2 py-1.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>
          </div>

          {/* البحث بالاسم أو رقم السند */}
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم السند، الطرف المعني، أو الملاحظات..."
              className="w-full px-3 py-1.5 pr-8 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* زر إعادة الضبط */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0"
            title="إعادة ضبط الفلاتر"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة ضبط</span>
          </button>
        </div>

        {/* السطر الثاني: تبويبات نوع الحركة + أزرار الطباعة وتصدير PDF */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* تبويبات الفلترة */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كافة السندات ({cashRecords.length})
            </button>
            <button
              onClick={() => setActiveFilter('cash_in')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'cash_in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span>قبض نقدي (وارد 🟢)</span>
            </button>
            <button
              onClick={() => setActiveFilter('cash_out')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'cash_out' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span>صرف نقدي (صادر 🔴)</span>
            </button>
            <button
              onClick={() => setActiveFilter('bank_deposit')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'bank_deposit' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              إيداعات بنكية
            </button>
          </div>

          {/* أزرار الإجراءات والطباعة */}
          <div className="flex items-center gap-2">
            {/* طباعة التقرير */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="h-8 px-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="معاينة وطباعة تقرير الصندوق"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>طباعة التقرير</span>
            </button>

            {/* تصدير كـ PDF رسمي */}
            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="h-8 px-4 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              title="تصدير تقرير الصندوق إلى ملف PDF رسمي للطباعة"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-rose-100" />
              )}
              <span>{isExportingPdf ? 'جارٍ تصدير PDF...' : 'تصدير كـ PDF'}</span>
            </button>

            {/* تصدير Excel / CSV */}
            <button
              onClick={handleExportCSV}
              className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              title="تصدير جدول السندات إلى ملف CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-100" />
              <span>تصدير Excel/CSV</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. بطاقات الإحصائيات المالية المباشرة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* إجمالي المقبوضات (وارد 🟢 دائن) */}
        <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 block">إجمالي المقبوضات (وارد 🟢)</span>
            <div className="mt-1 space-y-0.5 font-mono font-black text-emerald-800 text-base">
              <div>{stats.totalCashInIQD.toLocaleString()} <span className="text-xs font-sans font-bold text-emerald-600">د.ع</span></div>
              <div className="text-xs text-emerald-700">{stats.totalCashInUSD.toLocaleString()} $</div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* إجمالي المدفوعات (صادر 🔴 مدين) */}
        <div className="bg-white border-2 border-rose-300/80 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-700 block">إجمالي المدفوعات (صادر 🔴)</span>
            <div className="mt-1 space-y-0.5 font-mono font-black text-rose-800 text-base">
              <div>{stats.totalCashOutIQD.toLocaleString()} <span className="text-xs font-sans font-bold text-rose-600">د.ع</span></div>
              <div className="text-xs text-rose-700">{stats.totalCashOutUSD.toLocaleString()} $</div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* صافي حركة الصندوق */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-700 block">صافي حركة الصندوق</span>
            <div className="mt-1 space-y-0.5 font-mono font-black text-base">
              <div className={stats.netIQD >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {stats.netIQD.toLocaleString()} <span className="text-xs font-sans font-bold">د.ع</span>
              </div>
              <div className={`text-xs ${stats.netUSD >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {stats.netUSD.toLocaleString()} $
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* الإيداعات المصرفية */}
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-700 block">الإيداعات المصرفية للبنوك</span>
            <div className="mt-1 space-y-0.5 font-mono font-black text-blue-800 text-base">
              <div>{stats.totalBankDepositIQD.toLocaleString()} <span className="text-xs font-sans font-bold text-blue-600">د.ع</span></div>
              <div className="text-xs text-blue-700">{stats.totalBankDepositUSD.toLocaleString()} $</div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 4. جدول سجلات السندات */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ت</th>
                <th className="py-3 px-4">رقم السند</th>
                <th className="py-3 px-4">نوع الحركة</th>
                <th className="py-3 px-4">الطرف المعني / الحساب</th>
                <th className="py-3 px-4 text-center">المبلغ (دائن 🟢 / مدين 🔴)</th>
                <th className="py-3 px-4">البيان والملاحظات</th>
                <th className="py-3 px-4 text-center">التاريخ والوقت</th>
                <th className="py-3 px-4 text-center w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item, idx) => {
                  const isIncoming = item.type === 'cash_in' || item.type === 'bank_deposit';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.type === 'cash_in' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : item.type === 'bank_deposit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.titleAr}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {item.senderName || item.receiverName || item.accountName || '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-sm">
                        <span className={isIncoming ? 'text-emerald-700' : 'text-rose-600'}>
                          {isIncoming ? '+' : '-'}{item.amount.toLocaleString()} {item.currency}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-normal">
                        {item.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {item.createdAt}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onViewReceipt(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="عرض وطباعة وصل السند"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>وصل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    لا توجد سندات مسجلة تطابق معايير البحث المحددة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          نافذة معاينة وطباعة تقرير الصندوق الرسمي (Official Cash Box Print Modal)
          ========================================================================= */}
      {isPrintModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsPrintModalOpen(false)}
        >
          {/* شريط التحكم بالطباعة العلوي */}
          <div 
            className="w-full max-w-5xl mx-auto bg-slate-900 text-white rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl mb-4 shrink-0 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <Printer className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-bold text-sm">معاينة طباعة تقرير الصندوق النقدي</span>
                <span className="text-xs text-slate-400 block">
                  تقرير حركة المقبوضات والمدفوعات الرسمية
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExportingPdf}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                title="تنزيل تقرير الصندوق كملف PDF عالي الجودة"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>{isExportingPdf ? 'جارٍ تجهيز PDF...' : 'تنزيل كـ PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                title="طباعة التقرير فوراً (Ctrl + P)"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة المستند الآن</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="إغلاق المعاينة"
              >
                <span>إغلاق (ESC)</span>
              </button>
            </div>
          </div>

          {/* ورقة التقرير المطبوع بنقاء 100% */}
          <div 
            className="w-full max-w-5xl mx-auto bg-white rounded-sm shadow-2xl p-6 sm:p-10 text-black border border-slate-300 font-sans my-auto shrink-0 select-text"
            onClick={(e) => e.stopPropagation()}
          >
            <div id="printable-cash-flow-report-sheet" className="w-full bg-white text-black">
              
              {/* الترويسة الرسمية */}
              <div className="w-full pb-4 border-b-2 border-black text-black">
                <div className="grid grid-cols-3 items-start text-xs">
                  {/* يمين: اسم الشركة */}
                  <div className="text-right font-bold space-y-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-black text-black">: الشـركـة</span>
                      <span className="font-bold text-slate-900">{companyName}</span>
                    </div>
                    {companyPhone && (
                      <div className="text-[11px] text-slate-600 font-mono">هاتف: {companyPhone}</div>
                    )}
                  </div>

                  {/* وسط: العنوان الرئيسي المسطر */}
                  <div className="text-center">
                    <h1 className="text-base sm:text-lg font-black underline tracking-widest text-black underline-offset-4">
                      تـقـريـر حـركـة الـصـنـدوق الـنـقـدي
                    </h1>
                    <span className="text-[11px] font-bold text-slate-700 block mt-1">
                      كشف المقبوضات والمدفوعات
                    </span>
                  </div>

                  {/* يسار: التاريخ والوقت */}
                  <div className="text-left text-[11px] font-mono font-bold text-black" dir="ltr">
                    <span>وقت وتاريخ الطباعة : </span>
                    <span>{printTimestamp}</span>
                  </div>
                </div>

                {/* شريط تفاصيل الفلترة والفترة */}
                <div className="grid grid-cols-3 items-center text-xs mt-3 pt-2 border-t border-slate-200">
                  <div className="text-right">
                    <span className="font-bold">: الصندوق المختار</span>{' '}
                    <span className="font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      {selectedBoxId === 'all' ? 'كافة الصناديق' : (cashBoxAccounts.find(b => b.id === selectedBoxId)?.name || 'الصندوق الرئيسي')}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="font-bold">العملة : </span>
                    <span className="font-bold">{getCurrencyArabic(selectedCurrency)}</span>
                  </div>

                  <div className="text-left text-[11px] font-mono" dir="rtl">
                    <span className="font-bold">للفترة : </span>
                    <span>{dateFrom ? dateFrom.replace(/-/g, '/') : 'بداية النشاط'}</span>
                    <span className="font-bold"> إلى : </span>
                    <span>{dateTo ? dateTo.replace(/-/g, '/') : new Date().toISOString().slice(0, 10).replace(/-/g, '/')}</span>
                  </div>
                </div>
              </div>

              {/* ملخص الإجماليات */}
              <div className="my-3 grid grid-cols-3 gap-3 text-xs border border-black p-2.5 bg-slate-50/60 font-bold">
                <div className="border border-black p-2 bg-white text-center">
                  <span className="text-[11px] text-slate-700 block">إجمالي المقبوضات (وارد 🟢):</span>
                  <div className="font-mono font-black text-emerald-700 text-sm mt-0.5">
                    {stats.totalCashInIQD.toLocaleString()} د.ع | {stats.totalCashInUSD.toLocaleString()} $
                  </div>
                </div>

                <div className="border border-black p-2 bg-white text-center">
                  <span className="text-[11px] text-slate-700 block">إجمالي المدفوعات (صادر 🔴):</span>
                  <div className="font-mono font-black text-rose-700 text-sm mt-0.5">
                    {stats.totalCashOutIQD.toLocaleString()} د.ع | {stats.totalCashOutUSD.toLocaleString()} $
                  </div>
                </div>

                <div className="border border-black p-2 bg-white text-center">
                  <span className="text-[11px] text-slate-700 block">صافي الحركة المحققة:</span>
                  <div className={`font-mono font-black text-sm mt-0.5 ${stats.netIQD >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {stats.netIQD.toLocaleString()} د.ع | {stats.netUSD.toLocaleString()} $
                  </div>
                </div>
              </div>

              {/* جدول السندات في الورقة المطبوعة */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full border-collapse border-2 border-black text-xs text-black">
                  <thead>
                    <tr className="bg-slate-200 border-b border-black text-center font-bold">
                      <th className="border border-black px-1.5 py-1.5 w-8">ت</th>
                      <th className="border border-black px-2 py-1.5 w-24">التاريخ</th>
                      <th className="border border-black px-2 py-1.5 w-24">رقم السند</th>
                      <th className="border border-black px-2 py-1.5 w-24">نوع الحركة</th>
                      <th className="border border-black px-3 py-1.5 text-right">الطرف المعني / الزبون</th>
                      <th className="border border-black px-2 py-1.5 w-28 text-center text-rose-700">مدين (صادر 🔴)</th>
                      <th className="border border-black px-2 py-1.5 w-28 text-center text-emerald-700">دائن (وارد 🟢)</th>
                      <th className="border border-black px-3 py-1.5 text-right">البيان والملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((item, idx) => {
                        const isIncome = item.type === 'cash_in';
                        const isExpense = item.type === 'cash_out';
                        return (
                          <tr key={idx} className="border-b border-black">
                            <td className="border border-black px-1 py-1 text-center font-mono font-bold">{idx + 1}</td>
                            <td className="border border-black px-2 py-1 text-center font-mono font-bold whitespace-nowrap">
                              {item.createdAt.slice(0, 10).replace(/-/g, '/')}
                            </td>
                            <td className="border border-black px-2 py-1 text-center font-mono font-bold whitespace-nowrap">
                              {item.code}
                            </td>
                            <td className="border border-black px-2 py-1 text-center whitespace-nowrap font-semibold">
                              {item.titleAr}
                            </td>
                            <td className="border border-black px-3 py-1 text-right font-bold">
                              {item.senderName || item.receiverName || item.accountName || '-'}
                            </td>
                            <td className="border border-black px-2 py-1 text-center font-mono font-bold text-rose-700 whitespace-nowrap">
                              {isExpense ? `${item.amount.toLocaleString()} ${item.currency}` : '-'}
                            </td>
                            <td className="border border-black px-2 py-1 text-center font-mono font-bold text-emerald-700 whitespace-nowrap">
                              {isIncome ? `${item.amount.toLocaleString()} ${item.currency}` : '-'}
                            </td>
                            <td className="border border-black px-3 py-1 text-right font-normal">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="border border-black py-8 text-center text-slate-500 font-bold">
                          لا توجد حركات مسجلة خلال الفترة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* التواقيع الرسمية للتقرير */}
              <div className="grid grid-cols-3 gap-6 mt-6 pt-4 border-t-2 border-black text-center text-xs">
                <div>
                  <span className="font-bold block text-slate-800">أمين الصندوق / المحاسب</span>
                  <span className="text-[11px] text-slate-500 block mt-1">{systemUser}</span>
                  <div className="mt-8 border-b border-black w-2/3 mx-auto"></div>
                </div>
                <div>
                  <span className="font-bold block text-slate-800">مدقق الحسابات الداخلي</span>
                  <span className="text-[11px] text-slate-500 block mt-1">قسم التدقيق المالي</span>
                  <div className="mt-8 border-b border-black w-2/3 mx-auto"></div>
                </div>
                <div>
                  <span className="font-bold block text-slate-800">المدير العام والختم</span>
                  <span className="text-[11px] text-slate-500 block mt-1">{companyName}</span>
                  <div className="mt-8 border-b border-black w-2/3 mx-auto"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* أنماط الطباعة CSS لتقرير الصندوق */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-cash-flow-report-sheet,
          #printable-cash-flow-report-sheet * {
            visibility: visible !important;
          }
          #printable-cash-flow-report-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 8mm 12mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 9999999 !important;
          }
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
        }
      `}</style>

    </div>
  );
};
