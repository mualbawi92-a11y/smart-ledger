import React, { useState } from 'react';
import { X, CalendarClock, Search, CheckCircle2, AlertTriangle, Clock, Phone, User, Check, HandCoins } from 'lucide-react';
import { InstallmentContract } from '../../types/sales';

interface InstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  installments: InstallmentContract[];
  onPayInstallment: (contractId: string, amount: number) => void;
}

export const InstallmentsModal: React.FC<InstallmentsModalProps> = ({
  isOpen,
  onClose,
  installments,
  onPayInstallment,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [payingContractId, setPayingContractId] = useState<string | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number | ''>('');

  if (!isOpen) return null;

  const filteredInstallments = installments.filter(item => {
    const matchesSearch = !searchQuery.trim() || 
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.clientPhone && item.clientPhone.includes(searchQuery.trim()));
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalRemainingDebts = installments.reduce((acc, i) => acc + (i.status !== 'completed' ? i.remainingAmountIQD : 0), 0);
  const overdueCount = installments.filter(i => i.status === 'overdue').length;
  const overdueAmount = installments
    .filter(i => i.status === 'overdue')
    .reduce((acc, i) => acc + i.monthlyAmountIQD, 0);

  const handleConfirmPay = (contract: InstallmentContract) => {
    const val = payAmountInput === '' ? contract.monthlyAmountIQD : Number(payAmountInput);
    if (!val || val <= 0) return;
    onPayInstallment(contract.id, val);
    setPayingContractId(null);
    setPayAmountInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4.5 bg-[#0f3b63] text-white flex items-center justify-between border-b border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">إدارة ومتابعة أقساط العملاء (Installments Manager)</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40">
                  {overdueCount} قسط متأخر
                </span>
              </div>
              <p className="text-xs text-sky-200">جدول سداد الأقساط الشهرية، الدفعات المستحقة، وتحصيل الأقساط المتأخرة</p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top KPI Metrics bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">إجمالي ديون التقسيط المتبقية:</span>
            <span className="text-base font-black font-mono text-slate-900">{totalRemainingDebts.toLocaleString()} د.ع</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[11px] text-rose-600 font-bold block">الأقساط المتأخرة المستحقة:</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-black font-mono text-rose-700">{overdueAmount.toLocaleString()} د.ع</span>
              <span className="text-[11px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                {overdueCount} متأخرة
              </span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-[11px] text-emerald-700 font-bold block">إجمالي عقود التقسيط النشطة:</span>
            <span className="text-base font-black font-mono text-emerald-800">
              {installments.filter(i => i.status !== 'completed').length} عقد تقسيط
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم العميل أو رقم الفاتورة..."
              className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-sky-600"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({installments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('overdue')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'overdue' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المتأخرة ({overdueCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المنتظمة
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="p-4 max-h-[55vh] overflow-y-auto">
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#f0f7fc] text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">القسط الشهري</th>
                  <th className="p-3">المتبقي الإجمالي</th>
                  <th className="p-3">تاريخ الاستحقاق</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">التحصيل والسداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstallments.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item.clientName}</div>
                      {item.clientPhone && <div className="text-[11px] text-slate-500 font-mono">{item.clientPhone}</div>}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.invoiceCode}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {item.monthlyAmountIQD.toLocaleString()} د.ع
                    </td>
                    <td className="p-3 font-mono font-black text-rose-700">
                      {item.remainingAmountIQD.toLocaleString()} د.ع
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {item.nextDueDate}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        item.status === 'overdue' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : item.status === 'completed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {item.status === 'overdue' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {item.status === 'overdue' ? 'متأخر' : item.status === 'completed' ? 'مسدد بالكامل' : 'منتظم'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {item.status !== 'completed' ? (
                        payingContractId === item.id ? (
                          <div className="flex items-center justify-center gap-1.5 animate-in fade-in">
                            <input
                              type="number"
                              defaultValue={item.monthlyAmountIQD}
                              onChange={(e) => setPayAmountInput(Number(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleConfirmPay(item)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer"
                            >
                              قبض
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayingContractId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setPayingContractId(item.id);
                              setPayAmountInput(item.monthlyAmountIQD);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 mx-auto cursor-pointer shadow-2xs"
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                            <span>قبض قسط</span>
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs">خالص 100%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
