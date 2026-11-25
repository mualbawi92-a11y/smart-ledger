import React, { useState } from 'react';
import { X, PackagePlus, Barcode, Check, Tag, DollarSign, Layers } from 'lucide-react';
import { ProductItem, ProductCategory } from '../../types/sales';

interface DefineProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onSaveProduct: (product: Omit<ProductItem, 'id' | 'createdAt'>) => void;
}

export const DefineProductModal: React.FC<DefineProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveProduct,
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState(() => '692' + Math.floor(100000000 + Math.random() * 900000000));
  const [category, setCategory] = useState(categories[0]?.name || 'عام');
  const [costPriceIQD, setCostPriceIQD] = useState<number | ''>('');
  const [sellingPriceIQD, setSellingPriceIQD] = useState<number | ''>('');
  const [installmentPriceIQD, setInstallmentPriceIQD] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [minQuantity, setMinQuantity] = useState<number>(3);
  const [unit, setUnit] = useState('قطعة');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    setBarcode('692' + Math.floor(100000000 + Math.random() * 900000000));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveProduct({
      code: 'PRD-' + Math.floor(100 + Math.random() * 900),
      barcode: barcode.trim(),
      name: name.trim(),
      category,
      costPriceIQD: Number(costPriceIQD) || 0,
      sellingPriceIQD: Number(sellingPriceIQD) || 0,
      installmentPriceIQD: Number(installmentPriceIQD) || Number(sellingPriceIQD) || 0,
      quantity: Number(quantity) || 0,
      minQuantity: Number(minQuantity) || 2,
      unit,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-[#0f3b63] text-white flex items-center justify-between border-b border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-300">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">تعريف مادة جديدة (Add Product / Item)</h3>
              <p className="text-[11px] text-sky-200">إدخال صنف ومادة جديدة مع الباركود وتحديد أسعار النقد والأقساط</p>
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
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم المادة / الصنف <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شاشة سامسونج 55 بوصة سمارت..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">الباركود (Barcode):</label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[10px] text-sky-600 hover:text-sky-800 font-bold cursor-pointer"
                >
                  ⚡ توليد تلقائي
                </button>
              </div>
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">القسم / التصنيف:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">سعر الكلفة (د.ع):</label>
              <input
                type="number"
                min="0"
                value={costPriceIQD}
                onChange={(e) => setCostPriceIQD(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">سعر البيع نقدي (د.ع):</label>
              <input
                type="number"
                min="0"
                required
                value={sellingPriceIQD}
                onChange={(e) => setSellingPriceIQD(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg font-mono font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">سعر البيع تقسيط (د.ع):</label>
              <input
                type="number"
                min="0"
                value={installmentPriceIQD}
                onChange={(e) => setInstallmentPriceIQD(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-white border border-amber-400 rounded-lg font-mono font-bold text-amber-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الكمية الافتتاحية:</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">حد الطلب (الإنذار):</label>
              <input
                type="number"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">الوحدة:</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="قطعة، جهاز..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
              />
            </div>
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
              <span>حفظ المادة في المخزن</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
