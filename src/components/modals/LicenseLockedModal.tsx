import React, { useState } from 'react';
import { Lock, AlertTriangle, KeyRound, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { ClientEditionInfo } from '../../types';

interface LicenseLockedModalProps {
  isOpen: boolean;
  editionInfo: ClientEditionInfo | null;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateToSettingsLicense?: () => void;
}

export const LicenseLockedModal: React.FC<LicenseLockedModalProps> = ({
  isOpen,
  editionInfo,
  onClose,
  onSuccess,
  onNavigateToSettingsLicense,
}) => {
  const [activationKey, setActivationKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const companyName = editionInfo?.companyName || 'شركتكم الموقرة';

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = activationKey.trim().toUpperCase();
    if (!cleanKey) {
      setErrorMsg('يرجى إدخال رمز التفعيل المعتمد');
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
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'رمز التفعيل غير صالح. يرجى مراجعة إدارة النظام.');
      }
    } catch (err) {
      setErrorMsg('خطأ في الاتصال بالخادم المحلي');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-rose-200/90 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ترويسة التنبيه باللون الأحمر/الوردي */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-red-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="إغلاق والتصفح فقط"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
              <Lock className="w-6 h-6 text-rose-200" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-black mb-1 border border-rose-400/30">
                قفل القيود المحاسبية
              </span>
              <h3 className="text-lg font-black text-white">
                انتهت فترة الاستخدام التجريبي (30 يوماً)
              </h3>
            </div>
          </div>
        </div>

        {/* رسائل التنبيه أو النجاح */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* المحتوى */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-amber-950 space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ملاحظة مهمة:</span>
            </div>
            <p>
              لقد انتهت مهلة الـ 30 يوماً التجريبية لشركة <strong className="text-slate-900">{companyName}</strong>. 
              يمكنك الاستمرار في فتح البرنامج واستعراض وتصفح كافة الحسابات والتقارير والسندات السابقة بحرية تامة، 
              <strong>ولكن تم قفل إمكانية إنشاء قيود أو سندات جديدة</strong> لحين تفعيل النسخة برمز الترخيص الرسمي.
            </p>
          </div>

          {/* إدخال كود التفعيل */}
          <form onSubmit={handleActivate} className="space-y-3 pt-2">
            <label className="block font-bold text-slate-700">
              أدخل رمز التفعيل المعتمد (Activation Code):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="SL...-.....-.....-.....-....."
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                dir="ltr"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={isSubmitting || !activationKey.trim()}
                className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>تفعيل</span>
              </button>
            </div>
          </form>

          {/* خيارات إضافية */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-100"
            >
              متابعة التصفح فقط
            </button>

            {onNavigateToSettingsLicense && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToSettingsLicense();
                }}
                className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-sky-50"
              >
                <span>الانتقال لإعدادات الترخيص</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
