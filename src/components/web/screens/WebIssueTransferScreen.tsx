import React, { useState, useMemo, useEffect } from 'react';
import { 
  SendHorizontal, 
  Printer, 
  ChevronDown, 
  Hash, 
  X,
  Building2,
  Calendar,
  User,
  MapPin,
  Phone,
  HelpCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  History,
  Search,
  CheckCircle,
  Clock,
  ArrowLeftRight,
  ArrowDownLeft
} from 'lucide-react';
import { 
  TransactionRecord, 
  CurrencyCode, 
  CommissionType, 
  TransferSettlementType,
  AccountItem, 
  P2PAgent, 
  CurrencyRate 
} from '../../../types';
import { INITIAL_PROGRAM_CITIES } from '../../../data/initialData';
import { SearchableSelect } from '../../common/SearchableSelect';

interface WebIssueTransferScreenProps {
  isOpen?: boolean;
  isEmbedded?: boolean;
  onClose?: () => void;
  accounts: AccountItem[];
  agents: P2PAgent[];
  currencies: CurrencyRate[];
  transactions: TransactionRecord[];
  onCreateTransaction: (newTx: TransactionRecord) => void;
  onViewReceipt: (tx: TransactionRecord) => void;
  companyName?: string;
  systemUser?: string;
  onNavigateToBankAccounts?: () => void;
  onNavigateToTransfers?: () => void;
  onNavigateToPayout?: () => void;
}

export const WebIssueTransferScreen: React.FC<WebIssueTransferScreenProps> = ({
  isOpen = true,
  isEmbedded = false,
  onClose,
  accounts,
  agents,
  currencies,
  transactions,
  onCreateTransaction,
  onViewReceipt,
  companyName: initialCompanyName,
  systemUser: initialSystemUser,
  onNavigateToBankAccounts,
  onNavigateToTransfers,
  onNavigateToPayout,
}) => {
  // دالة مساعدة لتنسيق الأرقام مع الفوارز تلقائياً أثناء الكتابة (مثال: 1,500)
  const formatWithCommas = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null || val === '') return '';
    const str = String(val);
    const clean = str.replace(/,/g, '').replace(/[^0-9.]/g, '');
    if (!clean) return '';
    
    const parts = clean.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts.slice(1).join('') : '';

    if (!integerPart && decimalPart) {
      return '0' + decimalPart;
    }
    if (!integerPart) return '';

    const num = Number(integerPart);
    if (isNaN(num)) return str;

    const formattedInteger = num.toLocaleString('en-US');
    return `${formattedInteger}${decimalPart}`;
  };

  // دالة تحويل النص إلى رقم مع استبعاد الفوارز
  const parseNum = (val: string | number | undefined | null): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  // دالة تحويل رمز العملة إلى نص باللغة العربية فقط بدون أي رموز
  const getCurrencyNameAr = (code: CurrencyCode): string => {
    switch (code) {
      case 'USD': return 'دولار أمريكي';
      case 'IQD': return 'دينار عراقي';
      case 'EUR': return 'يورو';
      case 'AED': return 'درهم إماراتي';
      case 'TRY': return 'ليرة تركية';
      case 'GBP': return 'باون استرليني';
      default: return code;
    }
  };

  // توليد رقم عشوائي للحوالة (6 أرقام)
  const generateNumericCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // بيانات شريط الرأس: تأتي ديناميكياً من معلومات الشركة ومنظم القيد المسجل
  const [companyName, setCompanyName] = useState<string>(() => {
    return initialCompanyName || localStorage.getItem('smart_ledger_company_name') || 'شركة الصرافة والتحويل المالي';
  });
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  });
  const [systemUser, setSystemUser] = useState<string>(() => {
    return initialSystemUser || localStorage.getItem('smart_ledger_user_name') || 'محمد علي الباوي';
  });

  // مزامنة التحديثات عند تغير معلومات الشركة أو منظم القيد
  useEffect(() => {
    if (initialCompanyName) setCompanyName(initialCompanyName);
  }, [initialCompanyName]);

  useEffect(() => {
    if (initialSystemUser) setSystemUser(initialSystemUser);
  }, [initialSystemUser]);

  const [transferCode, setTransferCode] = useState<string>(generateNumericCode());
  
  // نوع الحوالة: نقدي / آجل
  const [settlementType, setSettlementType] = useState<TransferSettlementType>('cash'); // 'cash' | 'credit'
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // 1. معلومات الحوالة - افتراضيات مع فوارز
  const [amount, setAmount] = useState<string>('1,500');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [fee, setFee] = useState<string>('10');
  const [feeCurrency, setFeeCurrency] = useState<CurrencyCode>('USD');
  // نوع العمولة: محصلة / علينا / بدون
  const [commissionType, setCommissionType] = useState<CommissionType>('collected');
  // عملة القبض أو القيد (نص بالكامل)
  const [settlementCurrency, setSettlementCurrency] = useState<CurrencyCode>('IQD');
  // سعر الصرف
  const [exchangeRate, setExchangeRate] = useState<string>('1,520');

  // 2. معلومات المستلم
  const [receiverName, setReceiverName] = useState<string>('');
  const [destinationCity, setDestinationCity] = useState<string>('اسطنبول');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [receiverAddress, setReceiverAddress] = useState<string>('');

  // 3. معلومات المرسل
  const [senderName, setSenderName] = useState<string>('');
  const [senderCity, setSenderCity] = useState<string>('بغداد');
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('حوالة تجارية');

  // 4. معلومات الجهة المسؤولة عن التسليم (حسابات البنوك المعتمدة كوكلاء)
  const bankAccounts = useMemo(() => {
    return accounts.filter(acc => acc.type === 'bank');
  }, [accounts]);

  const [selectedBankId, setSelectedBankId] = useState<string>(() => {
    const firstBank = accounts.find(a => a.type === 'bank');
    return firstBank?.id || '';
  });

  const [agentName, setAgentName] = useState<string>(() => {
    const firstBank = accounts.find(a => a.type === 'bank');
    if (firstBank) return firstBank.name;
    return agents[0]?.name || 'مصرف بغداد - فرع المنصور';
  });
  const [agentCommission, setAgentCommission] = useState<string>('5,000');
  // نوع عمولة الوكيل: محصلة / علينا / بدون
  const [agentCommissionType, setAgentCommissionType] = useState<CommissionType>('on_us');
  // عنوان ورقم الوكيل
  const [agentContact, setAgentContact] = useState<string>(() => {
    const firstBank = accounts.find(a => a.type === 'bank');
    if (firstBank) {
      const addr = firstBank.address || firstBank.city || '';
      const ph = firstBank.phone || '';
      if (addr && ph) return `${addr} - ${ph}`;
      return addr || ph || '';
    }
    const ag = agents[0];
    if (ag) return `${ag.city || ''} - ${ag.phone || ''}`.trim().replace(/^-\s*|\s*-$/g, '');
    return 'بغداد - المنصور - 07701122334';
  });

  const [agentSearchQuery, setAgentSearchQuery] = useState('');

  // قائمة البنوك المفلترة للبحث في حقل الوكيل
  const filteredBankAccounts = useMemo(() => {
    if (!agentSearchQuery.trim()) return bankAccounts;
    const q = agentSearchQuery.toLowerCase().trim();
    return bankAccounts.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.code && b.code.toLowerCase().includes(q)) ||
      (b.phone && b.phone.includes(q)) ||
      (b.address && b.address.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q))
    );
  }, [bankAccounts, agentSearchQuery]);

  const handleSelectBank = (b: AccountItem) => {
    setSelectedBankId(b.id);
    setAgentName(b.name);
    const addr = b.address || b.city || '';
    const ph = b.phone || '';
    let contact = '';
    if (addr && ph) contact = `${addr} - ${ph}`;
    else contact = addr || ph || '';
    setAgentContact(contact);
    setIsAgentDropdownOpen(false);
    setAgentSearchQuery('');
  };

  // 5. التفاصيل
  const [notes, setNotes] = useState<string>('');

  // القوائم المنسدلة
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [isSenderDropdownOpen, setIsSenderDropdownOpen] = useState(false);
  const [senderSearchQuery, setSenderSearchQuery] = useState('');

  // إشعار النجاح والسند الأخير
  const [lastIssuedTx, setLastIssuedTx] = useState<TransactionRecord | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // التبويب النشط: إصدار حوالة صادرة أو الحركات (اليومية يوم بيومه)
  const [activeTab, setActiveTab] = useState<'issue' | 'history'>('issue');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'ready' | 'completed'>('all');
  const [selectedHistoryTxId, setSelectedHistoryTxId] = useState<string | null>(null);

  // دليل الحسابات (للحوالة الآجلة) - أسماء حسابات العملاء والوكلاء فقط (استبعاد الصناديق والخزائن)
  const customerAccounts = useMemo(() => {
    return accounts.filter(acc => acc.type !== 'cash_box' && acc.type !== 'vault');
  }, [accounts]);

  const filteredCustomerAccounts = useMemo(() => {
    if (!senderSearchQuery.trim()) return customerAccounts;
    const q = senderSearchQuery.toLowerCase().trim();
    return customerAccounts.filter(acc => acc.name.toLowerCase().includes(q));
  }, [customerAccounts, senderSearchQuery]);

  // الصناديق النقدية للحوالة النقدية
  const cashBox = useMemo(() => {
    return accounts.find(acc => acc.type === 'cash_box') || accounts[0];
  }, [accounts]);

  const formatNum = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '') return '0';
    const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });
  };

  const numericAmount = parseNum(amount);
  const numericFee = commissionType === 'none' ? 0 : parseNum(fee);
  const numericAgentComm = agentCommissionType === 'none' ? 0 : parseNum(agentCommission);

  // سعر الصرف (سعر صرف الدولار بالدينار، مثلاً 1520 أو 152000)
  const rawRate = parseNum(exchangeRate);
  const effectiveRate = rawRate > 10000 ? rawRate / 100 : (rawRate > 0 ? rawRate : 1520);

  // الصادر الحسابي (احتساب الصادر مع مراعاة نوع العمولة: محصلة تضاف، علينا تُخصم، بدون لا تؤثر)
  const totalPayableData = useMemo(() => {
    const feeMultiplier = commissionType === 'collected' ? 1 : (commissionType === 'on_us' ? -1 : 0);

    if (currency === 'USD' && settlementCurrency === 'IQD') {
      const feeInUSD = feeCurrency === 'USD' ? numericFee * feeMultiplier : 0;
      const feeInIQD = feeCurrency === 'IQD' ? numericFee * feeMultiplier : 0;
      const totalUSD = Math.max(0, numericAmount + feeInUSD);
      const totalIQD = Math.max(0, Math.round(totalUSD * effectiveRate) + feeInIQD);

      let feeDetail = '';
      if (numericFee > 0 && commissionType !== 'none') {
        const signText = commissionType === 'collected' ? '+' : '-';
        const typeText = commissionType === 'collected' ? 'عمولة محصلة' : 'عمولة علينا (مخصومة)';
        feeDetail = feeCurrency === 'USD'
          ? ` ${signText} ${typeText} ${numericFee.toLocaleString('en-US')} دولار`
          : ` ${signText} ${typeText} ${numericFee.toLocaleString('en-US')} د.ع`;
      }

      const calcDetails = feeCurrency === 'USD'
        ? (feeDetail
            ? `${numericAmount.toLocaleString('en-US')} دولار ${feeDetail} = ${totalUSD.toLocaleString('en-US')} دولار بسعر صرف ${effectiveRate.toLocaleString('en-US')} = ${totalIQD.toLocaleString('en-US')} دينار عراقي`
            : `${numericAmount.toLocaleString('en-US')} دولار بسعر صرف ${effectiveRate.toLocaleString('en-US')} = ${totalIQD.toLocaleString('en-US')} دينار عراقي`)
        : (feeDetail
            ? `${numericAmount.toLocaleString('en-US')} دولار بسعر صرف ${effectiveRate.toLocaleString('en-US')} = ${Math.round(numericAmount * effectiveRate).toLocaleString('en-US')} د.ع ${feeDetail} = ${totalIQD.toLocaleString('en-US')} دينار عراقي`
            : `${numericAmount.toLocaleString('en-US')} دولار بسعر صرف ${effectiveRate.toLocaleString('en-US')} = ${totalIQD.toLocaleString('en-US')} دينار عراقي`);

      return {
        amount: totalIQD,
        currencyCode: 'IQD' as CurrencyCode,
        currencyText: 'دينار عراقي',
        totalUSD,
        rate: effectiveRate,
        calcDetails,
      };
    } else if (currency === 'IQD' && settlementCurrency === 'USD') {
      const feeInIQD = feeCurrency === 'IQD' ? numericFee * feeMultiplier : 0;
      const feeInUSD = feeCurrency === 'USD' ? numericFee * feeMultiplier : 0;
      const totalIQD = Math.max(0, numericAmount + feeInIQD);
      const totalUSD = effectiveRate > 0 ? Math.max(0, Math.round(((totalIQD / effectiveRate) + feeInUSD) * 100) / 100) : 0;

      let feeDetail = '';
      if (numericFee > 0 && commissionType !== 'none') {
        const signText = commissionType === 'collected' ? '+' : '-';
        const typeText = commissionType === 'collected' ? 'عمولة محصلة' : 'عمولة علينا (مخصومة)';
        feeDetail = feeCurrency === 'IQD'
          ? ` ${signText} ${typeText} ${numericFee.toLocaleString('en-US')} د.ع`
          : ` ${signText} ${typeText} ${numericFee.toLocaleString('en-US')} دولار`;
      }

      return {
        amount: totalUSD,
        currencyCode: 'USD' as CurrencyCode,
        currencyText: 'دولار أمريكي',
        totalUSD,
        rate: effectiveRate,
        calcDetails: `${numericAmount.toLocaleString('en-US')} دينار ${feeDetail} بسعر صرف ${effectiveRate.toLocaleString('en-US')} = ${totalUSD.toLocaleString('en-US')} دولار أمريكي`,
      };
    } else {
      // نفس العملة (مثال: دولار - دولار، أو دينار - دينار)
      const feeVal = numericFee * feeMultiplier;
      const total = Math.max(0, numericAmount + feeVal);
      const cText = getCurrencyNameAr(settlementCurrency);

      let calcDetails = `${total.toLocaleString('en-US')} ${cText}`;
      if (numericFee > 0 && commissionType !== 'none') {
        if (commissionType === 'collected') {
          calcDetails = `${numericAmount.toLocaleString('en-US')} ${cText} + عمولة محصلة ${numericFee.toLocaleString('en-US')} ${cText} = ${total.toLocaleString('en-US')} ${cText}`;
        } else if (commissionType === 'on_us') {
          calcDetails = `${numericAmount.toLocaleString('en-US')} ${cText} - عمولة علينا ${numericFee.toLocaleString('en-US')} ${cText} = ${total.toLocaleString('en-US')} ${cText}`;
        }
      }

      return {
        amount: total,
        currencyCode: settlementCurrency,
        currencyText: cText,
        totalUSD: currency === 'USD' ? total : 0,
        rate: effectiveRate,
        calcDetails,
      };
    }
  }, [currency, settlementCurrency, numericAmount, numericFee, feeCurrency, commissionType, effectiveRate]);

  // اختيار حساب العميل
  const handleSelectAccount = (acc: AccountItem) => {
    setSelectedAccountId(acc.id);
    setSenderName(acc.name);
    if (acc.phone) setSenderPhone(acc.phone);
    if (acc.city) setSenderCity(acc.city);
    setIsSenderDropdownOpen(false);
    setSenderSearchQuery('');
  };

  // إفراغ الحقول
  const handleReset = () => {
    setTransferCode(generateNumericCode());
    setSettlementType('cash');
    setSelectedAccountId('');
    setAmount('1,500');
    setCurrency('USD');
    setFee('10');
    setFeeCurrency('USD');
    setCommissionType('collected');
    setSettlementCurrency('IQD');
    setExchangeRate('1,520');
    setReceiverName('');
    setReceiverPhone('');
    setReceiverAddress('');
    setSenderName('');
    setSenderPhone('');
    setSenderCity('بغداد');
    setTransferReason('حوالة تجارية');
    setDestinationCity('اسطنبول');
    const firstBank = bankAccounts[0];
    setSelectedBankId(firstBank?.id || '');
    setAgentName(firstBank?.name || 'مصرف بغداد - فرع المنصور');
    if (firstBank) {
      const addr = firstBank.address || firstBank.city || '';
      const ph = firstBank.phone || '';
      if (addr && ph) setAgentContact(`${addr} - ${ph}`);
      else setAgentContact(addr || ph || '');
    } else {
      setAgentContact('بغداد - المنصور - 07701122334');
    }
    setAgentCommission('5,000');
    setAgentCommissionType('on_us');
    setNotes('');
    setShowSuccessBanner(false);
  };

  // اختصارات الكيبورد (F9 موافق / ESC انهاء)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleIssueTransfer();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) {
          onClose();
        } else {
          handleReset();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, numericAmount, receiverName, senderName, settlementType]);

  // حفظ وإصدار الحوالة
  const handleIssueTransfer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (settlementType === 'credit' && !senderName.trim()) {
      alert('يرجى اختيار حساب المرسل من دليل الحسابات');
      return;
    }

    const effectiveSender = senderName.trim() || (settlementType === 'cash' ? 'عميل نقدي' : 'حساب عام');

    if (!receiverName.trim()) {
      alert('يرجى إدخال اسم المستلم');
      return;
    }

    if (numericAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح للحوالة');
      return;
    }

    const selectedBank = accounts.find(a => a.type === 'bank' && (a.id === selectedBankId || a.name === agentName));

    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      code: transferCode || generateNumericCode(),
      type: 'transfer_outgoing',
      titleAr: settlementType === 'cash'
        ? `حوالة نقدية صادرة إلى ${destinationCity} - ${receiverName}`
        : `حوالة آجلة صادرة إلى ${destinationCity} - ${receiverName}`,
      senderName: effectiveSender,
      senderPhone: senderPhone.trim() || undefined,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim() || undefined,
      amount: numericAmount,
      currency: currency,
      destinationCity: destinationCity,
      originCity: senderCity || 'بغداد',
      fee: commissionType === 'none' ? 0 : numericFee,
      commissionType: commissionType,
      transferSettlementType: settlementType,
      settlementCurrency: settlementCurrency,
      settlementAmount: totalPayableData.amount,
      exchangeRate: effectiveRate,
      cashBoxName: settlementType === 'cash' ? cashBox?.name : undefined,
      accountId: settlementType === 'cash' ? cashBox?.id : (selectedAccountId || undefined),
      accountName: settlementType === 'cash' ? cashBox?.name : effectiveSender,
      agentName: agentName.trim() || undefined,
      agentBankId: selectedBank?.id || undefined,
      agentPhone: selectedBank?.phone || (agentContact.includes('-') ? agentContact.split('-')[1]?.trim() : undefined),
      agentAddress: selectedBank?.address || (agentContact.includes('-') ? agentContact.split('-')[0]?.trim() : undefined),
      agentCommission: agentCommissionType === 'none' ? 0 : numericAgentComm,
      agentCommissionType: agentCommissionType,
      status: 'ready_for_pickup',
      otpCode: Math.floor(1000 + Math.random() * 9000).toString(),
      createdBy: systemUser || 'حيدر',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes: notes.trim() || (
        agentContact.trim()
          ? `الوكيل: ${agentName} [${agentContact}]`
          : (currency === 'USD' && settlementCurrency === 'IQD'
              ? `حوالة بالدولار ($${numericAmount}) قُبضت/قُيدت بالدينار بسعر ${effectiveRate} (الصادر: ${totalPayableData.amount.toLocaleString()} د.ع)`
              : undefined)
      ),
    };

    onCreateTransaction(newTx);
    setLastIssuedTx(newTx);
    setShowSuccessBanner(true);
  };

  // تاريخ اليوم بصيغة YYYY-MM-DD للحركات اليومية (يوم بيومه فقط)
  const todayDateStr = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  // سجل حركات إصدار الحوالات الصادرة اليومية (يوم بيومه فقط)
  const dailyIssueHistory = useMemo(() => {
    return transactions.filter(t => {
      // فقط الحوالات الصادرة
      const isIssue = t.type === 'transfer_outgoing' || (t.type === 'transfer' && !t.completedAt);
      if (!isIssue) return false;

      // يوم بيومه فقط: التأكد من أن تاريخ الإصدار يطابق تاريخ اليوم
      const txDate = (t.createdAt || '').slice(0, 10);
      return txDate === todayDateStr;
    });
  }, [transactions, todayDateStr]);

  // تصفية سجل حركات الإصدار اليومية
  const filteredDailyHistory = useMemo(() => {
    return dailyIssueHistory.filter(item => {
      if (historyStatusFilter === 'ready' && item.status !== 'ready_for_pickup' && item.status !== 'pending') return false;
      if (historyStatusFilter === 'completed' && item.status !== 'completed') return false;

      if (!historySearchQuery.trim()) return true;
      const q = historySearchQuery.trim().toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        (item.receiverName && item.receiverName.toLowerCase().includes(q)) ||
        (item.senderName && item.senderName.toLowerCase().includes(q)) ||
        (item.agentName && item.agentName.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.otpCode && item.otpCode.includes(q))
      );
    });
  }, [dailyIssueHistory, historyStatusFilter, historySearchQuery]);

  // تحديد أول حركة تلقائياً في تبويب الحركات
  useEffect(() => {
    if (activeTab === 'history' && filteredDailyHistory.length > 0) {
      if (!selectedHistoryTxId || !filteredDailyHistory.some(t => t.id === selectedHistoryTxId)) {
        setSelectedHistoryTxId(filteredDailyHistory[0].id);
      }
    } else if (filteredDailyHistory.length === 0) {
      setSelectedHistoryTxId(null);
    }
  }, [activeTab, filteredDailyHistory, selectedHistoryTxId]);

  // إجماليات الحركات اليومية الصادرة
  const dailyHistoryTotals = useMemo(() => {
    let totalUSD = 0;
    let totalIQD = 0;

    filteredDailyHistory.forEach(item => {
      if (item.currency === 'USD') totalUSD += item.amount;
      else if (item.currency === 'IQD') totalIQD += item.amount;
    });

    return {
      count: filteredDailyHistory.length,
      totalUSD,
      totalIQD,
    };
  }, [filteredDailyHistory]);

  // دعم اختصارات لوحة المفاتيح والأسهم (ArrowUp / ArrowDown) للتنقل بين الأسطر بدون ماوس
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isInput && activeTab === 'history') {
        if (!filteredDailyHistory || filteredDailyHistory.length === 0) return;
        e.preventDefault();

        const currentIndex = filteredDailyHistory.findIndex(tx => tx.id === selectedHistoryTxId);

        if (e.key === 'ArrowDown') {
          if (currentIndex === -1) {
            setSelectedHistoryTxId(filteredDailyHistory[0].id);
          } else if (currentIndex < filteredDailyHistory.length - 1) {
            setSelectedHistoryTxId(filteredDailyHistory[currentIndex + 1].id);
          }
        } else if (e.key === 'ArrowUp') {
          if (currentIndex === -1) {
            setSelectedHistoryTxId(filteredDailyHistory[filteredDailyHistory.length - 1].id);
          } else if (currentIndex > 0) {
            setSelectedHistoryTxId(filteredDailyHistory[currentIndex - 1].id);
          }
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, filteredDailyHistory, selectedHistoryTxId, onClose]);

  if (!isOpen && !isEmbedded) return null;

  const cardContent = (
    <div 
      className={`relative w-full transition-all duration-200 ${
        isEmbedded 
          ? 'max-w-full xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto bg-white rounded-3xl shadow-xl border-2 border-sky-400 overflow-hidden text-slate-800' 
          : 'w-full max-w-[96vw] lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1500px] bg-white rounded-3xl shadow-2xl border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.25)] overflow-hidden my-auto text-slate-800'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* =========================================================================
          شريط رأس النافذة (مطابق للون الأزرق السماوي لاستعلام الحوالات)
          ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-sky-200 border border-white/20">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>إصدار حوالة صادرة</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-sky-100 border border-white/20 font-bold">
                  #{transferCode}
                </span>
              </h2>
              <p className="text-[11px] text-sky-100/80">
                تسجيل وقيد الحوالات الصادرة وحساب العمولات والصادر الحسابي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* نوع الحوالة كأزرار أنيقة في الرأس */}
            <div className="flex items-center bg-black/20 p-0.5 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setSettlementType('cash')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settlementType === 'cash' 
                    ? 'bg-white text-sky-950 shadow-sm' 
                    : 'text-sky-100 hover:text-white'
                }`}
              >
                نقدي
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettlementType('credit');
                  setIsSenderDropdownOpen(true);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settlementType === 'credit' 
                    ? 'bg-amber-400 text-amber-950 shadow-sm' 
                    : 'text-sky-100 hover:text-white'
                }`}
              >
                آجل
              </button>
            </div>

            {/* زر الإغلاق */}
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                else handleReset();
              }}
              title="إغلاق (ESC)"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            شريط التبويبات المدمجة كأنظمة المحاسبة والصرافة: [ إصدار حوالة ] [ الحركات ]
            ========================================================================= */}
        <div className="bg-slate-100/80 px-4 pt-2 border-b border-slate-200 shrink-0">
          <div className="flex items-end gap-1.5">
            {/* تبويب: إصدار حوالة */}
            <button
              type="button"
              onClick={() => setActiveTab('issue')}
              className={`px-5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 flex items-center gap-2 ${
                activeTab === 'issue'
                  ? 'bg-white text-sky-950 border-slate-300 relative z-10 -mb-[1px] pb-2.5 shadow-xs font-black'
                  : 'bg-slate-200/80 text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200'
              }`}
            >
              <SendHorizontal className="w-3.5 h-3.5 text-sky-600" />
              <span>إصدار حوالة صادرة</span>
            </button>

            {/* تبويب: الحركات (اليومية يوم بيومه) */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-white text-sky-950 border-slate-300 relative z-10 -mb-[1px] pb-2.5 shadow-xs font-black'
                  : 'bg-slate-200/80 text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-600" />
              <span>الحركات (اليومية)</span>
              {dailyIssueHistory.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'history' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-700'
                }`}>
                  {dailyIssueHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'issue' ? (
          /* جسم النافذة */
          <div className="p-4 sm:p-5 max-h-[85vh] overflow-y-auto space-y-3.5 bg-[#fbfdfc]">

            {/* بانر النجاح بعد الحفظ */}
            {showSuccessBanner && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">تم إصدار وقيد الحوالة بنجاح!</div>
                    <div className="text-[11px] text-emerald-700">
                      رقم الحوالة: <span className="font-mono font-bold text-slate-900">{lastIssuedTx?.code}</span> • كود الاستلام: <span className="font-mono font-bold text-slate-900">{lastIssuedTx?.otpCode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lastIssuedTx && (
                    <button
                      type="button"
                      onClick={() => onViewReceipt(lastIssuedTx)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة السند</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSuccessBanner(false)}
                    className="p-1 text-emerald-700 hover:text-emerald-950"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <form id="issue-transfer-form" onSubmit={handleIssueTransfer} className="space-y-3.5">
            
            {/* شريط البيانات الأساسية (الشركة، التاريخ، منظم القيد) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">اسم الشركة:</span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">التاريخ:</span>
                <input
                  type="text"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">منظم القيد (المستخدم):</span>
                <input
                  type="text"
                  value={systemUser}
                  onChange={(e) => setSystemUser(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>
            </div>

            {/* =========================================================================
                1. معلومات الحوالة والصادر الحسابي
                ========================================================================= */}
            <div className="p-2 sm:p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2 text-xs">
              {/* السطر الأول: العنوان المميز + المبلغ + عملة الحوالة + العمولة + نوع العمولة */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                {/* العنوان المميز */}
                <div className="px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-700 font-extrabold text-xs rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>معلومات الحوالة :</span>
                </div>

                {/* 1. المبلغ */}
                <div className="flex items-center gap-1 min-w-[130px] flex-1">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">المبلغ:</span>
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => {
                      setAmount(formatWithCommas(e.target.value));
                    }}
                    placeholder="1,500"
                    className="w-full px-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:outline-none shadow-inner h-[30px]"
                  />
                </div>

                {/* 2. عملة الحوالة */}
                <div className="flex items-center gap-1 min-w-[130px] flex-1">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">عملة الحوالة:</span>
                  <SearchableSelect
                    className="w-full"
                    triggerClassName="min-h-[30px] h-[30px] px-2 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    value={currency}
                    onChange={(val) => {
                      const c = val as CurrencyCode;
                      setCurrency(c);
                      if (c === 'USD') {
                        if (numericAmount === 1500000) setAmount('1,500');
                        if (numericFee === 15000) setFee('10');
                        setFeeCurrency('USD');
                        setSettlementCurrency('IQD');
                      } else if (c === 'IQD') {
                        if (numericAmount === 1500 || numericAmount === 1000) setAmount('1,500,000');
                        if (numericFee === 10) setFee('15,000');
                        setFeeCurrency('IQD');
                        setSettlementCurrency('IQD');
                      }
                    }}
                    options={[
                      { value: 'USD', label: 'دولار أمريكي' },
                      { value: 'IQD', label: 'دينار عراقي' },
                      { value: 'EUR', label: 'يورو' },
                      { value: 'AED', label: 'درهم إماراتي' },
                      { value: 'TRY', label: 'ليرة تركية' },
                      { value: 'GBP', label: 'باون استرليني' },
                    ]}
                    searchPlaceholder="بحث في العملات..."
                  />
                </div>

                {/* 3. العمولة */}
                <div className="flex items-center gap-1 min-w-[100px] flex-1">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">العمولة:</span>
                  <input
                    type="text"
                    disabled={commissionType === 'none'}
                    value={commissionType === 'none' ? '0' : fee}
                    onChange={(e) => {
                      setFee(formatWithCommas(e.target.value));
                    }}
                    placeholder="10"
                    className="w-full px-2 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:outline-none disabled:bg-slate-100 shadow-inner h-[30px]"
                  />
                </div>

                {/* 4. نوع العمولة */}
                <div className="flex items-center gap-1 min-w-[130px] flex-1">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">نوع العمولة:</span>
                  <SearchableSelect
                    className="w-full"
                    triggerClassName="min-h-[30px] h-[30px] px-2 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    value={commissionType}
                    onChange={(val) => setCommissionType(val as CommissionType)}
                    options={[
                      { value: 'collected', label: 'محصلة (تُضاف)' },
                      { value: 'on_us', label: 'علينا (تُخصم)' },
                      { value: 'none', label: 'بدون عمولة' },
                    ]}
                    searchPlaceholder="نوع العمولة..."
                  />
                </div>
              </div>

              {/* السطر الثاني (جوه معلومات المبلغ): عملة القبض، سعر الصرف، والصافي (الصادر الحسابي) */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 pt-1 border-t border-slate-100">
                {/* 5. عملة القبض */}
                <div className="flex items-center gap-1 min-w-[150px] flex-1">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">عملة القبض:</span>
                  <SearchableSelect
                    className="w-full"
                    triggerClassName="min-h-[30px] h-[30px] px-2 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    value={settlementCurrency}
                    onChange={(val) => setSettlementCurrency(val as CurrencyCode)}
                    options={[
                      { value: 'IQD', label: 'دينار عراقي' },
                      { value: 'USD', label: 'دولار أمريكي' },
                      { value: 'EUR', label: 'يورو' },
                      { value: 'AED', label: 'درهم إماراتي' },
                      { value: 'TRY', label: 'ليرة تركية' },
                      { value: 'GBP', label: 'باون استرليني' },
                    ]}
                    searchPlaceholder="عملة القبض..."
                  />
                </div>

                {/* 6. سعر الصرف */}
                <div className="flex items-center gap-1 min-w-[130px] flex-1">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">سعر الصرف:</span>
                  <input
                    type="text"
                    disabled={currency === settlementCurrency}
                    value={currency === settlementCurrency ? '1' : exchangeRate}
                    onChange={(e) => {
                      setExchangeRate(formatWithCommas(e.target.value));
                    }}
                    placeholder="1,520"
                    className="w-full px-2 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:outline-none shadow-inner disabled:bg-slate-100 h-[30px]"
                  />
                </div>

                {/* 7. الصافي / الصادر الحسابي */}
                <div className="flex items-center justify-between px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-xl shadow-2xs min-w-[200px] flex-1 h-[32px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-emerald-800 whitespace-nowrap">الصافي (الصادر الحسابي):</span>
                    <span className="text-[10px] text-emerald-700 font-medium whitespace-nowrap">
                      ({settlementType === 'cash' ? 'نقداً بالصندوق' : 'قيد على الحساب'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black font-mono text-emerald-950 whitespace-nowrap">
                      {formatNum(totalPayableData.amount)}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 whitespace-nowrap">{totalPayableData.currencyText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                2. معلومات المستلم.....
                ========================================================================= */}
            <div className="p-2 sm:p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2 text-xs">
              {/* السطر الأول: العنوان المميز + اسم المستلم + مدينة الاستلام + رقم الهاتف */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                {/* العنوان المميز */}
                <div className="px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-700 font-extrabold text-xs rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>معلومات المستلم :</span>
                </div>

                {/* اسم المستلم (كبير/عريض) */}
                <div className="flex items-center gap-1 flex-[2] min-w-[180px]">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">اسم المستلم:</span>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="اسم المستلم الثلاثي..."
                    className="w-full px-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner h-[30px]"
                  />
                </div>

                {/* مدينة المستلم */}
                <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">مدينة الاستلام:</span>
                  <SearchableSelect
                    className="w-full"
                    triggerClassName="min-h-[30px] h-[30px] px-2 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    value={destinationCity}
                    onChange={(val) => setDestinationCity(val)}
                    options={INITIAL_PROGRAM_CITIES.map(c => ({ value: c, label: c }))}
                    searchPlaceholder="بحث في المدن..."
                  />
                </div>

                {/* رقم الهاتف */}
                <div className="flex items-center gap-1 flex-1 min-w-[130px]">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">رقم الهاتف:</span>
                  <input
                    type="text"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="0770xxxxxxx"
                    dir="ltr"
                    className="w-full px-2 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:outline-none shadow-inner h-[30px]"
                  />
                </div>
              </div>

              {/* السطر الثاني (جوه معلومات المستلم): عنوان المستلم */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">عنوان المستلم:</span>
                <input
                  type="text"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="المنطقة، الشارع، أقرب نقطة دالة..."
                  className="w-full px-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-medium text-slate-800 focus:outline-none shadow-inner h-[30px]"
                />
              </div>
            </div>

            {/* =========================================================================
                3. معلومات المرسل.....
                ========================================================================= */}
            <div className="p-2 sm:p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2 text-xs">
              {/* السطر الأول: العنوان المميز + اسم المرسل + مدينة المرسل + رقم الهاتف */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                {/* العنوان المميز */}
                <div className="px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-700 font-extrabold text-xs rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>معلومات المرسل :</span>
                </div>

                {/* اسم المرسل / حساب العميل */}
                <div className="relative flex items-center gap-1 flex-[2] min-w-[180px]">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                    {settlementType === 'credit' ? 'حساب العميل:' : 'اسم المرسل:'}
                  </span>
                  <div className="relative w-full">
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => {
                        setSenderName(e.target.value);
                        setSenderSearchQuery(e.target.value);
                        setIsSenderDropdownOpen(true);
                        if (settlementType === 'credit') {
                          setSelectedAccountId('');
                        }
                      }}
                      onFocus={() => {
                        if (settlementType === 'credit') {
                          setIsSenderDropdownOpen(true);
                        }
                      }}
                      placeholder={settlementType === 'credit' ? 'اختر اسم الحساب...' : 'اسم المرسل...'}
                      className="w-full px-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner h-[30px]"
                    />
                    {settlementType === 'credit' && (
                      <button
                        type="button"
                        onClick={() => setIsSenderDropdownOpen(!isSenderDropdownOpen)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* قائمة أسماء الحسابات بدون تفاصيل */}
                    {settlementType === 'credit' && isSenderDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsSenderDropdownOpen(false)} />
                        <div className="absolute z-30 w-full mt-1 bg-[#fffef0] border border-slate-300 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-200">
                          {filteredCustomerAccounts.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 text-center">لا توجد حسابات مطابقة</div>
                          ) : (
                            filteredCustomerAccounts.map(acc => (
                              <div
                                key={acc.id}
                                onClick={() => handleSelectAccount(acc)}
                                className="px-3 py-2 hover:bg-sky-100 cursor-pointer text-xs font-bold text-slate-800"
                              >
                                {acc.name}
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* مدينة المرسل */}
                <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">مدينة المرسل:</span>
                  <input
                    type="text"
                    value={senderCity}
                    onChange={(e) => setSenderCity(e.target.value)}
                    className="w-full px-2 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none shadow-inner h-[30px]"
                  />
                </div>

                {/* رقم الهاتف */}
                <div className="flex items-center gap-1 flex-1 min-w-[130px]">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">رقم الهاتف:</span>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="0770xxxxxxx"
                    dir="ltr"
                    className="w-full px-2 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:outline-none shadow-inner h-[30px]"
                  />
                </div>
              </div>

              {/* السطر الثاني (نزله جوه معلومات المرسل): سبب التحويل */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">سبب التحويل:</span>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="حوالة تجارية، مصاريف، شراء بضائع..."
                  className="w-full px-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-medium text-slate-800 focus:outline-none shadow-inner h-[30px]"
                />
              </div>
            </div>

            {/* =========================================================================
                4. معلومات الوكيل المسلم.....
                ========================================================================= */}
            <div className="p-2 sm:p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2 text-xs">
              {/* السطر الأول: العنوان المميز + اسم الوكيل + عمولة الوكيل + نوع العمولة */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                {/* العنوان المميز مع زر إدارة الوكلاء */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-700 font-extrabold text-xs rounded-xl whitespace-nowrap flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                    <span>معلومات الوكيل :</span>
                  </div>
                  {onNavigateToBankAccounts && (
                    <button
                      type="button"
                      onClick={onNavigateToBankAccounts}
                      className="text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg border border-sky-200 transition-colors shrink-0 h-[30px]"
                      title="الانتقال إلى إدارة الوكلاء"
                    >
                      <Building2 className="w-3 h-3 text-sky-600" />
                      <span>إدارة</span>
                    </button>
                  )}
                </div>

                {/* 1. اسم الحساب الوكيل المسلم */}
                <div className="relative flex items-center gap-1 flex-[2] min-w-[180px]">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">اسم الوكيل:</span>
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => {
                        setAgentName(e.target.value);
                        setAgentSearchQuery(e.target.value);
                      }}
                      onFocus={() => {
                        setIsAgentDropdownOpen(true);
                        setAgentSearchQuery('');
                      }}
                      placeholder="اختر اسم الوكيل..."
                      className="w-full px-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none shadow-inner h-[30px]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {isAgentDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsAgentDropdownOpen(false)} />
                        <div className="absolute z-30 w-full mt-1 bg-[#fffef0] border border-slate-300 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-200">
                          {filteredBankAccounts.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500 text-center font-bold">لا توجد حسابات بنوك مطابقة</div>
                          ) : (
                            filteredBankAccounts.map(b => (
                              <div
                                key={b.id}
                                onClick={() => handleSelectBank(b)}
                                className={`px-3 py-2 hover:bg-sky-100 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                                  selectedBankId === b.id ? 'bg-sky-100 font-bold' : ''
                                }`}
                              >
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{b.name}</span>
                                </div>
                                {b.code && (
                                  <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                    #{b.code}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. عمولة الوكيل */}
                <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">عمولة الوكيل:</span>
                  <input
                    type="text"
                    disabled={agentCommissionType === 'none'}
                    value={agentCommissionType === 'none' ? '0' : agentCommission}
                    onChange={(e) => {
                      setAgentCommission(formatWithCommas(e.target.value));
                    }}
                    placeholder="5,000"
                    className="w-full px-2 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:outline-none disabled:bg-slate-100 shadow-inner h-[30px]"
                  />
                </div>

                {/* 3. نوع العمولة */}
                <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                  <span className="text-[11px] font-bold text-rose-700 whitespace-nowrap">نوع العمولة:</span>
                  <SearchableSelect
                    className="w-full"
                    triggerClassName="min-h-[30px] h-[30px] px-2 py-0.5 bg-[#fffef0] border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    value={agentCommissionType}
                    onChange={(val) => setAgentCommissionType(val as CommissionType)}
                    options={[
                      { value: 'collected', label: 'محصلة' },
                      { value: 'on_us', label: 'علينا' },
                      { value: 'none', label: 'بدون' },
                    ]}
                    searchPlaceholder="نوع العمولة..."
                  />
                </div>
              </div>

              {/* السطر الثاني (نزله جوه معلومات الوكيل): عنوان ورقم الوكيل */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">عنوان ورقم الوكيل (البنك):</span>
                <input
                  type="text"
                  value={agentContact}
                  onChange={(e) => setAgentContact(e.target.value)}
                  placeholder="عنوان البنك أو الوكيل، الفرع، رقم الهاتف..."
                  className="w-full px-2.5 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none shadow-inner h-[30px]"
                />
              </div>
            </div>

            {/* =========================================================================
                5. التفاصيل
                ========================================================================= */}
            <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-xs">
              <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">التفاصيل:</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات أو تفاصيل إضافية..."
                className="flex-1 px-3 py-1 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-medium text-slate-800 focus:outline-none shadow-inner"
              />
            </div>

            {/* =========================================================================
                6. أزرار التحكم السفلية
                ========================================================================= */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] active:bg-[#075985] text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>موافق - F9</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    else handleReset();
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <span>إنهاء - ESC</span>
                </button>
              </div>

              {lastIssuedTx && (
                <button
                  type="button"
                  onClick={() => onViewReceipt(lastIssuedTx)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>طباعة السند الأخير</span>
                </button>
              )}
            </div>

          </form>

        </div>
      ) : (
        /* =========================================================================
            صفحة الحركات (حركات إصدار الحوالات الصادرة يوم بيومه فقط مثل الصيرفة)
            ========================================================================= */
        <div className="p-3.5 sm:p-4 space-y-3 bg-[#f8fafc] max-h-[85vh] overflow-y-auto flex flex-col">
          
          {/* إحصائيات وبطاقات سريعة للحركات اليومية الصادرة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-bold block">إجمالي الحوالات الصادرة اليوم</span>
              <span className="text-lg font-black text-slate-800 font-mono mt-0.5 block">{dailyHistoryTotals.count}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-blue-200 shadow-2xs">
              <span className="text-[11px] text-blue-700 font-bold block">مجموع المبالغ ($ دولار)</span>
              <span className="text-lg font-black text-blue-600 font-mono mt-0.5 block">
                ${dailyHistoryTotals.totalUSD.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] text-amber-700 font-bold block">مجموع المبالغ (د.ع عراقي)</span>
              <span className="text-lg font-black text-amber-600 font-mono mt-0.5 block">
                {dailyHistoryTotals.totalIQD.toLocaleString()} د.ع
              </span>
            </div>
          </div>

          {/* شريط البحث وتصفية الحركات */}
          <div className="p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="بحث في حوالات اليوم الصادرة برقم الحوالة، المستلم، المرسل، الوكيل..."
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-400 focus:outline-none transition-colors"
                />
                {historySearchQuery && (
                  <button 
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">الحالة:</span>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  historyStatusFilter === 'all'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('ready')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  historyStatusFilter === 'ready'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                جاهزة للصرف
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  historyStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                تم تسليمها
              </button>
            </div>
          </div>

          {/* جدول الحركات الصادرة اليومية */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col min-h-[320px]">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-xs text-slate-700 text-[11px] font-black border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">رقم الحوالة</th>
                    <th className="py-2.5 px-3">وقت الإصدار</th>
                    <th className="py-2.5 px-3">المستفيد</th>
                    <th className="py-2.5 px-3">المرسل</th>
                    <th className="py-2.5 px-3">المبلغ والعملة</th>
                    <th className="py-2.5 px-3">العمولة</th>
                    <th className="py-2.5 px-3">الجهة / الوكيل</th>
                    <th className="py-2.5 px-3">كود الاستلام</th>
                    <th className="py-2.5 px-3">الحالة</th>
                    <th className="py-2.5 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyHistory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <History className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                        <p className="font-bold text-slate-500">لا توجد حوالات صادرة مسجلة لهذا اليوم حتى الآن</p>
                        <p className="text-[11px] text-slate-400 mt-1">تظهر هنا الحوالات الصادرة المنفذة اليوم فقط (يوم بيومه)</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDailyHistory.map((item) => {
                      const isSelected = selectedHistoryTxId === item.id;
                      return (
                        <tr 
                          key={item.id}
                          className={`hover:bg-sky-50/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-sky-100/70 font-bold' : ''
                          }`}
                          onClick={() => setSelectedHistoryTxId(item.id)}
                          onDoubleClick={() => onViewReceipt(item)}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-900">
                            #{item.code}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800">{item.receiverName}</span>
                            {item.receiverPhone && (
                              <span className="block text-[10px] text-slate-400 font-mono">{item.receiverPhone}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.senderName || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                            {item.amount.toLocaleString()} {item.currency === 'USD' ? '$' : 'د.ع'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                            {item.commission ? `${item.commission.toLocaleString()} ${item.currency === 'USD' ? '$' : 'د.ع'}` : '0'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.agentName || item.destinationCity || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700 bg-sky-50/50">
                            {item.otpCode || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                تم التسليم
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Clock className="w-3 h-3" />
                                جاهزة للصرف
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewReceipt(item);
                              }}
                              title="معاينة وطباعة الإيصال"
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 cursor-pointer inline-flex items-center justify-center transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ذيل جدول الحركات الصادرة */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <span className="font-bold">
                عدد الحركات المعروضة: {filteredDailyHistory.length} من أصل {dailyIssueHistory.length}
              </span>
              <span className="text-[11px] text-slate-400">
                الحركات المعروضة خاصة بتاريخ اليوم ({new Date().toLocaleDateString('ar-IQ')})
              </span>
            </div>
          </div>

        </div>
      )}

      </div>
  );

  if (isEmbedded) {
    return (
      <div className="flex-1 w-full min-h-full flex flex-col p-3 sm:p-5 md:p-6 text-slate-800 space-y-4" dir="rtl">
        <div className="w-full flex items-center justify-center my-auto">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" 
      dir="rtl"
      onClick={() => {
        if (onClose) onClose();
      }}
    >
      {cardContent}
    </div>
  );
};
