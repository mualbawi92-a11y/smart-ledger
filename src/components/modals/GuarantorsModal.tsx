import React, { useState } from 'react';
import { X, ShieldCheck, UserPlus, Phone, Building2, Trash2, Check, Search } from 'lucide-react';
import { GuarantorItem } from '../../types/sales';

interface GuarantorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guarantors: GuarantorItem[];
  onAddGuarantor: (guarantor: Omit<GuarantorItem, 'id'>) => void;
  onDeleteGuarantor: (id: string) => void;
}

export const GuarantorsModal: React.FC<GuarantorsModalProps> = ({
  isOpen,
  onClose,
  guarantors,
  onAddGuarantor,
  onDeleteGuarantor,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddGuarantor({
      name: name.trim(),
      phone: phone.trim(),
      clientName: clientName.trim(),
      workplace: workplace.trim(),
      nationalId: nationalId.trim(),
      notes: notes.trim()
    });

    setName('');
    setPhone('');
    setClientName('');
    setWorkplace('');
    setNationalId('');
    setNotes('');
    setShowAddForm(false);
  };

  const filteredGuarantors = guarantors.filter(g => 
    !searchQuery.trim() || 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.phone.includes(searchQuery.trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4.5 bg-[#0f3b63] text-white flex items-center justify-between border-b border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">سجل الكفلاء والضامنين (Guarantors & Sponsors)</h3>
              <p className="text-xs text-sky-200">بيانات الكفلاء، جهات التعيين، أرقام الهواتف، والعملاء المكفولين</p>
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

        <div className="p-5 space-y-4 text-xs">
          {/* Top action & search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الكفيل أو العميل..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'إخفاء النموذج' : 'إضافة كفيل جديد'}</span>
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in">
              <h4 className="font-bold text-purple-900 text-xs">بيانات الكفيل الجديد:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الكفيل <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم الرباعي واللقب..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXXX"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم العميل المكفول <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="اسم المشتري بالتقسيط..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">جهة العمل / الدائرة:</label>
                  <input
                    type="text"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder="مثال: وزارة الصحة، شركة أهلية..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم الوطني / هوية الأحوال:</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="الرقم الوطني الموحد..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الكفيل</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Guarantors */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#f0f7fc] text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">اسم الكفيل</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3">العميل المكفول</th>
                  <th className="p-3">جهة العمل</th>
                  <th className="p-3">الرقم الوطني</th>
                  <th className="p-3 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuarantors.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{g.name}</td>
                    <td className="p-3 font-mono text-slate-700">{g.phone}</td>
                    <td className="p-3 font-bold text-purple-900">{g.clientName}</td>
                    <td className="p-3 text-slate-600">{g.workplace || '-'}</td>
                    <td className="p-3 font-mono text-slate-500">{g.nationalId || '-'}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteGuarantor(g.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
