import React, { useState } from 'react';
import { X, Package, Search, Plus, Barcode, Trash2, Edit2, AlertTriangle, Layers, Filter } from 'lucide-react';
import { ProductItem, ProductCategory } from '../../types/sales';

interface ProductsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  categories: ProductCategory[];
  onOpenAddProduct: () => void;
  onDeleteProduct: (id: string) => void;
  onOpenBarcode: (product: ProductItem) => void;
}

export const ProductsCatalogModal: React.FC<ProductsCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onOpenAddProduct,
  onDeleteProduct,
  onOpenBarcode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery.trim()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalQuantity = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalCostValue = products.reduce((acc, p) => acc + (p.costPriceIQD * p.quantity), 0);
  const totalRetailValue = products.reduce((acc, p) => acc + (p.sellingPriceIQD * p.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4.5 bg-[#0f3b63] text-white flex items-center justify-between border-b border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">دليل وعرض المواد والمخزون (Inventory Catalog)</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/40">
                  {products.length} مادة
                </span>
              </div>
              <p className="text-xs text-sky-200">استعراض تفصيلي للمواد، الكميات المتاحة، أسعار التكلفة والمبيع، والباركود</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تعريف مادة جديدة</span>
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الباركود..."
              className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-sky-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-500 font-bold whitespace-nowrap">القسم:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">جميع الأقسام ({products.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#f0f7fc] text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">المادة / الصنف</th>
                  <th className="p-3">الباركود</th>
                  <th className="p-3">القسم</th>
                  <th className="p-3">سعر الكلفة</th>
                  <th className="p-3">سعر البيع نقدي</th>
                  <th className="p-3">سعر التقسيط</th>
                  <th className="p-3">الرصيد المخزني</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لا توجد مواد مطابقة لخيارات البحث
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                          {p.barcode}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{p.category}</td>
                      <td className="p-3 font-mono text-slate-700">{p.costPriceIQD.toLocaleString()} د.ع</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{p.sellingPriceIQD.toLocaleString()} د.ع</td>
                      <td className="p-3 font-mono font-bold text-amber-700">{p.installmentPriceIQD.toLocaleString()} د.ع</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          p.quantity <= 0 
                            ? 'bg-rose-100 text-rose-800' 
                            : p.quantity <= p.minQuantity 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.quantity <= p.minQuantity && <AlertTriangle className="w-3 h-3" />}
                          <span>{p.quantity} {p.unit}</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenBarcode(p)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
                            title="طباعة باركود للمادة"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف المادة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] text-slate-500 block">إجمالي عدد القطع:</span>
              <span className="font-mono font-black text-slate-900">{totalQuantity.toLocaleString()} قطعة</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">إجمالي كلفة المخزون:</span>
              <span className="font-mono font-black text-slate-800">{totalCostValue.toLocaleString()} د.ع</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">القيمة بسعر البيع:</span>
              <span className="font-mono font-black text-emerald-700">{totalRetailValue.toLocaleString()} د.ع</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
