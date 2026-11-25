export type CurrencyCode = 'USD' | 'IQD' | 'EUR' | 'TRY' | 'AED' | 'GBP';

export type AccountType = 'bank' | 'client' | 'expenses' | 'revenues' | 'cash_box' | 'vault' | 'supplier'; // بنك، عميل، مصروفات، ايرادات، صندوق، خزنة، مورد

export type TransactionType = 
  | 'transfer_outgoing' 
  | 'transfer_incoming' 
  | 'exchange' 
  | 'cash_in' 
  | 'cash_out' 
  | 'bank_deposit'
  | 'journal';

export type TransferStatus = 'pending' | 'processing' | 'ready_for_pickup' | 'completed' | 'failed' | 'canceled';

export type CommissionType = 'collected' | 'on_us' | 'none'; // محصلة، علينا، بدون عمولة
export type TransferSettlementType = 'cash' | 'credit'; // نقدية | آجلة

export interface AccountItem {
  id: string;
  code?: string; // رقم / رمز الحساب المحاسبي مثل 10, 11, 12
  name: string;
  phone?: string; // رقم الهاتف / الموبايل
  address?: string; // عنوان الحساب أو عنوان البنك / الفرع
  type: AccountType;
  balanceIQD: number; // Positive = له (Credit), Negative = عليه (Debit)
  balanceUSD: number;
  city?: string;
  notes?: string;
  isSystem?: boolean;
  isLocked?: boolean; // قفل الحساب
  currencies?: CurrencyCode[]; // العملات المعتمدة للحساب (عملة أو أكثر)
  linkedVaultId?: string; // الخزنة المرتبطة بالصندوق (للتصفير وتوريد النقد إليها)
}

export interface CurrencyRate {
  code: CurrencyCode;
  nameAr: string;
  nameEn: string;
  buyRate: number; // against USD or base (e.g. 1515 IQD)
  sellRate: number; // (e.g. 1525 IQD)
  change24h: number;
  flag: string;
}

export interface P2PAgent {
  id: string;
  peerId: string; // e.g. "PEER-BGW-104"
  name: string;
  officeName: string;
  city: string;
  phone: string;
  commissionTier: string; // e.g. "0.25% أو 5,000 د.ع"
  status: 'active' | 'busy' | 'offline';
}

export interface TransactionRecord {
  id: string;
  code: string; // MTCN e.g. "SL-849-201"
  type: TransactionType;
  titleAr: string;
  
  senderName: string;
  senderPhone?: string;
  receiverName: string;
  receiverPhone?: string;
  
  accountId?: string;
  accountName?: string;
  
  amount: number;
  currency: CurrencyCode;
  
  targetAmount?: number;
  targetCurrency?: CurrencyCode;
  exchangeRate?: number;
  
  fee: number;
  commissionType?: CommissionType;
  transferSettlementType?: TransferSettlementType; // نقدية أو آجلة
  exchangeOperationType?: 'buy' | 'sell'; // شراء | بيع
  exchangeSettlementType?: 'cash' | 'credit'; // نقدي | آجل
  settlementCurrency?: CurrencyCode; // عملة القبض أو القيد (دينار عراقي / دولار)
  settlementAmount?: number; // المبلغ المحسوب والمقبوض بالدينار أو العملة المقيدة (الصادر الحسابي)
  cashBoxId?: string; // معرف الصندوق المقيد عليه (للقبض والصرف النقدي)
  cashBoxName?: string; // اسم الصندوق المقيد عليه في حالة النقدية
  agentCommission?: number; // عمولة الوكيل المستلم للحوالة
  agentCommissionType?: CommissionType; // نوع عمولة الوكيل: محصله / علينا / بدون
  agentName?: string; // اسم الوكيل المسلم للحواله
  agentBankId?: string; // معرف حساب البنك المعتمد كوكيل
  agentPhone?: string; // رقم هاتف / موبايل البنك الوكيل
  agentAddress?: string; // عنوان البنك الوكيل
  
  status: TransferStatus;
  otpCode?: string; // For P2P / Agent transfers
  agentPeerId?: string;
  destinationCity?: string; // مدينة الاستلام
  originCity?: string; // مدينة الإرسال
  payoutMethod?: 'cash' | 'agent_account'; // طريقة التسليم: نقدي أو على حساب الوكيل/العميل
  payoutAccountId?: string; // معرف الحساب المقيد عليه التسليم من دليل الحسابات
  payoutAccountName?: string; // اسم الحساب المقيد عليه التسليم
  createdBy?: string; // منشئ الحركة
  canceledAt?: string;
  cancelReason?: string;
  
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface UploadedProjectFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  contentSnippet?: string;
}

export interface TransferClientInquiryRecord {
  id: string;
  seqNumber: number;
  clientName: string;
  tradeName?: string;
  regNumber?: string;
  phone?: string;
  clientType: 'VIP' | 'عادي';
  productsCount: number;
  debtIQD: number;
  debtUSD: number;
  email?: string;
  city?: string;
  notes?: string;
}

export interface UserGroup {
  id: string;
  name: string; // الاسم
  latinName?: string; // الاسم اللاتيني
  type?: string; // النوع (المستخدم، الوكيل...)
  code: string;
  description?: string;
  permissions?: string[];
  departmentAccount?: string; // حساب القسم المرتبط
  createdAt: string;
}

export interface UserItem {
  id: string;
  username?: string;
  password?: string; // كلمة المرور لتسجيل الدخول
  fullName: string; // اسم المستخدم / الاسم الكامل
  branch: string; // الفرع
  userType: 'مدير' | 'موظف' | 'مدير فرع' | string; // مدير، موظف، مدير فرع فقط
  cashBox: string; // الصندوق (جميع الكوى، صندوق محدد...)
  groupId: string; // معرف المجموعة
  groupName: string; // اسم المجموعة / القسم
  isActive: boolean; // الحالة: فعال / معطل
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface ClientEditionInfo {
  isClientEdition: boolean;
  edition: 'client' | 'master';
  companyName: string;
  clientName?: string;
  phone?: string;
  city?: string;
  licenseKey?: string;
  officialLicenseKey?: string;
  activationStatus: 'pending_setup' | 'trial' | 'activated' | 'expired';
  trialStartDate?: string | null;
  trialDays: number;
  remainingTrialDays: number;
  isTrialExpired: boolean;
  canCreateTransaction: boolean;
  lockCompanyName: boolean;
  issueDate?: string;
  duration?: string;
}
