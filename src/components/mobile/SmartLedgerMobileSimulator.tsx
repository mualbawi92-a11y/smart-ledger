import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  ArrowLeftRight, 
  CircleDollarSign, 
  Network, 
  Send, 
  Plus, 
  Search, 
  Phone, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  KeyRound,
  CheckCircle2,
  Bell,
  Wifi,
  Battery,
  Calculator
} from 'lucide-react';
import { AccountItem, TransactionRecord, CurrencyRate, P2PAgent } from '../../types';

interface SmartLedgerMobileSimulatorProps {
  accounts: AccountItem[];
  transactions: TransactionRecord[];
  currencies: CurrencyRate[];
  agents: P2PAgent[];
  onOpenNewTransaction: () => void;
  onViewReceipt: (tx: TransactionRecord) => void;
}

export const SmartLedgerMobileSimulator: React.FC<SmartLedgerMobileSimulatorProps> = ({
  accounts,
  transactions,
  currencies,
  agents,
  onOpenNewTransaction,
  onViewReceipt,
}) => {
  const [mobileTab, setMobileTab] = useState<'home' | 'accounts' | 'transfers' | 'exchange' | 'network'>('home');
  const [mobileSearch, setMobileSearch] = useState('');

  // Calculations
  const totalIQD = accounts.reduce((sum, a) => sum + a.balanceIQD, 0);
  const totalUSD = accounts.reduce((sum, a) => sum + a.balanceUSD, 0);

  return (
    <div className="py-6 flex flex-col items-center justify-center">
      
      {/* Device Header Info */}
      <div className="mb-4 text-center">
        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-1">
          محاكي تطبيق الموبايل (Smart Ledger Mobile • Expo SDK)
        </span>
        <p className="text-xs text-slate-500">
          واجهة وتجربة تطبيق الهواتف الذكية مع شريط الملاحة الزجاجي (Liquid Glass)
        </p>
      </div>

      {/* Phone Mockup Frame */}
      <div className="w-[380px] h-[740px] bg-slate-900 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-700 relative overflow-hidden flex flex-col">
        
        {/* Screen Bezel & Dynamic Island Notch */}
        <div className="w-full h-full bg-[#F2F7F5] rounded-[38px] overflow-hidden flex flex-col relative text-slate-900">
          
          {/* Mobile Status Bar */}
          <div className="h-10 bg-slate-900 text-white px-6 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
            <span className="font-bold">9:41</span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto" />
            <div className="flex items-center gap-1.5 text-xs">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* App Top Bar */}
          <div className="bg-[#0C7A66] text-white px-5 py-3 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                SL
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">المحاسب الذكي</h4>
                <span className="text-[10px] text-emerald-200 block">محمد علي الباوي</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onOpenNewTransaction}
                className="w-7 h-7 rounded-full bg-emerald-400 text-slate-900 flex items-center justify-center shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Scrollable Screen Content */}
          <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 text-xs">
            
            {/* 1. HOME TAB */}
            {mobileTab === 'home' && (
              <>
                {/* Hero Balance Card (Liquid Glass with Gradients) */}
                <div className="bg-gradient-to-tr from-[#0C7A66] to-[#1E3A8A] text-white p-4 rounded-3xl shadow-lg relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-emerald-200">
                    <span className="flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> الرصيد المالي المتاح
                    </span>
                    <span className="font-mono bg-white/20 px-2 py-0.5 rounded-full">محفظة رئيسية</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-2xl font-black font-mono tracking-tight block">
                      {totalIQD.toLocaleString()} <span className="text-xs font-normal text-emerald-300">د.ع</span>
                    </span>
                    <span className="text-base font-bold font-mono text-blue-200 block">
                      ${totalUSD.toLocaleString()} <span className="text-xs font-normal">USD</span>
                    </span>
                  </div>

                  {/* Quick Action Grid */}
                  <div className="pt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <button
                      onClick={onOpenNewTransaction}
                      className="py-2 px-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold flex flex-col items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-300" />
                      <span>إرسال حوالة</span>
                    </button>
                    <button
                      onClick={() => setMobileTab('exchange')}
                      className="py-2 px-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold flex flex-col items-center gap-1"
                    >
                      <CircleDollarSign className="w-3.5 h-3.5 text-teal-300" />
                      <span>صرف عملات</span>
                    </button>
                    <button
                      onClick={() => setMobileTab('network')}
                      className="py-2 px-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold flex flex-col items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                      <span>تسليم كاش OTP</span>
                    </button>
                  </div>
                </div>

                {/* Live Currency Ticker */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700">بورصة بغداد:</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    100$ = {currencies.find(c => c.code === 'USD')?.sellRate ? (currencies.find(c => c.code === 'USD')!.sellRate * 100).toLocaleString() : '152,500'} د.ع
                  </span>
                </div>

                {/* Recent Transactions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-xs px-1">
                    <span>أحدث العمليات والحوالات</span>
                    <button onClick={() => setMobileTab('transfers')} className="text-emerald-700 text-[11px]">
                      عرض الكل
                    </button>
                  </div>

                  <div className="space-y-2">
                    {transactions.slice(0, 4).map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => onViewReceipt(tx)}
                        className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs">{tx.receiverName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{tx.code} • {tx.titleAr}</div>
                        </div>

                        <div className="text-left font-mono">
                          <span className="font-bold text-slate-900 block text-xs">
                            {tx.amount.toLocaleString()} {tx.currency}
                          </span>
                          <span className={`text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full ${
                            tx.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.status === 'completed' ? 'تم التسليم' : 'جاهزة'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 2. ACCOUNTS TAB */}
            {mobileTab === 'accounts' && (
              <div className="space-y-3">
                <div className="font-bold text-sm text-slate-900">دليل الحسابات والأرصدة</div>
                
                {/* Search */}
                <input
                  type="text"
                  placeholder="ابحث في الحسابات..."
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />

                <div className="space-y-2">
                  {accounts
                    .filter(a => a.name.includes(mobileSearch) || a.city.includes(mobileSearch))
                    .map((acc) => (
                      <div key={acc.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{acc.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            {acc.city}
                          </span>
                        </div>

                        <div className="flex items-center justify-between font-mono text-xs pt-1 border-t border-slate-100">
                          <div className="text-slate-600">
                            IQD: <span className="font-bold text-emerald-800">{acc.balanceIQD.toLocaleString()}</span>
                          </div>
                          <div className="text-slate-600">
                            USD: <span className="font-bold text-blue-800">${acc.balanceUSD.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 3. TRANSFERS TAB */}
            {mobileTab === 'transfers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">سجل الحوالات</span>
                  <button
                    onClick={onOpenNewTransaction}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    حوالة جديدة +
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.filter(t => t.type.startsWith('transfer')).map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => onViewReceipt(tx)}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-mono font-bold text-xs">
                        <span className="text-slate-900">{tx.code}</span>
                        <span className="text-emerald-700">{tx.amount.toLocaleString()} {tx.currency}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        من: <span className="font-medium">{tx.senderName}</span> ← إلى: <span className="font-bold">{tx.receiverName}</span>
                      </div>
                      {tx.otpCode && (
                        <div className="text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-mono font-bold w-fit">
                          رمز OTP: {tx.otpCode}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. EXCHANGE TAB */}
            {mobileTab === 'exchange' && (
              <div className="space-y-3">
                <div className="font-bold text-sm text-slate-900">حاسبة وصرف العملات</div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="text-xs text-slate-600">
                    أسعار البيع والشراء اللحظية:
                  </div>
                  {currencies.map(c => (
                    <div key={c.code} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <span>{c.flag}</span>
                        <span className="font-bold">{c.code}</span>
                        <span className="text-[10px] text-slate-400">({c.nameAr})</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800">
                        {c.code === 'IQD' ? '1.0' : `${c.sellRate} د.ع`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. NETWORK P2P TAB */}
            {mobileTab === 'network' && (
              <div className="space-y-3">
                <div className="font-bold text-sm text-slate-900">شبكة الوكلاء P2P</div>
                
                <div className="space-y-2">
                  {agents.map(ag => (
                    <div key={ag.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{ag.officeName}</span>
                        <span className="font-mono text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                          {ag.peerId}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">{ag.city} • هاتف: {ag.phone}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">عمولة: {ag.commissionTier}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Floating Liquid Glass Bottom Tab Bar (as per specifications) */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl px-2 py-2 flex items-center justify-around shadow-2xl text-white z-30">
            <button
              onClick={() => setMobileTab('home')}
              className={`flex flex-col items-center gap-0.5 p-1 transition-all ${mobileTab === 'home' ? 'text-emerald-400 scale-105' : 'text-slate-400'}`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-bold">الرئيسية</span>
            </button>

            <button
              onClick={() => setMobileTab('accounts')}
              className={`flex flex-col items-center gap-0.5 p-1 transition-all ${mobileTab === 'accounts' ? 'text-emerald-400 scale-105' : 'text-slate-400'}`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[9px] font-bold">الحسابات</span>
            </button>

            <button
              onClick={() => setMobileTab('transfers')}
              className={`flex flex-col items-center gap-0.5 p-1 transition-all ${mobileTab === 'transfers' ? 'text-emerald-400 scale-105' : 'text-slate-400'}`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="text-[9px] font-bold">الحوالات</span>
            </button>

            <button
              onClick={() => setMobileTab('exchange')}
              className={`flex flex-col items-center gap-0.5 p-1 transition-all ${mobileTab === 'exchange' ? 'text-emerald-400 scale-105' : 'text-slate-400'}`}
            >
              <CircleDollarSign className="w-4 h-4" />
              <span className="text-[9px] font-bold">الصرافة</span>
            </button>

            <button
              onClick={() => setMobileTab('network')}
              className={`flex flex-col items-center gap-0.5 p-1 transition-all ${mobileTab === 'network' ? 'text-emerald-400 scale-105' : 'text-slate-400'}`}
            >
              <Network className="w-4 h-4" />
              <span className="text-[9px] font-bold">الوكلاء</span>
            </button>
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="h-4 bg-[#F2F7F5] flex items-center justify-center shrink-0">
            <div className="w-32 h-1 bg-slate-400 rounded-full" />
          </div>

        </div>

      </div>

    </div>
  );
};
