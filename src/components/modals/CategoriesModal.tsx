import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, Check, FolderPlus, Eye } from 'lucide-react';
import { ProductCategory } from '../../types/sales';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'view';
  categories: ProductCategory[];
  onAddCategory: (category: { name: string; description?: string }) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  mode,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'view'>(mode);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCategory({
      name: name.trim(),
      description: description.trim()
    });

    setName('');
    setDescription('');
    setActiveTab('view');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4.5 bg-[#0f3b63] text-white flex items-center justify-between border-b border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">إدارة الأقسام والتصنيفات (Categories)</h3>
              <p className="text-[11px] text-sky-200">إضافة أقسام المخزن وعرض تصنيفات المواد</p>
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'view'
                ? 'border-sky-600 text-sky-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>عرض الأقسام الحالية ({categories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'border-sky-600 text-sky-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'add' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم القسم / المجموعة <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أجهزة منزلية، مواد غذائية، عطور..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف القسم (اختياري):</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ملاحظات حول هذا القسم..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 outline-none focus:border-sky-600 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f3b63] hover:bg-[#0a2844] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>حفظ القسم</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                {categories.map((c, idx) => (
                  <div key={c.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                        {c.description && <p className="text-[11px] text-slate-500">{c.description}</p>}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
