import React, { useState } from 'react';
import { 
  Network, 
  Search, 
  Send, 
  KeyRound, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Phone, 
  MapPin, 
  Clock, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { P2PAgent, TransactionRecord } from '../../../types';

interface WebAgentNetworkScreenProps {
  agents: P2PAgent[];
  transactions: TransactionRecord[];
  onOpenNewTransaction: () => void;
  onRedeemOTP: (otp: string, pin: string) => boolean;
}

export const WebAgentNetworkScreen: React.FC<WebAgentNetworkScreenProps> = ({
  agents,
  transactions,
  onOpenNewTransaction,
  onRedeemOTP,
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'otp_payout' | 'history'>('agents');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [recipientPin, setRecipientPin] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [otpErrorMsg, setOtpErrorMsg] = useState<string | null>(null);

  const networkTransfers = transactions.filter(t => t.agentPeerId || t.otpCode);

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSuccessMsg(null);
    setOtpErrorMsg(null);

    const cleanOtp = enteredOTP.trim();
    const matched = transactions.find(t => t.otpCode === cleanOtp && t.status === 'ready_for_pickup');

    if (matched) {
      onRedeemOTP(cleanOtp, recipientPin);
      setOtpSuccessMsg(`تم التحقق بنجاح! تم صرف حوالة الـ P2P برقم ${matched.code} بمبلغ ${matched.amount.toLocaleString()} ${matched.currency} للمستلم (${matched.receiverName}).`);
      setEnteredOTP('');
      setRecipientPin('');
    } else {
      setOtpErrorMsg('رمز الـ OTP غير مطابق أو تم صرف الحوالة مسبقاً! يرجى التأكد من الرمز المكون من 4 أرقام.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-[#0C7A66] via-slate-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Network className="w-3.5 h-3.5" />
            شبكة الحوالات المشتركة بين المكاتب (P2P Network)
          </div>
          <h2 className="text-xl font-bold tracking-tight">نظام الربط المالي المباشر عبر الـ Peer ID والـ OTP</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            إرسال وتسليم الحوالات عبر المكاتب الشريكة في العراق وتركيا والإمارات دون الحاجة لوساطة مصرفية، مع رمز أمان OTP صالح لمدة 30 دقيقة.
          </p>
        </div>

        <button
          onClick={onOpenNewTransaction}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>إرسال حوالة شبكة P2P</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('agents')}
          className={`pb-2 px-3 border-b-2 transition-all ${
            activeTab === 'agents'
              ? 'border-[#0C7A66] text-[#0C7A66]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          شبكة المكاتب والوكلاء المعتمدين ({agents.length})
        </button>
        <button
          onClick={() => setActiveTab('otp_payout')}
          className={`pb-2 px-3 border-b-2 transition-all ${
            activeTab === 'otp_payout'
              ? 'border-[#0C7A66] text-[#0C7A66]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          تسليم حوالة واردة برمز الأمان (OTP)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-3 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-[#0C7A66] text-[#0C7A66]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          سجل حركات الشبكة ({networkTransfers.length})
        </button>
      </div>

      {/* TAB 1: AGENTS DIRECTORY */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{agent.officeName}</h3>
                  <span className="text-xs text-slate-500 block font-medium mt-0.5">
                    المدير: {agent.name}
                  </span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {agent.peerId}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{agent.city}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono dir-ltr">{agent.phone}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-400">شريحة العمولة:</span>
                  <span className="font-bold text-emerald-800">{agent.commissionTier}</span>
                </div>
              </div>

              <button
                onClick={onOpenNewTransaction}
                className="w-full py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition-all text-center"
              >
                إرسال حوالة لهذا الوكيل
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: OTP PAYOUT VALIDATOR */}
      {activeTab === 'otp_payout' && (
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
          <div className="text-center space-y-1 pb-3 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0C7A66] flex items-center justify-center mx-auto mb-2 border border-emerald-100">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">تسليم حوالة شبكة عبر رمز الـ OTP</h3>
            <p className="text-xs text-slate-500">
              أدخل الرمز السري المكون من 4 أرقام المزود من العميل المستلم لتسليم المبلغ من الصندوق
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">رمز التحقق الأمني (OTP) *</label>
              <input
                type="text"
                maxLength={4}
                required
                placeholder="مثال: 8492"
                value={enteredOTP}
                onChange={(e) => setEnteredOTP(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-center font-mono text-2xl font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0C7A66]"
              />
              <span className="text-[11px] text-slate-400 block text-center mt-1">
                تلميح للتجربة: استخدم 8492 أو 6190 من الحوالات الجاهزة
              </span>
            </div>

            {otpSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم التسليم بنجاح!</span>
                </div>
                <p className="text-[11px]">{otpSuccessMsg}</p>
              </div>
            )}

            {otpErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{otpErrorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0C7A66] hover:bg-[#095749] text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              مطابقة الرمز وتأكيد التسليم
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم الحوالة</th>
                  <th className="py-3 px-4">المرسل</th>
                  <th className="py-3 px-4">المستلم</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">وكيل الشبكة (Peer ID)</th>
                  <th className="py-3 px-4">رمز الـ OTP</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {networkTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.code}</td>
                    <td className="py-3 px-4">{t.senderName}</td>
                    <td className="py-3 px-4">{t.receiverName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {t.amount.toLocaleString()} {t.currency}
                    </td>
                    <td className="py-3 px-4 font-mono">{t.agentPeerId || 'مكتب محلي'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {t.otpCode || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {t.status === 'completed' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">تم التسليم</span>
                      ) : (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold">بانتظار التسليم</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
