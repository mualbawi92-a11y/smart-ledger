import React, { useState } from 'react';
import { X, Barcode, Printer, Check, Copy } from 'lucide-react';
import { ProductItem } from '../../types/sales';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  selectedProduct?: ProductItem | null;
  companyName?: string;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
  companyName = 'نظام إدارة المبيعات والأقساط',
}) => {
  const [currentProductId, setCurrentProductId] = useState(() => {
    return selectedProduct?.id || products[0]?.id || '';
  });
  const [printCount, setPrintCount] = useState<number>(12);
  const [includePrice, setIncludePrice] = useState(true);
  const [priceType, setPriceType] = useState<'selling' | 'installment'>('selling');

  if (!isOpen) return null;

  const product = products.find(p => p.id === currentProductId) || products[0] || selectedProduct;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4.5 bg-[#0f3b63] text-white flex items-center justify-between border-b border-sky-900 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-300">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">طباعة وتصميم الباركود (Barcode Print)</h3>
              <p className="text-[11px] text-sky-200">طباعة ملصقات الباركود والأسعار لمواد وأصناف المحل</p>
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
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl print:hidden">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اختر المادة:</label>
              <select
                value={currentProductId}
                onChange={(e) => setCurrentProductId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عدد الملصقات:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={printCount}
                onChange={(e) => setPrintCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">السعر المطبوع:</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
              >
                <option value="selling">سعر البيع النقدي</option>
                <option value="installment">سعر البيع بالتقسيط</option>
              </select>
            </div>
          </div>

          {/* Barcode Preview Grid */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 block print:hidden">معاينة ملصقات الطباعة:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-100 rounded-2xl border border-slate-200 max-h-72 overflow-y-auto">
              {product && Array.from({ length: printCount }).map((_, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-300 text-center shadow-2xs space-y-1">
                  <div className="text-[10px] font-bold text-slate-600 truncate">{companyName}</div>
                  <div className="text-[11px] font-black text-slate-900 truncate" title={product.name}>
                    {product.name}
                  </div>
                  
                  {/* SVG Barcode Graphic */}
                  <div className="py-1 flex flex-col items-center justify-center">
                    <svg className="w-full h-8" viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="0" width="3" height="25" fill="#000" />
                      <rect x="10" y="0" width="2" height="25" fill="#000" />
                      <rect x="15" y="0" width="4" height="25" fill="#000" />
                      <rect x="22" y="0" width="2" height="25" fill="#000" />
                      <rect x="26" y="0" width="3" height="25" fill="#000" />
                      <rect x="32" y="0" width="5" height="25" fill="#000" />
                      <rect x="40" y="0" width="2" height="25" fill="#000" />
                      <rect x="45" y="0" width="3" height="25" fill="#000" />
                      <rect x="52" y="0" width="4" height="25" fill="#000" />
                      <rect x="58" y="0" width="2" height="25" fill="#000" />
                      <rect x="63" y="0" width="5" height="25" fill="#000" />
                      <rect x="71" y="0" width="3" height="25" fill="#000" />
                      <rect x="76" y="0" width="2" height="25" fill="#000" />
                      <rect x="82" y="0" width="4" height="25" fill="#000" />
                      <rect x="88" y="0" width="3" height="25" fill="#000" />
                      <rect x="94" y="0" width="5" height="25" fill="#000" />
                      <rect x="102" y="0" width="3" height="25" fill="#000" />
                      <rect x="108" y="0" width="4" height="25" fill="#000" />
                    </svg>
                    <span className="font-mono text-[10px] text-slate-700 tracking-wider">
                      {product.barcode}
                    </span>
                  </div>

                  <div className="text-xs font-black font-mono text-emerald-700 pt-0.5">
                    {priceType === 'selling' 
                      ? product.sellingPriceIQD.toLocaleString() 
                      : product.installmentPriceIQD.toLocaleString()} د.ع
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 print:hidden">
            <span className="text-[11px] text-slate-500">جاهز للإرسال إلى طابعة ملصقات الباركود الحرارية (Xprinter / Zebra)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الملصقات الآن</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
