import { CurrencyRate, AccountItem, P2PAgent, TransactionRecord, TransferClientInquiryRecord } from '../types';

export const INITIAL_CURRENCIES: CurrencyRate[] = [
  {
    code: 'USD',
    nameAr: 'دولار أمريكي',
    nameEn: 'US Dollar',
    buyRate: 1515,
    sellRate: 1525,
    change24h: 0.12,
    flag: '🇺🇸',
  },
  {
    code: 'IQD',
    nameAr: 'دينار عراقي',
    nameEn: 'Iraqi Dinar',
    buyRate: 1,
    sellRate: 1,
    change24h: 0.0,
    flag: '🇮🇶',
  },
  {
    code: 'EUR',
    nameAr: 'يورو أوروبي',
    nameEn: 'Euro',
    buyRate: 1620,
    sellRate: 1640,
    change24h: -0.18,
    flag: '🇪🇺',
  },
  {
    code: 'AED',
    nameAr: 'درهم إماراتي',
    nameEn: 'UAE Dirham',
    buyRate: 412,
    sellRate: 416,
    change24h: 0.05,
    flag: '🇦🇪',
  },
  {
    code: 'TRY',
    nameAr: 'ليرة تركية',
    nameEn: 'Turkish Lira',
    buyRate: 42,
    sellRate: 44,
    change24h: -0.45,
    flag: '🇹🇷',
  },
];

export const INITIAL_ACCOUNTS: AccountItem[] = [
  {
    id: 'acc-box-1',
    code: '101',
    name: 'الصندوق الرئيسي',
    type: 'cash_box',
    phone: '',
    city: '',
    balanceIQD: 0,
    balanceUSD: 0,
    linkedVaultId: 'acc-vault-1',
  },
  {
    id: 'acc-vault-1',
    code: '102',
    name: 'الخزنة الرئيسية',
    type: 'vault',
    phone: '',
    city: '',
    balanceIQD: 0,
    balanceUSD: 0,
  },
];

export const INITIAL_P2P_AGENTS: P2PAgent[] = [];

export const INITIAL_PROGRAM_CITIES: string[] = [
  'بغداد',
  'البصرة',
  'أربيل',
  'النجف الأشرف',
  'كربلاء المقدسة',
  'السليمانية',
  'الموصل',
  'العمارة',
  'كركوك',
  'دهوك',
  'الرمادي',
  'الديوانية',
  'الناصرية',
  'الحلة',
  'الكوت',
  'سامراء',
  'إسطنبول',
  'دبي',
];

// سجل الحوالات يبدأ فارغاً تماماً في النسخ الصادرة الرسمية
export const INITIAL_TRANSACTIONS: TransactionRecord[] = [];

// تفريغ استعلامات العملاء لتجهيز الفحص النظيف
export const INITIAL_INQUIRY_CLIENTS: TransferClientInquiryRecord[] = [];
