import React, { useState } from 'react';
import { X, DollarSign, Wallet, Check, AlertCircle, FileText } from 'lucide-react';
import { AccountItem } from '../../types';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountItem[];
  companyName?: string;
  systemUser?: string;
  onSaveExpense: (expense: {
    category: string;
    amountIQD: number;
    amountUSD?: number;
    cashBoxId: string;
    recipientName: string;
    notes?: string;
  }) => void;
}

export const ExpensesModal: React.FC<ExpensesModalProps> = ({
  isOpen,
  onClose,
  accounts,
  companyName = 'نظام إدارة المبيعات والأقساط',
  systemUser = 'المدير العام',
  onSaveExpense,
}) => {
  const [category, setCategory] = useState('مصاريف عامة ونثريات');
  const [amountIQD, setAmountIQD] = useState<number | ''>('');
  const [selectedCashBoxId, setSelectedCashBoxId] = useState(() => {
    const box = accounts.find(a => a.type === 'cash_box');
    return box?.id || 'acc-box-1';
  });
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const cashBoxes = accounts.filter(a => a.type === 'cash_box');
  const expenseCategories = [
    'إيجار المحل أو المعرض',
    'أجور كهرباء ومولد ومياه',
    'مصاريف ضيافة وبوفيه ونظافة',
    'رواتب وأجور موظفين وعمال',
    'صيانة وتصليح وديكورات',
    'نقل وشحن ومناولة بضائع',
    'إعلانات وتسويق وتصوير',
    'مصاريف عامة ونثريات'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amountIQD);
    if (!val || val <= 0) return;

    onSaveExpense({
      category,
      amountIQD: val,
      cashBoxId: selectedCashBoxId,
      recipientName: recipientName.trim(),
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4.5 bg-[#0f3b63] text-white flex items-center justify-between border-b border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">تسجيل وقيد المصاريف (Expenses Voucher)</h3>
              <p className="text-[11px] text-sky-200">صرف مباشر من الصندوق النقدي مع تقييد الحساب المحاسبي</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          
          {/* تنبيه محاسبي لعزل الخزنة */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-[11px] leading-relaxed">
            🛡️ <strong>القاعدة المحاسبية المعتمدة:</strong> يتم خصم المصروف من رصيد الصندوق النقدي المختار حصراً، وحساب الخزنة المركزية معزول تماماً 100%.
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">بند ونوع المصروف <span className="text-rose-500">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
            >
              {expenseCategories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المبلغ المصروف (د.ع) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                min="1"
                required
                value={amountIQD}
                onChange={(e) => setAmountIQD(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl font-mono font-black text-rose-700 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الصندوق المخصوم منه:</label>
              <select
                value={selectedCashBoxId}
                onChange={(e) => setSelectedCashBoxId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
              >
                {cashBoxes.map(b => (
                  <option key={b.id} value={b.id}>{b.name} (رصيد: {b.balanceIQD.toLocaleString()} د.ع)</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">المستلم / المدفوع لأمره:</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="اسم الشخص أو الجهة المستلمة للمبلغ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-sky-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">البيان / تفاصيل الصرف:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شرح سبب المصروف وتفاصيله..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 outline-none focus:border-sky-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0f3b63] hover:bg-[#0a2844] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>تثبيت سند الصرف (F2)</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
