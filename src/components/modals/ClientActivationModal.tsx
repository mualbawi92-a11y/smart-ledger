import React, { useState } from 'react';
import { ShieldCheck, Clock, KeyRound, Building2, CheckCircle2, AlertCircle, Sparkles, Lock, ArrowLeft } from 'lucide-react';
import { ClientEditionInfo } from '../../types';

interface ClientActivationModalProps {
  isOpen: boolean;
  editionInfo: ClientEditionInfo | null;
  onSuccess: () => void;
  onClose?: () => void;
}

export const ClientActivationModal: React.FC<ClientActivationModalProps> = ({
  isOpen,
  editionInfo,
  onSuccess,
  onClose,
}) => {
  const [activationKey, setActivationKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeChoice, setActiveChoice] = useState<'trial' | 'key' | null>(null);

  if (!isOpen) return null;

  const companyName = editionInfo?.companyName || 'شركة العميل المعتمدة';

  // بدء الفترة التجريبية 30 يوماً
  const handleStartTrial = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/system/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('تم تفعيل الفترة التجريبية (30 يوماً) بنجاح بكامل المزايا!');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'تعذر بدء الفترة التجريبية');
      }
    } catch (err) {
      setErrorMsg('خطأ في الاتصال بالسيرفر المحلي');
    } finally {
      setIsSubmitting(false);
    }
  };

  // التفعيل المباشر بواسطة رمز التفعيل
  const handleActivateKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = activationKey.trim().toUpperCase();
    if (!cleanKey) {
      setErrorMsg('يرجى إدخال رمز التفعيل المعتمد لشركتكم');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/system/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: cleanKey }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'تم تفعيل النسخة رسمياً مدى الحياة بنجاح!');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'رمز التفعيل غير صالح. يرجى التحقق من الرمز.');
      }
    } catch (err) {
      setErrorMsg('خطأ في الاتصال بالسيرفر المحلي');
    } finally {
      setIsSubmitting(false);
    }
  };

  // فتح القفل والعودة إلى وضع المطور الرئيسي بكامل الصلاحيات
  const handleUnlockMaster = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/system/reset-to-master', { method: 'POST' });
    } catch (_) {}
    localStorage.setItem('smart_ledger_edition_mode', 'master');
    sessionStorage.removeItem('smart_ledger_dev_preview');
    onSuccess();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ترويسة المودال الفاخرة */}
        <div className="bg-gradient-to-r from-[#034436] via-[#0b5a49] to-[#042820] text-white p-6 sm:p-7 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-emerald-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معالج بدء التشغيل والترخيص الرسمي</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  نظام المحاسب الذكي - نسخة العميل
                </h2>
                <div className="flex items-center gap-2 mt-1 text-slate-200 text-xs font-medium">
                  <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>الشركة المرخص لها:</span>
                  <span className="font-bold text-white bg-black/25 px-2.5 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-300" />
                    {companyName}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUnlockMaster}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="إغلاق ودخول كمسؤول النظام"
            >
              ✕
            </button>
          </div>
        </div>

        {/* رسائل التنبيه أو النجاح */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* محتوى الخيارين الأساسيين */}
        <div className="p-6 sm:p-7 space-y-5">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            مرحباً بك! لبدء العمل على النظام الخاص بشركتكم، يرجى اختيار أحد الخيارين التاليين: بدء الاستخدام التجريبي المجاني لمدة شهر (30 يوماً) بكامل المزايا، أو التفعيل الفوري برمز الترخيص المعتمد.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* بطاقة الخيار الأول: النسخة التجريبية 30 يوماً */}
            <div 
              onClick={() => setActiveChoice('trial')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                activeChoice === 'trial'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                    30 يوماً مجاناً
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1.5">
                  بدء النسخة التجريبية (30 يوم)
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  تجربة النظام وإجراء كافة القيود والعمليات المحاسبية وسندات القبض والصرف بكامل الصلاحيات لمدة شهر كامل.
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTrial();
                }}
                className="mt-4 w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>بدء الـ 30 يوماً التجريبية الآن</span>
              </button>
            </div>

            {/* بطاقة الخيار الثاني: التفعيل المباشر */}
            <div 
              onClick={() => setActiveChoice('key')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                activeChoice === 'key'
                  ? 'border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-black bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full border border-sky-200">
                    تفعيل رسمي دائم
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1.5">
                  التفعيل المباشر برمز الترخيص
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  إذا كان لديك رمز التفعيل المعتمد، أدخله هنا لتفعيل النسخة فوراً وبشكل دائم مدى الحياة دون أي قيود.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  placeholder="SL...-.....-.....-.....-....."
                  value={activationKey}
                  onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                  dir="ltr"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-center font-bold text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
                <button
                  type="button"
                  disabled={isSubmitting || !activationKey.trim()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivateKey();
                  }}
                  className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>تفعيل النسخة رسمياً</span>
                </button>
              </div>
            </div>

          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                ملاحظة: في حال استخدام النسخة التجريبية، يمكنك في أي وقت خلال الـ 30 يوماً أو بعدها تفعيل النسخة من تبويب الإعدادات بإدخال رمز التفعيل.
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnlockMaster}
              className="whitespace-nowrap px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="العودة لوضع المطور وإلغاء وضع العميل"
            >
              🔓 دخول كمسؤول النظام
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
