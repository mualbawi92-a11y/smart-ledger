import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Printer, 
  Check, 
  CreditCard, 
  Coins, 
  Calendar, 
  User, 
  Phone, 
  FileText,
  BadgePercent,
  Receipt
} from 'lucide-react';
import { ProductItem } from '../../types/sales';
import { AccountItem, TransactionRecord } from '../../types';

interface SalesInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  accounts: AccountItem[];
  companyName?: string;
  systemUser?: string;
  onSaveInvoice: (invoice: {
    clientName: string;
    clientPhone: string;
    accountId?: string;
    paymentType: 'cash' | 'installment' | 'credit';
    items: {
      productId: string;
      productName: string;
      quantity: number;
      priceIQD: number;
      totalIQD: number;
    }[];
    subtotalIQD: number;
    discountIQD: number;
    totalIQD: number;
    paidAmountIQD: number;
    remainingAmountIQD: number;
    cashBoxId: string;
    notes?: string;
  }) => void;
}

export const SalesInvoiceModal: React.FC<SalesInvoiceModalProps> = ({
  isOpen,
  onClose,
  products,
  accounts,
  companyName = 'نظام إدارة المبيعات والأقساط',
  systemUser = 'المدير العام',
  onSaveInvoice,
}) => {
  const [clientType, setClientType] = useState<'existing' | 'walk_in'>('walk_in');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [clientName, setClientName] = useState('زبون نقدي عام');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'installment' | 'credit'>('cash');
  const [selectedCashBoxId, setSelectedCashBoxId] = useState(() => {
    const box = accounts.find(a => a.type === 'cash_box');
    return box?.id || 'acc-box-1';
  });

  const [invoiceItems, setInvoiceItems] = useState<{
    productId: string;
    productName: string;
    quantity: number;
    priceIQD: number;
    totalIQD: number;
  }[]>([
    {
      productId: products[0]?.id || 'prd-1',
      productName: products[0]?.name || 'هاتف Samsung Galaxy A54',
      quantity: 1,
      priceIQD: products[0]?.sellingPriceIQD || 495000,
      totalIQD: products[0]?.sellingPriceIQD || 495000
    }
  ]);

  const [discountIQD, setDiscountIQD] = useState<number>(0);
  const [paidAmountInput, setPaidAmountInput] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  if (!isOpen) return null;

  const cashBoxes = accounts.filter(a => a.type === 'cash_box');
  const clientAccounts = accounts.filter(a => a.type === 'client');

  const subtotalIQD = invoiceItems.reduce((sum, item) => sum + item.totalIQD, 0);
  const totalIQD = Math.max(0, subtotalIQD - (Number(discountIQD) || 0));
  const paidAmountIQD = paymentType === 'cash' 
    ? totalIQD 
    : (paidAmountInput === '' ? 0 : Number(paidAmountInput));
  const remainingAmountIQD = Math.max(0, totalIQD - paidAmountIQD);

  const handleAddItem = () => {
    const firstPrd = products[0];
    if (!firstPrd) return;
    const price = paymentType === 'installment' ? firstPrd.installmentPriceIQD : firstPrd.sellingPriceIQD;
    setInvoiceItems(prev => [
      ...prev,
      {
        productId: firstPrd.id,
        productName: firstPrd.name,
        quantity: 1,
        priceIQD: price,
        totalIQD: price
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    setInvoiceItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };
      if (field === 'productId') {
        const prd = products.find(p => p.id === val);
        if (prd) {
          item.productId = prd.id;
          item.productName = prd.name;
          item.priceIQD = paymentType === 'installment' ? prd.installmentPriceIQD : prd.sellingPriceIQD;
          item.totalIQD = item.priceIQD * item.quantity;
        }
      } else if (field === 'quantity') {
        const qty = Math.max(1, Number(val) || 1);
        item.quantity = qty;
        item.totalIQD = item.priceIQD * qty;
      } else if (field === 'priceIQD') {
        const p = Math.max(0, Number(val) || 0);
        item.priceIQD = p;
        item.totalIQD = p * item.quantity;
      }
      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItems.length === 0) return;

    const resolvedName = clientType === 'existing' 
      ? (clientAccounts.find(a => a.id === selectedAccountId)?.name || clientName)
      : clientName;

    onSaveInvoice({
      clientName: resolvedName,
      clientPhone,
      accountId: clientType === 'existing' ? selectedAccountId : undefined,
      paymentType,
      items: invoiceItems,
      subtotalIQD,
      discountIQD: Number(discountIQD) || 0,
      totalIQD,
      paidAmountIQD,
      remainingAmountIQD,
      cashBoxId: selectedCashBoxId,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4.5 bg-[#0f3b63] text-white flex items-center justify-between border-b border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <ShoppingCart className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">فاتورة مبيعات جديدة (Sales Invoice)</h3>
              <p className="text-xs text-sky-200">إصدار فاتورة بيع نقدي أو أقساط أو آجل مع ترحيل فوري للصندوق والعميل</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Row 1: Client Selection & Payment Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            {/* نوع الزبون */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">جهة البيع / العميل:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClientType('walk_in');
                    setClientName('زبون نقدي عام');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    clientType === 'walk_in'
                      ? 'bg-[#0f3b63] text-white border-[#0f3b63] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  زبون نقدي عام
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('existing')}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    clientType === 'existing'
                      ? 'bg-[#0f3b63] text-white border-[#0f3b63] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  من دليل العملاء
                </button>
              </div>

              {clientType === 'existing' ? (
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    const acc = clientAccounts.find(a => a.id === e.target.value);
                    if (acc) {
                      setClientName(acc.name);
                      setClientPhone(acc.phone || '');
                    }
                  }}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-sky-600"
                >
                  <option value="">-- اختر العميل من الدليل --</option>
                  {clientAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code || 'حساب'}) - رصيد: {acc.balanceIQD.toLocaleString()} د.ع
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="اسم الزبون..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-sky-600"
                />
              )}
            </div>

            {/* طريقة الدفع */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">طريقة السداد / الدفع:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                    paymentType === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  نقدي (Cash)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('installment')}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                    paymentType === 'installment'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  أقساط (تقسيط)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('credit')}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                    paymentType === 'credit'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  آجل (على الحساب)
                </button>
              </div>

              <div className="pt-1">
                <label className="font-bold text-slate-600 block text-[11px]">الصندوق المستلم للنقد:</label>
                <select
                  value={selectedCashBoxId}
                  onChange={(e) => setSelectedCashBoxId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  {cashBoxes.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (رصيد: {b.balanceIQD.toLocaleString()} د.ع)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* رقم هاتف الزبون والملاحظات */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">رقم هاتف الزبون / الملاحظات:</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="07XXXXXXXXX"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 outline-none focus:border-sky-600"
              />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات إضافية على الفاتورة..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 outline-none focus:border-sky-600"
              />
            </div>
          </div>

          {/* Table of items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 text-sm">قائمة المواد والأصناف المباعة:</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مادة للفاتورة</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#f0f7fc] text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">المادة / الصنف</th>
                    <th className="p-2.5 w-24">الكمية</th>
                    <th className="p-2.5 w-32">السعر الإفرادي (د.ع)</th>
                    <th className="p-2.5 w-36">الإجمالي (د.ع)</th>
                    <th className="p-2.5 w-12 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2.5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdateItem(idx, 'productId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-sky-500"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} - متوفر ({p.quantity} {p.unit}) - {p.sellingPriceIQD.toLocaleString()} د.ع
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-center text-slate-900"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={item.priceIQD}
                          onChange={(e) => handleUpdateItem(idx, 'priceIQD', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                        />
                      </td>
                      <td className="p-2.5 font-mono font-black text-slate-900">
                        {item.totalIQD.toLocaleString()} د.ع
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={invoiceItems.length === 1}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Calculations */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-sky-50/50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-[11px] text-slate-500 block">المجموع قبل الخصم:</span>
                <span className="font-mono font-black text-slate-800 text-sm">{subtotalIQD.toLocaleString()} د.ع</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 block">الخصم الممنوح:</span>
                <input
                  type="number"
                  min="0"
                  value={discountIQD}
                  onChange={(e) => setDiscountIQD(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">الصافي الإجمالي:</span>
                <span className="font-mono font-black text-emerald-700 text-base">{totalIQD.toLocaleString()} د.ع</span>
              </div>
            </div>

            {paymentType !== 'cash' && (
              <div className="flex flex-wrap items-center gap-4 border-r pr-4 border-slate-300">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-emerald-700 font-bold block">المبلغ المقبوض مقدماً (واصل):</span>
                  <input
                    type="number"
                    min="0"
                    max={totalIQD}
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-32 px-2.5 py-1 bg-white border-2 border-emerald-400 rounded-lg font-mono font-black text-emerald-800"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-rose-700 font-bold block">المتبقي (دين / أقساط):</span>
                  <span className="font-mono font-black text-rose-700 text-base">{remainingAmountIQD.toLocaleString()} د.ع</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-800 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0f3b63] hover:bg-[#0a2844] text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>حفظ واعتماد الفاتورة (F2)</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
