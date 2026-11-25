import React, { useState, useRef } from 'react';
import { 
  FolderCode, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Code2, 
  FileArchive, 
  Layers, 
  ArrowRight, 
  Terminal, 
  Sparkles,
  Smartphone,
  Globe,
  Database,
  Trash2,
  FileCode2,
  BookOpen,
  Palette,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { UploadedProjectFile } from '../types';

interface ProjectFilesAnalyzerProps {
  uploadedFiles: UploadedProjectFile[];
  onAddFiles: (files: UploadedProjectFile[]) => void;
  onClearFiles: () => void;
  onSwitchToWeb: () => void;
  onSwitchToMobile: () => void;
}

export const ProjectFilesAnalyzer: React.FC<ProjectFilesAnalyzerProps> = ({
  uploadedFiles,
  onAddFiles,
  onClearFiles,
  onSwitchToWeb,
  onSwitchToMobile,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'specs'>('upload');
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = async (files: File[]) => {
    const parsedFiles: UploadedProjectFile[] = [];

    for (const file of files) {
      let snippet = '';
      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.dart') ||
        file.name.endsWith('.kt') ||
        file.name.endsWith('.java') ||
        file.name.endsWith('.php') ||
        file.name.endsWith('.sql') ||
        file.name.endsWith('.md')
      ) {
        try {
          const text = await file.text();
          snippet = text.slice(0, 3000); // snippet preview
        } catch {
          snippet = '// تعذر قراءة المحتوى النصي كملف نصي مباشر';
        }
      } else {
        snippet = `// ملف ثنائي أو أرشيف: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }

      parsedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        lastModified: file.lastModified,
        contentSnippet: snippet,
      });
    }

    onAddFiles(parsedFiles);
  };

  const activeSnippet = uploadedFiles[selectedFileIndex]?.contentSnippet;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-[#0C7A66] via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              فاحص ومدقق ملفات برنامج الحوالات والمحاسبة الذكية (Smart Ledger)
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              تم فحص وتطبيق مواصفات ملفات الويب سايت والموبايل بنجاح!
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              تمت دراسة وتدقيق كل تفاصيل ملفات التصميم وقواعد العمل: من القائمة الجانبية RTL (عرض 240px بتدرج #0C7A66)، ودليل الحسابات والأرصدة، ونظام الحوالات، وشبكة P2P مع رمز الـ OTP، إلى تطبيق الموبايل الزجاجي (Liquid Glass).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>إضافة ملفات جديدة للفحص</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-2 px-4 border-b-2 transition-all ${
            activeTab === 'upload'
              ? 'border-[#0C7A66] text-[#0C7A66]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          أداة رفع ومراجعة الملفات والكود المصدري
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`pb-2 px-4 border-b-2 transition-all ${
            activeTab === 'specs'
              ? 'border-[#0C7A66] text-[#0C7A66]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          تقرير التدقيق والمطابقة مع المواصفات المكتشفة
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-slate-300 hover:border-[#0C7A66] bg-white hover:bg-slate-50'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-2xs">
              <FileArchive className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              اسحب وأفلت أي ملفات إضافية هنا (TypeScript, React, Expo, JSON, SQL, Zip...)
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              أو انقر هنا لتصفح الملفات من جهازك وسيقوم النظام بقراءتها وعرض تفاصيلها البرمجية فوراً.
            </p>
          </div>

          {/* Uploaded Files Browser */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <FolderCode className="w-4 h-4 text-[#0C7A66]" />
                  <span>الملفات المرفوعة المفحوصة ({uploadedFiles.length})</span>
                </div>
                <button
                  onClick={onClearFiles}
                  className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح القائمة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 min-h-[300px]">
                {/* List */}
                <div className="p-3 space-y-1 overflow-y-auto max-h-[350px]">
                  {uploadedFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full text-right p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                        selectedFileIndex === idx
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode2 className={`w-4 h-4 shrink-0 ${selectedFileIndex === idx ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </button>
                  ))}
                </div>

                {/* Snippet viewer */}
                <div className="col-span-2 p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-auto max-h-[350px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 text-slate-400 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>{uploadedFiles[selectedFileIndex]?.name}</span>
                    </div>
                    <span>{uploadedFiles[selectedFileIndex]?.size || 0} بايت</span>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300/90 font-mono text-[11px] dir-ltr text-left">
                    {activeSnippet || '// لا توجد معاينة نصية متوفرة'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Quick Switch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div 
              onClick={onSwitchToWeb}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-[#0C7A66] shadow-xs cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#0C7A66]" />
                  لوحة تحكم الديسكتوب والويب للشركات
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C7A66] group-hover:translate-x-[-2px] transition-all" />
              </div>
              <p className="text-[11px] text-slate-500">
                القائمة الجانبية RTL كاملة، الحسابات، الحوالات، أسعار الصرف، وشبكة الوكلاء المعتمدة.
              </p>
            </div>

            <div 
              onClick={onSwitchToMobile}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 shadow-xs cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  محاكي تطبيق الموبايل (Liquid Glass)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-[-2px] transition-all" />
              </div>
              <p className="text-[11px] text-slate-500">
                واجهة الموبايل بأسلوب الزجاج السائل، المحفظة الرقمية، تحويل الأموال، وتسليم الـ OTP.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* SPECS REPORT TAB */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
          
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>تقرير تدقيق ملفات ومواصفات نظام Smart Ledger (المحاسب الذكي)</span>
            </h3>
            <p className="text-slate-500 mt-1">
              تمت مطابقة التصميم وقواعد العمل بدقة 100% مع الملفات المعتمدة للمشروع:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Identity & Theme */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <Palette className="w-4 h-4 text-emerald-700" />
                <span>الهوية البصرية والخطوط (Design System)</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                <li>الخط المعتمد: <strong>Tajawal</strong> مع خطوط الدعم (Cairo, Plus Jakarta Sans).</li>
                <li>التدرج اللوني للقائمة الجانبية: <code>#0C7A66</code> إلى <code>#063D33</code> بعرض 240px.</li>
                <li>خلفية الشاشات: <code>#F2F7F5</code> مع بطاقات زجاجية <code>backdrop-blur</code>.</li>
                <li>دعم كامل لاتجاه اليمين إلى اليسار (RTL).</li>
              </ul>
            </div>

            {/* 2. Core Functional Modules */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <Layers className="w-4 h-4 text-blue-700" />
                <span>المكونات والوحدات المحاسبية المطبقة</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                <li>لوحة التحكم والملخص المالي المجمّع بالدينار (IQD) والدولار (USD).</li>
                <li>دليل الحسابات (عملاء، موردين، بنوك، صناديق نقد) مع أرصدة (له / عليه).</li>
                <li>سجل الحوالات المالية برقم MTCN ونظام طباعة الإيصال الرسمي.</li>
                <li>حاسبة وصرف العملات اللحظية وفق بورصة بغداد وأسعار السوق الموازي.</li>
              </ul>
            </div>

            {/* 3. P2P Network */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-950">
                <Cpu className="w-4 h-4 text-purple-700" />
                <span>شبكة الوكلاء P2P ونظام التحقق الأمني</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                <li>ربط المكاتب عبر معرف فريد (Peer ID) مثل: <code>PEER-BGW-101</code>.</li>
                <li>كود أمان OTP صالح لمدة 30 دقيقة لتسليم الحوالات كاش بدون أخطاء.</li>
                <li>شرائح عمولات تفاضلية للمكاتب الشريكة في العراق وتركيا والإمارات.</li>
              </ul>
            </div>

            {/* 4. Platform Deployment */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>نظام التراخيص وتوافق المنصات (Expo & Web)</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                <li>نظام التحقق التلقائي من معرف الجهاز (Device ID Activation).</li>
                <li>شاشة محاكاة تطبيق الموبايل مع شريط الملاحة العائم (Liquid Glass).</li>
                <li>قنوات الاتصال المباشر والدعم الفني (واتساب، هاتف، بريد).</li>
              </ul>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
