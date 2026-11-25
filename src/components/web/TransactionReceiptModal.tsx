import React, { useEffect } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  QrCode, 
  ShieldCheck, 
  CircleDollarSign, 
  Building2,
  Calendar,
  KeyRound
} from 'lucide-react';
import { TransactionRecord } from '../../types';

interface TransactionReceiptModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*إشعار معاملة مالية - Smart Ledger*
رقم الحوالة: ${transaction.code}
المرسل: ${transaction.senderName}
المستلم: ${transaction.receiverName}
المبلغ: ${transaction.amount.toLocaleString()} ${transaction.currency}
${transaction.otpCode ? `رمز التحقق السري (OTP): ${transaction.otpCode}` : ''}
الحالة: ${transaction.status === 'completed' ? 'تم التسليم' : 'جاهزة للاستلام'}
التاريخ: ${transaction.createdAt}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md sm:max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto animate-in zoom-in-95 duration-150 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Bar (Hidden on print) - Shrink-0 keeps it permanently pinned and visible */}
        <div className="shrink-0 bg-slate-100 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between text-xs print:hidden z-10">
          <span className="font-bold text-slate-700 truncate">إيصال معاملة مالية معتمدة (Voucher)</span>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors cursor-pointer text-[11px] sm:text-xs"
              title="مشاركة عبر واتساب"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مشاركة واتساب</span>
              <span className="sm:hidden">واتساب</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors cursor-pointer text-[11px] sm:text-xs"
              title="طباعة السند"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
              title="إغلاق (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body - flex-1 overflow-y-auto ensures it scrolls within the card on small screens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 print:p-0 print:overflow-visible">
          
          {/* Company Seal & Title */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <div className="inline-flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0C7A66] text-white flex items-center justify-center font-black text-xs sm:text-sm">
                SL
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Smart Ledger • المحاسب الذكي</h2>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              نظام الحوالات والتحويلات المالية الآمنة وشبكة الوكلاء P2P
            </p>
            <div className="pt-1.5">
              <span className="inline-block px-3 py-0.5 bg-slate-100 text-slate-800 rounded-full font-mono font-bold text-xs sm:text-sm border border-slate-200">
                MTCN: {transaction.code}
              </span>
            </div>
          </div>

          {/* OTP Code Box (if active) */}
          {transaction.otpCode && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 sm:p-3 text-center space-y-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-900 flex items-center justify-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                رمز الاستلام السري الخاص بالمستلم (OTP)
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-amber-950 tracking-widest">
                {transaction.otpCode}
              </div>
              <span className="text-[9px] sm:text-[10px] text-amber-700 block">
                صالح لمدة 30 دقيقة • لا تشارك هذا الرمز إلا مع المستلم الشرعي
              </span>
            </div>
          )}

          {/* Two-Column Metadata (Sender & Receiver OR Debit & Credit) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <span className={`block text-[10px] font-bold ${transaction.type === 'journal' ? 'text-emerald-700' : 'text-slate-400'}`}>
                {transaction.type === 'journal' ? 'الطرف الدائن (إليه / له 🟢):' : 'بيانات المرسل:'}
              </span>
              <div className={`font-black ${transaction.type === 'journal' ? 'text-emerald-900' : 'text-slate-900'}`}>
                {transaction.senderName}
              </div>
              <div className="font-mono text-[11px] text-slate-500">{transaction.senderPhone || '-'}</div>
            </div>

            <div className="space-y-1">
              <span className={`block text-[10px] font-bold ${transaction.type === 'journal' ? 'text-rose-700' : 'text-slate-400'}`}>
                {transaction.type === 'journal' ? 'الطرف المدين (منه / عليه 🔴):' : 'بيانات المستلم:'}
              </span>
              <div className={`font-black ${transaction.type === 'journal' ? 'text-rose-900' : 'text-slate-900'}`}>
                {transaction.receiverName}
              </div>
              <div className="font-mono text-[11px] text-slate-500">{transaction.receiverPhone || '-'}</div>
              {transaction.destinationCity && (
                <div className="text-[10px] font-medium text-slate-600">مدينة الاستلام: {transaction.destinationCity}</div>
              )}
              {transaction.agentName && (
                <div className="text-[10px] font-medium text-sky-700 mt-1 pt-1 border-t border-slate-200">
                  <div className="font-bold">الوكيل المسلم (البنك): {transaction.agentName}</div>
                  {(transaction.agentAddress || transaction.agentPhone) && (
                    <div className="text-[9px] text-slate-500">
                      {[transaction.agentAddress, transaction.agentPhone].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1.5 sm:space-y-2 text-xs">
            <div className="flex justify-between py-1 sm:py-1.5 border-b border-slate-100">
              <span className="text-slate-500">نوع الحركة:</span>
              <span className="font-bold text-slate-800">{transaction.titleAr}</span>
            </div>

            {transaction.transferSettlementType && (
              <div className="flex justify-between py-1 sm:py-1.5 border-b border-slate-100 items-center">
                <span className="text-slate-500">طريقة التسوية والقيد:</span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] ${
                  transaction.transferSettlementType === 'cash' 
                    ? 'bg-emerald-100 text-emerald-900' 
                    : 'bg-indigo-100 text-indigo-900'
                }`}>
                  {transaction.type === 'journal'
                    ? 'قيد يومية مزدوج متزن ومرحل للحسابات'
                    : transaction.transferSettlementType === 'cash' 
                      ? `نقدية • مسجلة على ${transaction.cashBoxName || 'الصندوق الرئيسي'}`
                      : `آجلة • مقيدة على حساب العميل (${transaction.accountName || transaction.senderName})`
                  }
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 sm:py-1.5 border-b border-slate-100">
              <span className="text-slate-500">
                {transaction.type === 'journal' ? 'مبلغ القيد المزدوج:' : 'مبلغ الحوالة (المسلّم):'}
              </span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                {transaction.amount.toLocaleString()} {transaction.currency}
              </span>
            </div>

            {transaction.exchangeRate && transaction.currency === 'USD' && transaction.settlementCurrency === 'IQD' && (
              <div className="flex justify-between py-1 sm:py-1.5 border-b border-slate-100 text-sky-800">
                <span className="font-medium">السعر الفعلي المعتمد:</span>
                <span className="font-mono font-bold text-xs">
                  {transaction.exchangeRate.toLocaleString()} د.ع / $
                </span>
              </div>
            )}

            {transaction.targetAmount && transaction.targetCurrency !== transaction.currency && (
              <div className="flex justify-between py-1 sm:py-1.5 border-b border-slate-100 text-emerald-800">
                <span>المعادل المستلم:</span>
                <span className="font-mono font-bold text-xs sm:text-sm">
                  {transaction.targetAmount.toLocaleString()} {transaction.targetCurrency}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 sm:py-1.5 border-b border-slate-100">
              <span className="text-slate-500">رسوم العمولة:</span>
              <span className="font-mono text-slate-700">
                {transaction.fee.toLocaleString()} {transaction.currency}
                {transaction.commissionType === 'on_us' && ' (علينا - مخصومة)'}
                {transaction.commissionType === 'collected' && ' (محصلة من الزبون)'}
                {transaction.commissionType === 'none' && ' (بدون عمولة)'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 sm:py-2 border-b-2 border-slate-300 font-bold text-xs sm:text-sm bg-emerald-50/50 px-2 rounded-lg">
              <span className="text-emerald-950">
                {transaction.settlementCurrency === 'IQD' && transaction.currency === 'USD'
                  ? 'المطلوب قبضه / قيده بالدينار (الصادر الحسابي):'
                  : 'الإجمالي الصافي المستلم من الزبون:'}
              </span>
              <span className="font-mono text-emerald-900">
                {transaction.settlementAmount
                  ? `${transaction.settlementAmount.toLocaleString()} ${transaction.settlementCurrency === 'IQD' ? 'د.ع' : transaction.currency}`
                  : `${(transaction.amount + (transaction.commissionType === 'collected' ? transaction.fee : (transaction.commissionType === 'on_us' ? -transaction.fee : 0))).toLocaleString()} ${transaction.currency}`
                }
              </span>
            </div>

            {transaction.status === 'completed' && (
              <div className="flex justify-between py-1 sm:py-1.5 border-b border-slate-100 text-sky-900 bg-sky-50/60 px-2 rounded-lg text-[11px] sm:text-xs">
                <span className="font-bold">حالة التسليم والصرف:</span>
                <span className="font-bold">
                  {transaction.payoutMethod === 'agent_account'
                    ? `مسلمة • مقيدة على (${transaction.payoutAccountName || 'حساب الوكيل'})`
                    : 'مسلمة • نقداً من الصندوق'}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-400 text-[10px] sm:text-[11px]">
              <span>تاريخ التوثيق:</span>
              <span className="font-mono">{transaction.createdAt}</span>
            </div>
          </div>

          {/* Footer Barcode & Terms */}
          <div className="pt-2.5 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] text-slate-400">
            <div className="space-y-0.5">
              <div>إيصال إلكتروني صادر عبر نظام Smart Ledger</div>
              <div>يجب إبراز الهوية الشخصية الأصلية عند الاستلام</div>
            </div>
            <div className="flex flex-col items-center gap-1 font-mono font-bold text-slate-600">
              <QrCode className="w-7 h-7 sm:w-8 sm:h-8 text-slate-800" />
              <span>VERIFIED-SL</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar for quick close and action - Shrink-0 */}
        <div className="shrink-0 bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs print:hidden">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            {transaction.code} • {transaction.createdAt}
          </span>
          <div className="flex items-center gap-2 mr-auto sm:mr-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors cursor-pointer text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
