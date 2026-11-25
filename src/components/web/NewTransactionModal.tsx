import React, { useState } from 'react';
import { 
  X, 
  Send, 
  ArrowRightLeft, 
  DollarSign, 
  User, 
  Phone, 
  Building2, 
  ShieldCheck, 
  FileCheck,
  Receipt,
  Landmark,
  KeyRound
} from 'lucide-react';
import { TransactionRecord, CurrencyCode, TransactionType, AccountItem, P2PAgent, CommissionType } from '../../types';
import { INITIAL_PROGRAM_CITIES } from '../../data/initialData';
import { SearchableSelect } from '../common/SearchableSelect';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountItem[];
  agents: P2PAgent[];
  onTransactionCreated: (tx: TransactionRecord) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  agents,
  onTransactionCreated,
}) => {
  const [txType, setTxType] = useState<TransactionType>('transfer_outgoing');
  const [amount, setAmount] = useState<number>(1000000);
  const [currency, setCurrency] = useState<CurrencyCode>('IQD');
  
  // Recipient / Parties
  const [senderName, setSenderName] = useState('محمد علي الباوي');
  const [senderPhone, setSenderPhone] = useState('07701234567');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [destinationCity, setDestinationCity] = useState(INITIAL_PROGRAM_CITIES[1] || 'البصرة');
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');
  const [selectedAgent, setSelectedAgent] = useState<string>(agents[0]?.peerId || '');
  
  // Commission
  const [commissionType, setCommissionType] = useState<CommissionType>('collected');
  const [fee, setFee] = useState<number>(5000);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((txType === 'transfer_outgoing' || txType === 'transfer_incoming') && !receiverName.trim()) {
      alert('يرجى إدخال اسم المستلم');
      return;
    }

    // Pure numeric remittance code (e.g. 849201)
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    let titleAr = 'حوالة مالية صادرة';
    if (txType === 'transfer_incoming') titleAr = 'حوالة مالية واردة';
    if (txType === 'exchange') titleAr = 'صرف وتداول عملة';
    if (txType === 'cash_in') titleAr = 'سند قبض نقدي';
    if (txType === 'cash_out') titleAr = 'سند صرف نقدي';
    if (txType === 'bank_deposit') titleAr = 'إيداع بنكي';

    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      code: generatedCode,
      type: txType,
      titleAr,
      senderName: senderName || 'العميل النقدي',
      senderPhone,
      receiverName: receiverName || accounts.find(a => a.id === selectedAccount)?.name || 'الفرع الرئيسي',
      receiverPhone,
      destinationCity,
      originCity: 'بغداد',
      createdBy: 'أمين الصندوق',
      accountId: selectedAccount,
      amount,
      currency,
      targetAmount: currency === 'IQD' ? Math.round(amount / 1520) : Math.round(amount * 1515),
      targetCurrency: currency === 'IQD' ? 'USD' : 'IQD',
      exchangeRate: 1520,
      fee,
      commissionType,
      status: txType.startsWith('transfer') ? 'ready_for_pickup' : 'completed',
      otpCode: generatedOTP,
      agentPeerId: selectedAgent,
      notes,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      completedAt: txType.startsWith('transfer') ? undefined : new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    onTransactionCreated(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-[#0C7A66] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">معاملة مالية جديدة (Smart Ledger)</h3>
              <p className="text-xs text-emerald-100">إصدار وتوثيق الحوالات، السندات النقدية، وصرف العملات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Pill-Style Toggle for Transaction Type */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">نوع المعاملة</label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-center font-bold">
              <button
                type="button"
                onClick={() => setTxType('transfer_outgoing')}
                className={`py-2 px-1 rounded-lg transition-all ${
                  txType === 'transfer_outgoing' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                حوالة صادرة
              </button>
              <button
                type="button"
                onClick={() => setTxType('transfer_incoming')}
                className={`py-2 px-1 rounded-lg transition-all ${
                  txType === 'transfer_incoming' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                حوالة واردة
              </button>
              <button
                type="button"
                onClick={() => setTxType('exchange')}
                className={`py-2 px-1 rounded-lg transition-all ${
                  txType === 'exchange' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                صرف عملة
              </button>
              <button
                type="button"
                onClick={() => setTxType('cash_in')}
                className={`py-2 px-1 rounded-lg transition-all ${
                  txType === 'cash_in' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سند قبض
              </button>
            </div>
          </div>

          {/* Large Centered Amount Input with Flag Selectors */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
            <span className="text-[11px] text-slate-500 font-semibold">مبلغ المعاملة الأساسي</span>
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-48 text-center text-2xl font-mono font-black text-slate-900 bg-white border border-slate-300 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0C7A66]"
              />
              <div className="w-40 shrink-0">
                <SearchableSelect
                  value={currency}
                  onChange={(val) => setCurrency(val as CurrencyCode)}
                  options={[
                    { value: 'IQD', label: 'IQD 🇮🇶 د.ع' },
                    { value: 'USD', label: 'USD 🇺🇸 $' },
                    { value: 'EUR', label: 'EUR 🇪🇺 €' },
                    { value: 'TRY', label: 'TRY 🇹🇷 ₺' },
                    { value: 'AED', label: 'AED 🇦🇪 د.إ' },
                  ]}
                  triggerClassName="py-2.5 bg-white rounded-xl font-bold text-sm"
                  searchPlaceholder="بحث في العملات..."
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              المعادل التقديري بالعملة المقابلة: ~
              {currency === 'IQD' 
                ? `${(amount / 1520).toFixed(2)} $ (سعر 1,520)` 
                : `${(amount * 1515).toLocaleString()} د.ع (سعر 1,515)`
              }
            </div>
          </div>

          {/* Parties Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">الطرف المرسل / الحساب الدافع</label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="اسم المرسل"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">الطرف المستلم / الوجهة *</label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="اسم المستلم الثلاثي"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">رقم هاتف المستلم (لإرسال SMS)</label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white dir-ltr text-right"
                placeholder="0780xxxxxxx"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">مدينة الاستلام (المدن المعتمدة)</label>
              <SearchableSelect
                value={destinationCity}
                onChange={(val) => setDestinationCity(val)}
                options={INITIAL_PROGRAM_CITIES.map(city => ({ value: city, label: city }))}
                triggerClassName="py-2 bg-white rounded-xl"
                searchPlaceholder="بحث في المدن..."
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">وكيل شبكة P2P المعتمد</label>
              <SearchableSelect
                value={selectedAgent}
                onChange={(val) => setSelectedAgent(val)}
                options={agents.map(ag => ({
                  value: ag.peerId,
                  label: `${ag.officeName} (${ag.city})`
                }))}
                triggerClassName="py-2 bg-white rounded-xl"
                searchPlaceholder="بحث في الوكلاء..."
              />
            </div>
          </div>

          {/* Commission Selector */}
          <div className="grid grid-cols-2 gap-3 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
            <div>
              <label className="block text-emerald-950 font-semibold mb-1">نوع العمولة</label>
              <SearchableSelect
                value={commissionType}
                onChange={(val) => setCommissionType(val as CommissionType)}
                options={[
                  { value: 'collected', label: 'محصلة من الزبون (+)' },
                  { value: 'on_us', label: 'علينا (تتحملها الشركة)' },
                  { value: 'none', label: 'بدون عمولة (0)' },
                ]}
                triggerClassName="py-1.5 bg-white border-emerald-300"
                searchPlaceholder="بحث في نوع العمولة..."
              />
            </div>

            <div>
              <label className="block text-emerald-950 font-semibold mb-1">مبلغ العمولة ({currency})</label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-emerald-300 rounded-lg bg-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">ملاحظات وبيان المعاملة</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تسليم نقدي، قيد حساب، أو أي شروط تسليم..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0C7A66] to-teal-600 hover:from-[#095749] hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-950/20 cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>إنشاء وتوثيق المعاملة</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
