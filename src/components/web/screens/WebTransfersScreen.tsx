import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ArrowUpDown, 
  Printer, 
  XCircle, 
  FileText, 
  History, 
  MapPin, 
  User, 
  X,
  CheckCircle2, 
  Clock, 
  Calendar,
  RotateCcw,
  SlidersHorizontal,
  Info,
  FileSpreadsheet,
  Download,
  SendHorizontal,
  ArrowDownLeft,
  ArrowLeftRight,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TransactionRecord, TransferStatus, CurrencyCode } from '../../../types';
import { INITIAL_PROGRAM_CITIES } from '../../../data/initialData';
import { SearchableSelect } from '../../common/SearchableSelect';

interface WebTransfersScreenProps {
  transactions: TransactionRecord[];
  onOpenNewTransaction: () => void;
  onNavigateToIssue?: () => void;
  onNavigateToPayout?: () => void;
  onViewReceipt: (tx: TransactionRecord) => void;
  onPayout: (id: string) => void;
  onCancelTransfer?: (id: string, reason?: string) => void;
  onClose?: () => void;
}

type SortField = 'code' | 'receiverName' | 'amount' | 'currency' | 'destinationCity' | 'senderName' | 'createdAt' | 'status';

export const WebTransfersScreen: React.FC<WebTransfersScreenProps> = ({
  transactions,
  onOpenNewTransaction,
  onNavigateToIssue,
  onNavigateToPayout,
  onViewReceipt,
  onPayout,
  onCancelTransfer,
  onClose,
}) => {
  // Primary Quick Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // Dedicated Detailed Filters requested by User
  const [filterCode, setFilterCode] = useState('');
  const [filterReceiver, setFilterReceiver] = useState('');
  const [filterSender, setFilterSender] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination State (افتراضي 10 أسطر مع خيارات 10, 25, 50, 100, 1000)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Actions dropdown per row
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // الحوالة المحددة حالياً عند النقر على السطر
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Modals
  const [originModalTx, setOriginModalTx] = useState<TransactionRecord | null>(null);
  const [cancelModalTx, setCancelModalTx] = useState<TransactionRecord | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('بناءً على طلب المرسل قبل الاستلام');
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  // Extract transfers only
  const transferList = useMemo(() => {
    return transactions.filter(t => t.type.startsWith('transfer'));
  }, [transactions]);

  // Convert Currency Code to Arabic Text Only (No Symbols)
  const getCurrencyArabicName = (curr: string) => {
    switch (curr) {
      case 'IQD': return 'دينار عراقي';
      case 'USD': return 'دولار أمريكي';
      case 'EUR': return 'يورو';
      case 'TRY': return 'ليرة تركية';
      case 'AED': return 'درهم إماراتي';
      default: return curr;
    }
  };

  // Format amount without trailing decimal zeroes (.00)
  const formatAmountNumber = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Criteria actively applied to filter the table (only updated when user clicks "بحث" or presses Enter)
  const [appliedFilters, setAppliedFilters] = useState({
    code: '',
    receiver: '',
    sender: '',
    currency: 'all',
    city: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    searchTerm: '',
  });

  // حالة ما إذا كان المستخدم قد أجرى بحثاً (الافتراضي false حتى لا يتم جلب البيانات تلقائياً قبل الضغط على بحث)
  const [hasSearched, setHasSearched] = useState(false);

  // حالة المربع المنبثق عند عدم توفر نتائج مطابقة لمعايير البحث (Modal Popup)
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);

  // Action to apply current filter inputs to table
  const handleApplySearch = () => {
    // تفعيل حالة البحث
    setHasSearched(true);

    // 1. فحص إذا كانت كافة حقول ومعايير البحث فارغة تماماً
    const isAllEmpty = (
      !filterCode.trim() &&
      !filterReceiver.trim() &&
      !filterSender.trim() &&
      filterCurrency === 'all' &&
      filterCity === 'all' &&
      filterStatus === 'all' &&
      !filterDateFrom &&
      !filterDateTo &&
      !filterMinAmount &&
      !filterMaxAmount &&
      !searchTerm.trim()
    );

    // إذا تم الضغط على زر البحث والحقول فارغة: جلب وعرض كل الموجود وإغلاق أي تنبيه
    if (isAllEmpty) {
      setAppliedFilters({
        code: '',
        receiver: '',
        sender: '',
        currency: 'all',
        city: 'all',
        status: 'all',
        dateFrom: '',
        dateTo: '',
        minAmount: '',
        maxAmount: '',
        searchTerm: '',
      });
      setCurrentPage(1);
      setShowNoResultsModal(false);
      return;
    }

    // 2. فحص وجود نتائج مطابقة للبيانات المدخلة
    const term = searchTerm.trim().toLowerCase();
    const codeTerm = filterCode.trim().toLowerCase();
    const receiverTerm = filterReceiver.trim().toLowerCase();
    const senderTerm = filterSender.trim().toLowerCase();
    const minAmount = filterMinAmount ? parseFloat(filterMinAmount) : null;
    const maxAmount = filterMaxAmount ? parseFloat(filterMaxAmount) : null;

    const matchesCount = transferList.filter(t => {
      if (term) {
        const matchesGeneral = (
          t.code.toLowerCase().includes(term) ||
          t.receiverName.toLowerCase().includes(term) ||
          t.senderName.toLowerCase().includes(term) ||
          (t.destinationCity && t.destinationCity.toLowerCase().includes(term))
        );
        if (!matchesGeneral) return false;
      }
      if (codeTerm && !t.code.toLowerCase().includes(codeTerm)) return false;
      if (receiverTerm && !t.receiverName.toLowerCase().includes(receiverTerm)) return false;
      if (senderTerm && !t.senderName.toLowerCase().includes(senderTerm)) return false;
      if (filterCurrency !== 'all' && t.currency !== filterCurrency) return false;
      if (filterCity !== 'all' && t.destinationCity !== filterCity) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterDateFrom) {
        const txDate = t.createdAt.split(' ')[0];
        if (txDate < filterDateFrom) return false;
      }
      if (filterDateTo) {
        const txDate = t.createdAt.split(' ')[0];
        if (txDate > filterDateTo) return false;
      }
      if (minAmount !== null && !isNaN(minAmount) && t.amount < minAmount) return false;
      if (maxAmount !== null && !isNaN(maxAmount) && t.amount > maxAmount) return false;
      return true;
    }).length;

    // تطبيق الفلاتر على الجدول وتصفير الصفحة للأولى
    setAppliedFilters({
      code: filterCode,
      receiver: filterReceiver,
      sender: filterSender,
      currency: filterCurrency,
      city: filterCity,
      status: filterStatus,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
      minAmount: filterMinAmount,
      maxAmount: filterMaxAmount,
      searchTerm: searchTerm,
    });
    setCurrentPage(1);

    // 3. في حال ما توفرت الشروط عند البحث يظهر مربع منبثق
    if (matchesCount === 0) {
      setShowNoResultsModal(true);
    } else {
      setShowNoResultsModal(false);
    }
  };

  // Keyboard Enter key handler on inputs to trigger search
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplySearch();
    }
  };

  // Count active applied filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.code.trim()) count++;
    if (appliedFilters.receiver.trim()) count++;
    if (appliedFilters.sender.trim()) count++;
    if (appliedFilters.currency !== 'all') count++;
    if (appliedFilters.city !== 'all') count++;
    if (appliedFilters.status !== 'all') count++;
    if (appliedFilters.dateFrom) count++;
    if (appliedFilters.dateTo) count++;
    if (appliedFilters.minAmount) count++;
    if (appliedFilters.maxAmount) count++;
    return count;
  }, [appliedFilters]);

  // Indicator to show reset button if draft inputs or applied filters exist
  const hasDraftOrAppliedFilters = useMemo(() => {
    return Boolean(
      filterCode.trim() ||
      filterReceiver.trim() ||
      filterSender.trim() ||
      filterCurrency !== 'all' ||
      filterCity !== 'all' ||
      filterStatus !== 'all' ||
      filterDateFrom ||
      filterDateTo ||
      filterMinAmount ||
      filterMaxAmount ||
      activeFiltersCount > 0
    );
  }, [
    filterCode,
    filterReceiver,
    filterSender,
    filterCurrency,
    filterCity,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterMinAmount,
    filterMaxAmount,
    activeFiltersCount,
  ]);

  // Clear all filters (both draft inputs and applied filters)
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCode('');
    setFilterReceiver('');
    setFilterSender('');
    setFilterCurrency('all');
    setFilterCity('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
    setAppliedFilters({
      code: '',
      receiver: '',
      sender: '',
      currency: 'all',
      city: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      searchTerm: '',
    });
    setHasSearched(false);
    setShowNoResultsModal(false);
    setCurrentPage(1);
  };

  // Filtered & Sorted Transfers (only filtered by appliedFilters when user clicks search)
  const filteredTransfers = useMemo(() => {
    // إذا لم يضغط المستخدم على زر البحث، يبقى الاستعلام فارغاً تماماً ولا يجلب بيانات تلقائياً
    if (!hasSearched) {
      return [];
    }

    const term = appliedFilters.searchTerm.trim().toLowerCase();
    const codeTerm = appliedFilters.code.trim().toLowerCase();
    const receiverTerm = appliedFilters.receiver.trim().toLowerCase();
    const senderTerm = appliedFilters.sender.trim().toLowerCase();
    const minAmount = appliedFilters.minAmount ? parseFloat(appliedFilters.minAmount) : null;
    const maxAmount = appliedFilters.maxAmount ? parseFloat(appliedFilters.maxAmount) : null;

    let result = transferList.filter(t => {
      // General quick search
      if (term) {
        const matchesGeneral = (
          t.code.toLowerCase().includes(term) ||
          t.receiverName.toLowerCase().includes(term) ||
          t.senderName.toLowerCase().includes(term) ||
          (t.destinationCity && t.destinationCity.toLowerCase().includes(term))
        );
        if (!matchesGeneral) return false;
      }

      // Filter by Remittance Code (numeric)
      if (codeTerm && !t.code.toLowerCase().includes(codeTerm)) {
        return false;
      }

      // Filter by Beneficiary Name
      if (receiverTerm && !t.receiverName.toLowerCase().includes(receiverTerm)) {
        return false;
      }

      // Filter by Sender Name
      if (senderTerm && !t.senderName.toLowerCase().includes(senderTerm)) {
        return false;
      }

      // Filter by Currency
      if (appliedFilters.currency !== 'all' && t.currency !== appliedFilters.currency) {
        return false;
      }

      // Filter by Destination City (from program cities)
      if (appliedFilters.city !== 'all' && t.destinationCity !== appliedFilters.city) {
        return false;
      }

      // Filter by Status
      if (appliedFilters.status !== 'all' && t.status !== appliedFilters.status) {
        return false;
      }

      // Filter by Date Range (From - To)
      if (appliedFilters.dateFrom) {
        const txDate = t.createdAt.split(' ')[0];
        if (txDate < appliedFilters.dateFrom) return false;
      }
      if (appliedFilters.dateTo) {
        const txDate = t.createdAt.split(' ')[0];
        if (txDate > appliedFilters.dateTo) return false;
      }

      // Filter by Amount (Min - Max)
      if (minAmount !== null && !isNaN(minAmount) && t.amount < minAmount) {
        return false;
      }
      if (maxAmount !== null && !isNaN(maxAmount) && t.amount > maxAmount) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'amount') {
        return sortAsc ? (a.amount - b.amount) : (b.amount - a.amount);
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

    return result;
  }, [
    transferList,
    appliedFilters,
    sortField,
    sortAsc,
    hasSearched,
  ]);

  // Reset to page 1 whenever filters, search, or pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterCode,
    filterReceiver,
    filterSender,
    filterCurrency,
    filterCity,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterMinAmount,
    filterMaxAmount,
    pageSize,
  ]);

  // Total pages and valid current page
  const totalPages = Math.max(1, Math.ceil(filteredTransfers.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  // Paginated records for current page view
  const paginatedTransfers = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredTransfers.slice(start, start + pageSize);
  }, [filteredTransfers, validCurrentPage, pageSize]);

  const startIndex = filteredTransfers.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, filteredTransfers.length);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const closeDropdown = () => {
    if (openDropdownId) setOpenDropdownId(null);
  };

  // دعم التنقل واختيار الحوالات بالأسهم (الأعلى والأسفل) بدون الحاجة للماوس
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // تجنب مقاطعة الكتابة داخل الحقول النصية ومربعات البحث
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!paginatedTransfers || paginatedTransfers.length === 0) return;
        e.preventDefault();

        const currentIndex = paginatedTransfers.findIndex(tx => tx.id === selectedTxId);

        if (e.key === 'ArrowDown') {
          if (currentIndex === -1) {
            setSelectedTxId(paginatedTransfers[0].id);
          } else if (currentIndex < paginatedTransfers.length - 1) {
            setSelectedTxId(paginatedTransfers[currentIndex + 1].id);
          }
        } else if (e.key === 'ArrowUp') {
          if (currentIndex === -1) {
            setSelectedTxId(paginatedTransfers[paginatedTransfers.length - 1].id);
          } else if (currentIndex > 0) {
            setSelectedTxId(paginatedTransfers[currentIndex - 1].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedTransfers, selectedTxId]);

  const handleConfirmCancel = () => {
    if (!cancelModalTx) return;
    if (onCancelTransfer) {
      onCancelTransfer(cancelModalTx.id, cancelReasonInput);
    } else {
      cancelModalTx.status = 'canceled';
      cancelModalTx.cancelReason = cancelReasonInput;
      cancelModalTx.canceledAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    }
    setCancelModalTx(null);
    setOpenDropdownId(null);
  };

  // دالة تصدير بيانات الحوالات المعروضة إلى ملف إكسل XLSX حقيقي
  const handleExportExcel = () => {
    if (filteredTransfers.length === 0) {
      alert('لا توجد بيانات حوالات لتصديرها وفق الفلاتر الحالية');
      return;
    }

    const excelRows = filteredTransfers.map((tx, idx) => ({
      'ت': idx + 1,
      'رقم الحوالة': tx.code,
      'تاريخ وساعة القيد': tx.createdAt,
      'اسم المستفيد': tx.receiverName,
      'هاتف المستفيد': tx.receiverPhone || '—',
      'مبلغ الحوالة': tx.amount,
      'عملة الحوالة': getCurrencyArabicName(tx.currency),
      'اسم المرسل': tx.senderName,
      'هاتف المرسل': tx.senderPhone || '—',
      'مدينة الإرسال': tx.originCity || 'بغداد',
      'مدينة الاستلام': tx.destinationCity || 'البصرة',
      'العمولة': tx.fee || 0,
      'نوع العمولة': tx.commissionType === 'collected' ? 'محصلة' : tx.commissionType === 'on_us' ? 'على المكتب' : 'معفاة',
      'الحساب المخصوم': tx.accountName || 'الصندوق الرئيسي',
      'حالة الحوالة': tx.status === 'completed' ? 'تم التسليم' : tx.status === 'canceled' ? 'ملغية' : 'جاهزة للاستلام',
      'المنظم / الشباك': tx.createdBy || 'حيدر',
      'ملاحظات': tx.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    worksheet['!cols'] = [
      { wch: 6 },   // ت
      { wch: 14 },  // رقم الحوالة
      { wch: 18 },  // تاريخ
      { wch: 24 },  // المستفيد
      { wch: 16 },  // هاتف المستفيد
      { wch: 14 },  // المبلغ
      { wch: 14 },  // العملة
      { wch: 24 },  // المرسل
      { wch: 16 },  // هاتف المرسل
      { wch: 14 },  // مدينة الإرسال
      { wch: 14 },  // مدينة الاستلام
      { wch: 10 },  // العمولة
      { wch: 12 },  // نوع العمولة
      { wch: 20 },  // الحساب المخصوم
      { wch: 14 },  // الحالة
      { wch: 16 },  // المنظم
      { wch: 30 },  // ملاحظات
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الحوالات');
    const todayStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `استعلام_الحوالات_${todayStr}.xlsx`);
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> تم التسليم
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 text-blue-600" /> جاهزة للاستلام
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" /> ملغية
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" /> قيد المراجعة
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 w-full max-w-full mx-auto text-slate-800" onClick={closeDropdown} dir="rtl">
      
      {/* بطاقة فلاتر البحث والتدقيق */}
      <div className="bg-white rounded-2xl border border-sky-200/90 shadow-xs p-4 space-y-3 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
            {/* الطرف الأيمن: عنوان استعلام حوالات وتفريغ الفلاتر */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-500 text-white flex items-center justify-center shadow-xs">
                <Search className="w-4.5 h-4.5 stroke-[2.4]" />
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">استعلام حوالات</h2>
              {hasDraftOrAppliedFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-50 border border-rose-200 mr-2"
                  title="إفراغ وتصفير الفلاتر الحالية (F3)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تفريغ الفلاتر .F3 {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
                </button>
              )}
            </div>

            {/* الطرف الأيسر: أزرار العمليات (زر البحث كبقية الأزرار، طباعة، تصدير، وزر الإنهاء على أقصى الجانب الأيسر) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleApplySearch();
                }}
                className="h-8 px-3.5 bg-[#0284c7] hover:bg-[#0369a1] active:bg-[#075985] text-white border border-sky-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="تنفيذ وتطبيق البحث (Enter)"
              >
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>بحث</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintReportOpen(true)}
                className="h-8 px-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="طباعة تقرير الحوالات المفلترة (F6)"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>طباعة .F6</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                title="تصدير الحوالات المعروضة إلى ملف إكسل (Excel)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                <span>تصدير اكسل</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="إغلاق والعودة للرئيسية (ESC)"
                >
                  <X className="w-3.5 h-3.5 text-slate-600" />
                  <span>انهاء .ESC</span>
                </button>
              )}
            </div>
          </div>

          {/* All Filters in a Single Line: Remittance Code, Receiver, Sender, Currency, City, Status, Date Filter, and Amount Filter */}
          <div className="flex flex-wrap items-end gap-2.5 text-xs">
            
            {/* 1. رقم الحوالة (أرقام فقط) */}
            <div className="w-28 sm:w-32">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 whitespace-nowrap">رقم الحوالة</label>
              <input
                type="text"
                value={filterCode}
                onChange={(e) => setFilterCode(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="مثال: 849201"
                className="w-full px-2.5 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none shadow-inner"
              />
            </div>

            {/* 2. اسم المستفيد */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 whitespace-nowrap">اسم المستفيد</label>
              <input
                type="text"
                value={filterReceiver}
                onChange={(e) => setFilterReceiver(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="ابحث باسم المستفيد..."
                className="w-full px-2.5 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner"
              />
            </div>

            {/* 3. اسم المرسل */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 whitespace-nowrap">اسم المرسل</label>
              <input
                type="text"
                value={filterSender}
                onChange={(e) => setFilterSender(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="ابحث باسم المرسل..."
                className="w-full px-2.5 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner"
              />
            </div>

            {/* 4. فلترة العملة (نص عربي بدون رموز) */}
            <div className="w-32">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 whitespace-nowrap">عملة الحوالة</label>
              <SearchableSelect
                value={filterCurrency}
                onChange={(val) => setFilterCurrency(val)}
                options={[
                  { value: 'all', label: 'جميع العملات' },
                  { value: 'IQD', label: 'دينار عراقي' },
                  { value: 'USD', label: 'دولار أمريكي' },
                  { value: 'EUR', label: 'يورو' },
                  { value: 'TRY', label: 'ليرة تركية' },
                  { value: 'AED', label: 'درهم إماراتي' },
                ]}
                searchPlaceholder="بحث في العملات..."
              />
            </div>

            {/* 5. بحث حسب المدينة (المدن المضافة للبرنامج) */}
            <div className="w-32">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 whitespace-nowrap">مدينة الاستلام</label>
              <SearchableSelect
                value={filterCity}
                onChange={(val) => setFilterCity(val)}
                options={[
                  { value: 'all', label: 'جميع المدن' },
                  ...INITIAL_PROGRAM_CITIES.map(city => ({ value: city, label: city }))
                ]}
                searchPlaceholder="بحث في المدن..."
              />
            </div>

            {/* 6. بحث حسب الحالة */}
            <div className="w-32">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 whitespace-nowrap">حالة الحوالة</label>
              <SearchableSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                options={[
                  { value: 'all', label: 'جميع الحالات' },
                  { value: 'ready_for_pickup', label: 'جاهزة للاستلام' },
                  { value: 'completed', label: 'تم التسليم' },
                  { value: 'canceled', label: 'ملغية' },
                ]}
                searchPlaceholder="بحث في الحالة..."
              />
            </div>

            {/* 7. فلترة التاريخ من إلى (بسطر واحد مع الحالة) */}
            <div className="w-auto">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 whitespace-nowrap flex items-center gap-1">
                <Calendar className="w-3 h-3 text-sky-500" />
                <span>فلترة التاريخ:</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="px-2 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none shadow-inner"
                  title="من تاريخ"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="px-2 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none shadow-inner"
                  title="إلى تاريخ"
                />
              </div>
            </div>

            {/* 8. فلترة المبلغ من إلى (بسطر واحد مع الحالة والتاريخ) */}
            <div className="w-auto">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 whitespace-nowrap">فلترة المبلغ:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={filterMinAmount}
                  onChange={(e) => setFilterMinAmount(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="من مبلغ..."
                  className="w-24 px-2 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none shadow-inner"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="number"
                  value={filterMaxAmount}
                  onChange={(e) => setFilterMaxAmount(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="إلى مبلغ..."
                  className="w-24 px-2 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none shadow-inner"
                />
              </div>
            </div>

          </div>
        </div>

      {/* GLOWING CYAN CARD - EXACT STYLE AS REQUESTED FROM THE IMAGE */}
      <div id="transfers-table-container" className="rounded-3xl border-2 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.25)] bg-white overflow-hidden transition-all flex flex-col">
        
        {/* TRANSFERS DATA TABLE - قياس ثابت محدد h-[490px] لا يتغير حجم النافذة إطلاقاً عند زيادة أو نقصان الأسطر */}
        <div className="h-[490px] min-h-[490px] max-h-[490px] overflow-x-auto overflow-y-auto relative">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
              <tr className="bg-slate-50/95 text-slate-700 font-bold border-b border-slate-200 select-none backdrop-blur-xs">
                
                {/* 1. رقم الحوالة (أرقام فقط بدون حروف) */}
                <th 
                  onClick={() => handleSort('code')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>رقم الحوالة</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 2. اسم المستفيد (فقط الاسم) */}
                <th 
                  onClick={() => handleSort('receiverName')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>اسم المستفيد</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 3. مبلغ الحواله (0,0 رقم فقط) */}
                <th 
                  onClick={() => handleSort('amount')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-slate-800 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>مبلغ الحواله</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 4. عملة الحوالة (نص عربي فقط بدون أي رمز) */}
                <th 
                  onClick={() => handleSort('currency')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-slate-800 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>عملة الحوالة</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 5. مدينة الاستلام (تعتمد على مدن البرنامج) */}
                <th 
                  onClick={() => handleSort('destinationCity')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>مدينة الاستلام</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 6. اسم المرسل (فقط الاسم) */}
                <th 
                  onClick={() => handleSort('senderName')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>اسم المرسل</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* هاتف المرسل */}
                <th className="py-3 px-4 whitespace-nowrap text-slate-800">
                  <span>هاتف المرسل</span>
                </th>

                {/* اسم الوكيل */}
                <th className="py-3 px-4 whitespace-nowrap text-slate-800">
                  <span>اسم الوكيل</span>
                </th>

                {/* مدينة الإرسال */}
                <th className="py-3 px-4 whitespace-nowrap text-slate-800">
                  <span>مدينة الإرسال</span>
                </th>

                {/* 7. تاريخ الحوالة */}
                <th 
                  onClick={() => handleSort('createdAt')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>تاريخ الحوالة</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 8. حالة الحوالة (عامود منفرد) */}
                <th 
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-slate-800 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>حالة الحوالة</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 9. الاجرائات - عامود ثابت (Sticky Left) تمر من تحته باقي الأعمدة */}
                <th className="py-3 px-4 whitespace-nowrap text-slate-800 text-center sticky left-0 z-30 bg-slate-50 border-r border-slate-200 shadow-[4px_0_10px_rgba(0,0,0,0.06)]">
                  <span>الاجرائات</span>
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {paginatedTransfers.length > 0 ? (
                paginatedTransfers.map((tx) => {
                  const isSelected = selectedTxId === tx.id;
                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTxId(tx.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-100/90 font-bold text-sky-950 border-y border-sky-300 ring-1 ring-sky-400 shadow-inner'
                          : 'hover:bg-sky-50/40 text-slate-800'
                      }`}
                    >
                      {/* 1. رقم الحوالة (أرقام فقط بدون أي حروف أو إضافات) */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-sm">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0 animate-pulse"></span>}
                          <span className={isSelected ? 'text-sky-950 font-bold' : 'text-slate-900 font-bold'}>
                            {tx.code}
                          </span>
                        </div>
                      </td>

                      {/* 2. اسم المستفيد (فقط الاسم بدون أرقام أو نصوص إضافية) */}
                      <td className={`py-3.5 px-4 whitespace-nowrap font-bold ${isSelected ? 'text-sky-950' : 'text-slate-900'}`}>
                        {tx.receiverName}
                      </td>

                    {/* 3. مبلغ الحواله (0,0 باللون الأحمر العريض رقم فقط) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`font-bold font-mono text-xs ${tx.status === 'canceled' ? 'line-through text-slate-400' : 'text-[#DC2626]'}`}>
                        {formatAmountNumber(tx.amount)}
                      </span>
                    </td>

                    {/* 4. عملة الحوالة (نص عربي صافي بدون رموز) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap font-medium text-slate-700">
                      {getCurrencyArabicName(tx.currency)}
                    </td>

                    {/* 5. مدينة الاستلام (تعتمد على مدن البرنامج المضافة) */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>{tx.destinationCity || 'بغداد'}</span>
                      </div>
                    </td>

                    {/* 6. اسم المرسل (فقط الاسم بدون أرقام أو نصوص إضافية) */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-semibold">
                      {tx.senderName}
                    </td>

                    {/* هاتف المرسل */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]" dir="ltr">
                      {tx.senderPhone || '—'}
                    </td>

                    {/* اسم الوكيل */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                      {tx.agentName || tx.accountName || '—'}
                    </td>

                    {/* مدينة الإرسال */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <div className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{tx.originCity || 'إسطنبول'}</span>
                      </div>
                    </td>

                    {/* 7. تاريخ الحوالة */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{tx.createdAt}</span>
                      </div>
                    </td>

                    {/* 8. حالة الحوالة (عامود منفرد) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(tx.status)}
                    </td>

                    {/* 9. الاجرائات ▾ - عامود ثابت (Sticky Left) تمر من تحته الأسطر */}
                    <td 
                      className={`py-3.5 px-4 text-center whitespace-nowrap sticky left-0 bg-white group-hover:bg-[#f4f9fd] transition-colors border-r border-slate-200 shadow-[4px_0_10px_rgba(0,0,0,0.05)] ${
                        openDropdownId === tx.id ? 'z-40' : 'z-20'
                      }`} 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-right">
                        <button
                          type="button"
                          onClick={(e) => toggleDropdown(tx.id, e)}
                          className="border border-[#0284C7]/80 hover:border-[#0284C7] bg-white hover:bg-sky-50/60 text-[#0369A1] px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          <span>إجراءات</span>
                          <ChevronDown className="w-3 h-3 text-[#0369A1]" />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdownId === tx.id && (
                          <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-40 text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                            
                            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 bg-slate-50/50 flex items-center justify-between">
                              <span>حوالة رقم: {tx.code}</span>
                              {getStatusBadge(tx.status)}
                            </div>

                            <div className="py-1">
                              {/* 1. اصل الحركه (يرجع لتفاصيل إنشاء الحركة) */}
                              <button
                                onClick={() => {
                                  setOriginModalTx(tx);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-right px-3.5 py-2 hover:bg-sky-50 text-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <History className="w-4 h-4 text-sky-600" />
                                <div>
                                  <span className="block font-bold">أصل الحركة</span>
                                  <span className="text-[10px] text-slate-400">تفاصيل إنشاء وتغذية القيد</span>
                                </div>
                              </button>

                              {/* 2. طباعة الحركة */}
                              <button
                                onClick={() => {
                                  onViewReceipt(tx);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-right px-3.5 py-2 hover:bg-emerald-50 text-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <Printer className="w-4 h-4 text-emerald-600" />
                                <div>
                                  <span className="block font-bold">طباعة الحركة</span>
                                  <span className="text-[10px] text-slate-400">إصدار الإيصال وسند الاستلام</span>
                                </div>
                              </button>
                            </div>

                            {/* 3. الغاء الحوالة */}
                            <div className="py-1">
                              {tx.status !== 'canceled' && tx.status !== 'completed' ? (
                                <button
                                  onClick={() => {
                                    setCancelModalTx(tx);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-right px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <XCircle className="w-4 h-4 text-rose-500" />
                                  <div>
                                    <span className="block font-bold">إلغاء الحوالة</span>
                                    <span className="text-[10px] text-rose-400">إلغاء وسحب الإشعار واسترجاع المبلغ</span>
                                  </div>
                                </button>
                              ) : tx.status === 'completed' ? (
                                <div className="px-3.5 py-1.5 text-[10px] text-slate-400 italic">
                                  لا يمكن الإلغاء (تم تسليم المبلغ للمستفيد)
                                </div>
                              ) : (
                                <div className="px-3.5 py-1.5 text-[10px] text-rose-500 font-medium">
                                  تم إلغاء هذه الحوالة مسبقاً
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    </td>

                  </tr>
                  );
                })
              ) : !hasSearched ? (
                <tr>
                  <td colSpan={12} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200 shadow-2xs">
                        <Search className="w-6 h-6 stroke-[2]" />
                      </div>
                      <span className="text-sm font-black text-slate-800">استعلام الحوالات بانتظار أمر البحث</span>
                      <span className="text-xs text-slate-500 font-medium">
                        اضغط على زر «بحث» لعرض كافة الحوالات، أو حدد الفلاتر المطلوبة ثم اضغط «بحث».
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={12} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200 shadow-2xs">
                        <AlertCircle className="w-6 h-6 stroke-[2]" />
                      </div>
                      <span className="text-sm font-black text-rose-800">لا توجد أي حوالة مطابقة لشروط البحث</span>
                      <span className="text-xs text-slate-500 font-medium">
                        لم يتم العثور على أي نتيجة مطابقة لـ (الاسم أو التاريخ أو العملة أو رقم الحوالة).
                      </span>
                      {hasDraftOrAppliedFilters && (
                        <button
                          type="button"
                          onClick={() => {
                            handleResetFilters();
                            setHasSearched(true);
                          }}
                          className="mt-1 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                        >
                          عرض كافة الحوالات
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* شريط ترقيم وتحديد عدد الأسطر (10, 25, 50, 100, 1000) مع قياس نافذة ثابت */}
        <div className="p-3.5 bg-slate-50/95 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 select-none">
          
          {/* اليمين: عدد الحوالات المعروضة وخيار تحديد عدد الأسطر */}
          <div className="flex flex-wrap items-center gap-3 text-slate-600 font-medium">
            <span>
              إظهار <strong className="font-mono text-slate-900">{startIndex}</strong> إلى <strong className="font-mono text-slate-900">{endIndex}</strong> من أصل <strong className="font-mono text-slate-900">{filteredTransfers.length}</strong> مدخل
            </span>

            {/* محدد عدد الأسطر (10، 25، 50، 100، 1000) */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-300 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-700">عدد الأسطر:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-[#0284C7] focus:outline-none cursor-pointer pr-1"
              >
                <option value={10}>10 أسطر</option>
                <option value={25}>25 سطر</option>
                <option value={50}>50 سطر</option>
                <option value={100}>100 سطر</option>
                <option value={1000}>1000 سطر</option>
              </select>
            </div>
          </div>

          {/* اليسار: أزرار التصفح والصفحات */}
          <div className="flex items-center gap-1 font-medium">
            {/* زر السابق */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                validCurrentPage <= 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-200 cursor-pointer'
              }`}
            >
              السابق
            </button>

            {/* أرقام الصفحات */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && (
                      <span className="px-1 text-slate-400 font-mono">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                        p === validCurrentPage
                          ? 'bg-[#0284C7] text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            {/* زر التالي */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                validCurrentPage >= totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-200 cursor-pointer'
              }`}
            >
              التالي
            </button>
          </div>

        </div>

      </div>

      {/* MODAL 1: أصل الحركة (تفاصيل إنشاء الحركة والقيد المحاسبي) */}
      {originModalTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 font-bold text-sm">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>أصل الحركة وتفاصيل إنشاء القيد</span>
                    <span className="font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-xs border border-sky-200">
                      {originModalTx.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    توثيق كامل لكيفية تسجيل الحوالة، الحسابات المدينة والدائنة، وتاريخ الإدخال
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOriginModalTx(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

            {/* General Overview Status */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 to-slate-50 border border-sky-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500">حالة الحوالة الحالية:</div>
                <div className="mt-1">{getStatusBadge(originModalTx.status)}</div>
              </div>
              <div className="text-left">
                <div className="text-[11px] text-slate-500">تاريخ وساعة الإنشاء:</div>
                <div className="text-xs font-bold font-mono text-slate-800">{originModalTx.createdAt}</div>
              </div>
              <div className="text-left">
                <div className="text-[11px] text-slate-500">المستخدم / الشباك المنشئ:</div>
                <div className="text-xs font-bold text-[#0C7A66]">{originModalTx.createdBy || 'أمين الصندوق (الرئيسي)'}</div>
              </div>
            </div>

            {/* Financial Ledger Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Sender Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>بيانات المرسل والحساب المخصوم:</span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div>الاسم: <strong className="text-slate-900">{originModalTx.senderName}</strong></div>
                  <div>مدينة الإرسال: <strong>{originModalTx.originCity || 'بغداد'}</strong></div>
                  <div>الحساب المحاسبي: <strong className="text-emerald-700">{originModalTx.accountName || 'صندوق النقد الرئيسي'}</strong></div>
                </div>
              </div>

              {/* Beneficiary Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>بيانات المستفيد ووجهة الاستلام:</span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div>المستفيد: <strong className="text-slate-900">{originModalTx.receiverName}</strong></div>
                  <div>مدينة الاستلام: <strong className="text-sky-700">{originModalTx.destinationCity || 'البصرة'}</strong></div>
                  {originModalTx.otpCode && (
                    <div className="text-amber-800 font-mono font-bold">كود الأمان السري OTP: {originModalTx.otpCode}</div>
                  )}
                </div>
              </div>

            </div>

            {/* Financial Amounts Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 text-white font-mono text-xs space-y-2">
              <div className="text-[11px] text-slate-400 font-sans font-bold flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span>القيد المحاسبي والأرصدة المحولة</span>
                <span className="text-emerald-400">حوالة رقم: {originModalTx.code}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="p-2 bg-slate-900 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-sans">المبلغ والعملة</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    {formatAmountNumber(originModalTx.amount)} {getCurrencyArabicName(originModalTx.currency)}
                  </div>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-sans">عمولة التحويل</div>
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    {originModalTx.fee.toLocaleString()} {getCurrencyArabicName(originModalTx.currency)}
                  </div>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-sans">نوع العمولة</div>
                  <div className="text-xs font-sans font-bold text-slate-300 mt-1">
                    {originModalTx.commissionType === 'collected' ? 'محصلة من الزبون' : originModalTx.commissionType === 'on_us' ? 'على المكتب' : 'معفاة مجاناً'}
                  </div>
                </div>
              </div>
              {originModalTx.notes && (
                <div className="pt-2 text-[11px] text-slate-400 font-sans border-t border-slate-800">
                  <strong>ملاحظات الإدخال:</strong> {originModalTx.notes}
                </div>
              )}
            </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50/70">
              <button
                onClick={() => setOriginModalTx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                إغلاق النافذة
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const tx = originModalTx;
                    setOriginModalTx(null);
                    onViewReceipt(tx);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الإيصال الرسمي</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: رسالة منبثقة عند عدم توفر نتائج مطابقة لشروط البحث */}
      {showNoResultsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm sm:max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">لا توجد نتائج مطابقة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                لم يتم العثور على أي حوالة مطابقة لمعايير وشروط البحث المدخلة (الاسم، أو التاريخ، أو العملة، أو رقم الحوالة).
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowNoResultsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                موافق
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNoResultsModal(false);
                  handleResetFilters();
                  setHasSearched(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
              >
                عرض كافة الحوالات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: إلغاء الحوالة (تأكيد الإلغاء مع سبب وتوثيق) */}
      {cancelModalTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">تأكيد إلغاء الحوالة</h3>
                <span className="text-xs text-rose-500 font-mono font-bold">رقم الحوالة: {cancelModalTx.code}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من رغبتك في <strong>إلغاء الحوالة</strong> المالية للمستفيد <strong className="text-slate-900">{cancelModalTx.receiverName}</strong> بقيمة <strong className="text-rose-600 font-mono">{formatAmountNumber(cancelModalTx.amount)} {getCurrencyArabicName(cancelModalTx.currency)}</strong>؟
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">سبب الإلغاء (يتم توثيقه في السجل المحاسبي):</label>
              <textarea
                rows={2}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full p-2.5 bg-[#fffef0] border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-rose-500 focus:outline-none shadow-inner"
                placeholder="أدخل سبب إلغاء الحوالة..."
              />
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-[11px] text-rose-800 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>سيتم تغيير حالة الحوالة إلى (ملغية)، وإلغاء صلاحية كود الـ OTP، ورد المبلغ لحساب المرسل.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalTx(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                تأكيد الإلغاء الآن
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: تقرير طباعة استعلام الحوالات المفلترة */}
      {isPrintReportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-sky-300 shadow-2xl max-w-4xl w-full my-8 text-slate-800 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            
            {/* رأس التقرير للطباعة والمعاينة */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">تقرير كشف استعلام الحوالات المالية</h3>
                  <p className="text-xs text-slate-500">
                    تقرير الحوالات وفق الفلاتر النشطة ({filteredTransfers.length} حوالة)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>أمر الطباعة الآن</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintReportOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* جسم التقرير القابل للتمرير */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* ملخص إحصائي سريع قبل الجدول */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block">عدد الحوالات:</span>
                <span className="font-black font-mono text-sm text-slate-900">{filteredTransfers.length}</span>
              </div>
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl">
                <span className="text-[10px] text-sky-700 block">إجمالي الدينار العراقي:</span>
                <span className="font-black font-mono text-xs text-sky-950">
                  {filteredTransfers.filter(t => t.currency === 'IQD').reduce((s, c) => s + c.amount, 0).toLocaleString()} د.ع
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-700 block">إجمالي الدولار الأمريكي:</span>
                <span className="font-black font-mono text-xs text-emerald-950">
                  ${filteredTransfers.filter(t => t.currency === 'USD').reduce((s, c) => s + c.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block">تاريخ الطباعة:</span>
                <span className="font-bold text-[11px] text-slate-800">{new Date().toLocaleString('ar-IQ')}</span>
              </div>
            </div>

            {/* جدول التقرير المصغر للمعاينة والطباعة */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
              <table className="w-full text-right text-[11px] border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 border-l border-slate-200">رقم الحوالة</th>
                    <th className="py-2 px-2.5 border-l border-slate-200">المستفيد</th>
                    <th className="py-2 px-2.5 border-l border-slate-200 text-left">المبلغ</th>
                    <th className="py-2 px-2.5 border-l border-slate-200">العملة</th>
                    <th className="py-2 px-2.5 border-l border-slate-200">المرسل</th>
                    <th className="py-2 px-2.5 border-l border-slate-200">الوجهة</th>
                    <th className="py-2 px-2.5 border-l border-slate-200 text-center">الحالة</th>
                    <th className="py-2 px-2.5">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredTransfers.slice(0, 100).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 border-l border-slate-100 font-mono font-bold text-slate-900">
                        #{tx.code}
                      </td>
                      <td className="py-1.5 px-2.5 border-l border-slate-100 font-bold">
                        {tx.receiverName}
                      </td>
                      <td className="py-1.5 px-2.5 border-l border-slate-100 font-mono font-bold text-left">
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2.5 border-l border-slate-100">
                        {getCurrencyArabicName(tx.currency)}
                      </td>
                      <td className="py-1.5 px-2.5 border-l border-slate-100 text-slate-700">
                        {tx.senderName}
                      </td>
                      <td className="py-1.5 px-2.5 border-l border-slate-100 text-slate-600">
                        {tx.destinationCity || 'البصرة'}
                      </td>
                      <td className="py-1.5 px-2.5 border-l border-slate-100 text-center">
                        {tx.status === 'completed' ? 'تم التسليم' : tx.status === 'canceled' ? 'ملغية' : 'جاهزة للاستلام'}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-500">
                        {tx.createdAt.split(' ')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransfers.length > 100 && (
              <p className="text-[10px] text-slate-400 text-center">
                * تم عرض أول 100 حوالة للمعاينة السريعة. أمر الطباعة وملف الإكسل يشملان جميع الـ {filteredTransfers.length} حوالة.
              </p>
            )}
            </div>

            {/* تذييل النافذة */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsPrintReportOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                إغلاق المعاينة
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
