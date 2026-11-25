import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Building2, 
  FolderPlus, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Key,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Briefcase,
  Shield,
  RotateCcw,
  Save,
  CheckSquare,
  History,
  FileText,
  Printer,
  Eye,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  Ban
} from 'lucide-react';
import { UserItem, UserGroup } from '../../../types';

export interface BranchItem {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
}

interface WebUsersManagementScreenProps {
  companyName?: string;
  onClose?: () => void;
}

// نموذج التعديل في سجل القيد (شنو صار تعديل ومنو عدله)
export interface AuditLogChange {
  field: string;
  before: string;
  after: string;
}

export interface EntryAuditRecord {
  id: string;
  entryNumber: string;
  operationName: string;
  modifiedBy: string;
  userRole: string;
  timestamp: string;
  actionType: 'إنشاء قيد' | 'تعديل قيد' | 'إلغاء قيد' | 'حذف قيد' | 'طباعة قيد';
  reason?: string;
  changes: AuditLogChange[];
  ipAddress?: string;
}

// نموذج سطر الصلاحية المطابق لطلب المستخدم:
// كل أوبشن عليه:
// 1. عمل القيد (إدخال القيد)
// 2. تعديل القيد
// 3. حذف القيد
// 4. إلغاء القيد
// 5. طباعة القيد
// 6. سجل القيد (المقصود به شنو صار تعديل على هذا القيد ومنو عدله)
export interface PermissionRow {
  id: string;
  name: string; // اسم الأوبشن / العملية
  createEntry: boolean; // إدخال القيد (عمل القيد)
  editEntry: boolean; // تعديل القيد
  deleteEntry: boolean; // حذف القيد
  cancelEntry: boolean; // إلغاء القيد
  printEntry: boolean; // طباعة القيد
  logEntry: boolean; // سجل القيد (صلاحية الاطلاع على منو عدل وشنو التعديل)
  auditLogs?: EntryAuditRecord[]; // سجل التعديلات الموثق الفعلي
}

// تعريف أوبشنات البرنامج المشتقة تلقائياً من نظام الملاحة (أوبشنات النظام)
export interface ProgramOptionItem {
  key: string;
  label: string;
}

export const PROGRAM_OPTIONS: ProgramOptionItem[] = [
  { key: 'dashboard', label: 'لوحة التحكم' },
  { key: 'issue_transfer', label: 'إصدار حوالة' },
  { key: 'payout_transfer', label: 'تسلم حوالة' },
  { key: 'exchange', label: 'صرافة' },
  { key: 'deposit_withdrawal', label: 'سحب وإيداع' },
  { key: 'fund_transfer', label: 'مناقلة بين الصناديق' },
  { key: 'double_entry', label: 'قيد مزدوج' },
  { key: 'trial_balance', label: 'أرصدة الحسابات' },
  { key: 'transfers', label: 'استعلام الحوالات' },
  { key: 'statement', label: 'كشف حساب' },
  { key: 'accounts', label: 'دليل الحسابات' },
  { key: 'bank_accounts', label: 'إدارة الوكلاء' },
  { key: 'users', label: 'إدارة المستخدمين' },
  { key: 'settings', label: 'إعدادات البرنامج' },
];

// أقسام الصلاحيات (الأوبشنات)
export type PermissionCategoryKey = string;

// الصلاحيات الافتراضية لكل أوبشن من أوبشنات البرنامج (مع سجلات تدقيق نموذجية جاهزة)
const DEFAULT_PERMISSIONS: Record<string, PermissionRow[]> = {
  issue_transfer: [
    {
      id: 'op_issue_normal',
      name: 'إصدار حوالة صادرة للزبون',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: [
        {
          id: 'log-tr-1',
          entryNumber: 'TX-2026-0842',
          operationName: 'إصدار حوالة صادرة للزبون',
          modifiedBy: 'حسين علي (موظف حوالات)',
          userRole: 'موظف إصدار',
          timestamp: '2026-09-18 14:10:05',
          actionType: 'تعديل قيد',
          reason: 'تصحيح رقم هاتف المستلم واسم الوكيل الوسيط',
          ipAddress: '192.168.1.18',
          changes: [
            { field: 'اسم المستلم', before: 'كرار جاسم محمد', after: 'كرار جاسم محمد الخفاجي' },
            { field: 'العمولة المستقطعة', before: '$15.00', after: '$12.00' },
          ]
        }
      ]
    },
    {
      id: 'op_issue_agent_credit',
      name: 'شحن وتغذية رصيد الوكيل',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_issue_commission',
      name: 'قيد احتساب عمولة الحوالة الصادرة',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
  ],
  payout_transfer: [
    {
      id: 'op_payout_cash',
      name: 'تسلم حوالة وصرف نقدي للمستفيد',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: [
        {
          id: 'log-po-1',
          entryNumber: 'PO-2026-0312',
          operationName: 'تسلم حوالة وصرف نقدي للمستفيد',
          modifiedBy: 'مرتضى الكعبي (أمين صندوق)',
          userRole: 'صراف كاش',
          timestamp: '2026-09-18 12:30:40',
          actionType: 'تعديل قيد',
          reason: 'تحديث نوع إثبات الشخصية للمستفيد (البطاقة الوطنية)',
          ipAddress: '192.168.1.25',
          changes: [
            { field: 'رقم الإثبات', before: '19901234567', after: '19901234588' },
          ]
        }
      ]
    },
    {
      id: 'op_payout_deposit_client',
      name: 'إيداع الحوالة الواردة في حساب الزبون',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
  ],
  deposit_withdrawal: [
    {
      id: 'op_deposit_receipt',
      name: 'سند قبض نقدي (إيداع من عميل)',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: [
        {
          id: 'log-dep-1',
          entryNumber: 'CR-2026-1190',
          operationName: 'سند قبض نقدي (إيداع من عميل)',
          modifiedBy: 'حيدر الشمري (محاسب)',
          userRole: 'محاسب كاش',
          timestamp: '2026-09-18 11:20:04',
          actionType: 'تعديل قيد',
          reason: 'تعديل العملة من دينار إلى دولار بناء على استلام الكاش الفعلي',
          ipAddress: '192.168.1.35',
          changes: [
            { field: 'العملة المقبوضة', before: 'IQD (دينار عراقي)', after: 'USD (دولار أمريكي)' },
            { field: 'المبلغ المقبوض', before: '3,800,000 د.ع', after: '$2,500' },
          ]
        }
      ]
    },
    {
      id: 'op_withdrawal_disb',
      name: 'سند صرف نقدي (سحب لعميل)',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: [
        {
          id: 'log-with-1',
          entryNumber: 'CP-2026-0943',
          operationName: 'سند صرف نقدي (سحب لعميل)',
          modifiedBy: 'علي الموسوي (مدير مالي)',
          userRole: 'مشرف الصندوق',
          timestamp: '2026-09-17 15:40:12',
          actionType: 'إلغاء قيد',
          reason: 'إلغاء السند لوجود خطأ في رقم الحساب المطلوب الصرف منه',
          ipAddress: '192.168.1.14',
          changes: [
            { field: 'حالة السند', before: 'سند معتمد ومصروف 🟢', after: 'سند ملغى ومسترجع 🔴' },
          ]
        }
      ]
    },
  ],
  fund_transfer: [
    {
      id: 'op_fund_box_to_box',
      name: 'مناقلة نقدية بين الصناديق',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_fund_sweep_vault',
      name: 'توريد وتصفير النقد إلى الخزنة المركزية',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
  ],
  double_entry: [
    {
      id: 'op_journal_daily',
      name: 'قيد يومية مزدوج عام',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: [
        {
          id: 'log-jv-1',
          entryNumber: 'JV-2026-0842',
          operationName: 'قيد يومية مزدوج عام',
          modifiedBy: 'محمد الكاظمي',
          userRole: 'مدير الحسابات',
          timestamp: '2026-09-18 13:42:15',
          actionType: 'تعديل قيد',
          reason: 'تصحيح توجيه حساب المصروفات إلى مركز تكلفة الإدارة الرئيسية',
          ipAddress: '192.168.1.14',
          changes: [
            { field: 'المبلغ المدين', before: '1,500,000 د.ع', after: '1,850,000 د.ع' },
            { field: 'الحساب المدين', before: 'حساب مصروفات عمومية', after: 'حساب مصروفات الصيانة والتجهيز' },
          ]
        }
      ]
    },
    {
      id: 'op_journal_settlement',
      name: 'قيد تسوية وتعديل أرصدة',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_journal_closing',
      name: 'قيد إقفال الحسابات والمطابقة',
      createEntry: false,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
  ],
  transfers: [
    {
      id: 'op_query_transfers',
      name: 'استعلام وتدقيق حركات الحوالات',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_cancel_transfer',
      name: 'إلغاء قيد حوالة معلقة',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_edit_transfer_info',
      name: 'تعديل بيانات الحوالة والمستفيد',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
  ],
  statement: [
    {
      id: 'op_stmt_client',
      name: 'كشف حساب عميل / زبون',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_stmt_cashbox',
      name: 'كشف حركة الصندوق النقدي',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_stmt_general_ledger',
      name: 'كشف الأستاذ العام وميزان المراجعة',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
  ],
  accounts: [
    {
      id: 'op_acc_create_new',
      name: 'فتح حساب جديد في الدليل',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_acc_edit_details',
      name: 'تعديل بيانات الحساب والائتمان',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_acc_freeze',
      name: 'تجميد وتعطيل الحساب',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: false,
      logEntry: true,
      auditLogs: []
    },
  ],
  dashboard: [
    {
      id: 'op_dash_summary',
      name: 'لوحة التحكم والملخص المالي',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: false,
      auditLogs: []
    },
    {
      id: 'op_dash_rates',
      name: 'مؤشرات التداول وأسعار الصرف اليومية',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: false,
      auditLogs: []
    },
  ],
  users: [
    {
      id: 'op_users_groups',
      name: 'إدارة وتوصيف أقسام الشركة',
      createEntry: true,
      editEntry: true,
      deleteEntry: true,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_users_accounts',
      name: 'إدارة حسابات الموظفين وكلمات المرور',
      createEntry: true,
      editEntry: true,
      deleteEntry: true,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_users_permissions',
      name: 'تعديل مصفوفة الصلاحيات المحاسبية',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
  ],
  settings: [
    {
      id: 'op_settings_fx_rates',
      name: 'تحديث نشرة أسعار الصرف الرسمية',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_settings_backup',
      name: 'أخذ واسترجاع نسخة احتياطية للبيانات',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: false,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_settings_company_info',
      name: 'تعديل بيانات الشركة والترويسة',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
  ],
  exchange: [
    {
      id: 'op_exch_deal',
      name: 'تنفيذ حركة صرافة وشراء/بيع عملات',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    },
    {
      id: 'op_exch_rate_adj',
      name: 'تعديل أسعار الصرف ونسب الأرباح',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    }
  ],
  trial_balance: [
    {
      id: 'op_tb_view',
      name: 'عرض ميزان المراجعة وأرصدة الحسابات',
      createEntry: true,
      editEntry: false,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    }
  ],
  bank_accounts: [
    {
      id: 'op_agents_network',
      name: 'إدارة شبكة الوكلاء وتفاصيل الاتصال',
      createEntry: true,
      editEntry: true,
      deleteEntry: false,
      cancelEntry: false,
      printEntry: true,
      logEntry: true,
      auditLogs: []
    }
  ],
};

// مصفوفة الصلاحيات الكاملة التلقائية لنوع المستخدم (الادارة) - 100% كافة الصلاحيات مفعلة تلقائياً
export const ADMIN_FULL_PERMISSIONS: Record<PermissionCategoryKey, PermissionRow[]> = Object.fromEntries(
  Object.entries(DEFAULT_PERMISSIONS).map(([catKey, rows]) => [
    catKey as PermissionCategoryKey,
    rows.map(row => ({
      ...row,
      createEntry: true,
      editEntry: true,
      deleteEntry: true,
      cancelEntry: true,
      printEntry: true,
      logEntry: true,
    })),
  ])
) as Record<PermissionCategoryKey, PermissionRow[]>;

// فحص ما إذا كان نوع المستخدم أو المجموعة ينتمي للإدارة
export const checkIsAdminUserOrGroup = (
  userType?: string,
  groupName?: string,
  groupCode?: string
): boolean => {
  const t = (userType || '').trim().toLowerCase();
  const g = (groupName || '').trim().toLowerCase();
  const c = (groupCode || '').trim().toUpperCase();
  return (
    t === 'الادارة' ||
    t === 'الإدارة' ||
    t === 'مدير' ||
    t.includes('ادارة') ||
    t.includes('إدارة') ||
    t.includes('admin') ||
    g === 'الادارة' ||
    g === 'الإدارة' ||
    g.includes('ادارة') ||
    g.includes('إدارة') ||
    g.includes('admin') ||
    c === 'ADM' ||
    c.includes('ADMIN')
  );
};

// المجموعات الافتراضية - مفرغة للبدء بإضافة المجموعات من قبل المستخدم
const INITIAL_GROUPS: UserGroup[] = [];

// المستخدمين الافتراضيين - الحساب الإداري الأساسي للنظام
const INITIAL_USERS: UserItem[] = [
  {
    id: 'usr-admin-primary',
    username: 'admin',
    password: '123',
    fullName: 'محمد علي الباوي (مدير)',
    userType: 'مدير',
    branch: 'الفرع الرئيسي - بغداد',
    groupId: 'grp-admin',
    groupName: 'الادارة العامة',
    cashBox: '(جميع الكوى)',
    email: 'mualbawi92@gmail.com',
    phone: '07700000000',
    isActive: true,
    createdAt: '2026-01-01',
  },
];

export const WebUsersManagementScreen: React.FC<WebUsersManagementScreenProps> = ({
  companyName = '',
  onClose,
}) => {
  // التبويب النشط: "إدارة المستخدمين" أو "توصيف المجموعات" أو "إدارة الفروع" أو "أقسام الصلاحيات"
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'branches' | 'permissions'>('users');

  // القسم المحدد داخل أوبشنات الصلاحيات (أوبشنات البرنامج)
  const [selectedCategory, setSelectedCategory] = useState<PermissionCategoryKey>(PROGRAM_OPTIONS[0].key);

  // قائمة أوبشنات البرنامج (مشتقة تلقائياً من نظام الملاحة وأقسام البرنامج)
  const categoriesList = useMemo(() => [
    ...PROGRAM_OPTIONS,
  ], []);

  // قائمة المجموعات (الأقسام)
  const [groups, setGroups] = useState<UserGroup[]>(() => {
    const saved = localStorage.getItem('smart_ledger_user_groups_clean');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_GROUPS;
  });

  // قائمة المستخدمين
  const [users, setUsers] = useState<UserItem[]>(() => {
    const saved = localStorage.getItem('smart_ledger_users_list_clean');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_USERS;
  });

  // مسح أي بيانات تجريبية سابقة مخزنة لضمان فحص نظيف 100%
  useEffect(() => {
    localStorage.removeItem('smart_ledger_user_groups');
    localStorage.removeItem('smart_ledger_users_list');
  }, []);

  // الهدف المطبق عليه الصلاحيات: مجموعة أو مستخدم محدد
  const [permTargetType, setPermTargetType] = useState<'group' | 'user'>('group');
  const [selectedPermGroupId, setSelectedPermGroupId] = useState<string>(() => {
    return groups[0]?.id || '';
  });
  const [selectedPermUserId, setSelectedPermUserId] = useState<string>(() => {
    return users[0]?.id || '';
  });

  // تحديث القسم الافتراضي إذا تغيرت المجموعات
  useEffect(() => {
    if (groups.length > 0 && (!selectedPermGroupId || !groups.some(g => g.id === selectedPermGroupId))) {
      setSelectedPermGroupId(groups[0].id);
    }
  }, [groups, selectedPermGroupId]);

  // تخزين الصلاحيات للمجموعات والمستخدمين
  const [permissionsMap, setPermissionsMap] = useState<Record<string, Record<PermissionCategoryKey, PermissionRow[]>>>(() => {
    const saved = localStorage.getItem('smart_ledger_permissions_map');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  // قائمة الفروع المنشأة والمحفوظة
  const [branches, setBranches] = useState<BranchItem[]>(() => {
    try {
      const saved = localStorage.getItem('smart_ledger_branches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    const seeded: BranchItem[] = [];
    const seen = new Set<string>();
    const addSeed = (name?: string) => {
      const clean = (name || '').trim();
      if (!clean || seen.has(clean)) return;
      seen.add(clean);
      seeded.push({
        id: `br-seed-${seeded.length + 1}`,
        name: clean,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    };
    users.forEach(u => addSeed(u.branch));
    try {
      const savedAccs = localStorage.getItem('smart_ledger_accounts_data');
      if (savedAccs) {
        const accs = JSON.parse(savedAccs);
        if (Array.isArray(accs)) {
          accs.forEach((a: any) => {
            if (a && (a.type === 'cash_box' || a.type === 'vault') && a.city) {
              addSeed(a.city);
            }
          });
        }
      }
    } catch {
      // ignore
    }
    return seeded;
  });

  useEffect(() => {
    localStorage.setItem('smart_ledger_branches', JSON.stringify(branches));
  }, [branches]);

  // قائمة الفروع الموحدة للقائمة المنسدلة (الفروع المنشأة + أي فروع موجودة لدى المستخدمين أو الصناديق)
  const branchOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    const pushName = (val?: string) => {
      const clean = (val || '').trim();
      if (!clean || seen.has(clean)) return;
      seen.add(clean);
      list.push(clean);
    };
    branches.forEach(b => pushName(b.name));
    users.forEach(u => pushName(u.branch));
    try {
      const savedAccs = localStorage.getItem('smart_ledger_accounts_data');
      if (savedAccs) {
        const accs = JSON.parse(savedAccs);
        if (Array.isArray(accs)) {
          accs.forEach((a: any) => {
            if (a && (a.type === 'cash_box' || a.type === 'vault') && a.city) {
              pushName(a.city);
            }
          });
        }
      }
    } catch {
      // ignore
    }
    if (list.length === 0 && companyName?.trim()) {
      pushName(companyName);
    }
    return list;
  }, [branches, users, companyName]);

  // نوافذ المودال
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);

  // قائمة الصناديق النقدية المتاحة من دليل الحسابات
  const cashBoxOptions = useMemo(() => {
    const names = new Set<string>(['(جميع الكوى)']);
    try {
      const savedAccs = localStorage.getItem('smart_ledger_accounts_data');
      if (savedAccs) {
        const accs = JSON.parse(savedAccs);
        if (Array.isArray(accs)) {
          accs.forEach((a: any) => {
            if (a && a.type === 'cash_box' && a.name) {
              names.add(String(a.name).trim());
            }
          });
        }
      }
    } catch {
      // ignore
    }
    if (names.size === 1) {
      names.add('الصندوق الرئيسي');
    }
    return Array.from(names);
  }, [isUserModalOpen]);

  // حفظ في التخزين المحلي
  useEffect(() => {
    localStorage.setItem('smart_ledger_user_groups_clean', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('smart_ledger_users_list_clean', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('smart_ledger_permissions_map', JSON.stringify(permissionsMap));
  }, [permissionsMap]);

  // حقول الفلترة والبحث العلوية
  const [filterFullName, setFilterFullName] = useState<string>('');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // حقول نموذج المستخدم
  const [formDataFullName, setFormDataFullName] = useState('');
  const [formDataPassword, setFormDataPassword] = useState('');
  const [formDataBranch, setFormDataBranch] = useState('');
  const [formDataUserType, setFormDataUserType] = useState('مدير');
  const [formDataCashBox, setFormDataCashBox] = useState('(جميع الكوى)');
  const [formDataGroupId, setFormDataGroupId] = useState('');
  const [formDataPhone, setFormDataPhone] = useState('');
  const [formDataEmail, setFormDataEmail] = useState('');
  const [formDataIsActive, setFormDataIsActive] = useState(true);

  // حقول نموذج الفرع
  const [formBranchName, setFormBranchName] = useState('');
  const [formBranchAddress, setFormBranchAddress] = useState('');
  const [formBranchPhone, setFormBranchPhone] = useState('');

  // حقول نموذج المجموعة (توصيف المجموعات - مطابق للصورة المرفقة)
  const [formGroupName, setFormGroupName] = useState('');
  const [formGroupLatinName, setFormGroupLatinName] = useState('');
  const [formGroupType, setFormGroupType] = useState('المستخدم');
  const [formGroupCode, setFormGroupCode] = useState('');
  const [formGroupAccount, setFormGroupAccount] = useState('');
  const [formGroupDesc, setFormGroupDesc] = useState('');

  // رسالة إشعار مؤقتة
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // نافذة سجل القيد وتتبع التعديلات (منو عدل وشنو التعديل)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedAuditRow, setSelectedAuditRow] = useState<PermissionRow | null>(null);

  // حقول إضافة حركة تعديل تجريبية لسجل القيد
  const [testAuditUser, setTestAuditUser] = useState('حيدر الشمري (محاسب)');
  const [testAuditAction, setTestAuditAction] = useState<'تعديل قيد' | 'إلغاء قيد' | 'حذف قيد' | 'إنشاء قيد'>('تعديل قيد');
  const [testAuditReason, setTestAuditReason] = useState('تعديل المبلغ وسعر الصرف المعتمد');
  const [testAuditField, setTestAuditField] = useState('المبلغ المدين');
  const [testAuditBefore, setTestAuditBefore] = useState('1,500,000 د.ع');
  const [testAuditAfter, setTestAuditAfter] = useState('1,850,000 د.ع');

  // فتح نافذة مستخدم جديد
  const handleOpenNewUserModal = () => {
    setEditingUser(null);
    setFormDataFullName('');
    setFormDataPassword('');
    setFormDataBranch(branchOptions[0] || '');
    setFormDataUserType('مدير'); // الافتراضي: مدير مع كافة الصلاحيات تلقائياً
    setFormDataCashBox('(جميع الكوى)');
    setFormDataGroupId(groups[0]?.id || '');
    setFormDataPhone('');
    setFormDataEmail('');
    setFormDataIsActive(true);
    setIsUserModalOpen(true);
  };

  // فتح نافذة تعديل مستخدم
  const handleOpenEditUserModal = (user: UserItem) => {
    setEditingUser(user);
    setFormDataFullName(user.fullName);
    setFormDataPassword(user.password || '');
    setFormDataBranch(user.branch || branchOptions[0] || '');
    setFormDataUserType(user.userType);
    setFormDataCashBox(user.cashBox);
    setFormDataGroupId(user.groupId);
    setFormDataPhone(user.phone || '');
    setFormDataEmail(user.email || '');
    setFormDataIsActive(user.isActive);
    setIsUserModalOpen(true);
  };

  // حفظ المستخدم (إضافة أو تعديل): اسم المستخدم للدخول هو نفسه اسم الموظف
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFullName = formDataFullName.trim();
    if (!cleanFullName) return;
    if (!formDataBranch.trim()) {
      showToast('يرجى اختيار الفرع أو إضافة فرع جديد أولاً');
      return;
    }

    const selectedGrp = groups.find(g => g.id === formDataGroupId);
    const grpName = selectedGrp ? selectedGrp.name : 'بدون قسم';
    const isAdmin = checkIsAdminUserOrGroup(formDataUserType, grpName);

    if (editingUser) {
      // تعديل بيانات المستخدم
      setUsers(prev => prev.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            fullName: cleanFullName,
            username: u.id === 'usr-admin-primary' && u.username === 'admin' ? 'admin' : cleanFullName,
            password: formDataPassword.trim() ? formDataPassword.trim() : u.password,
            branch: formDataBranch.trim(),
            userType: formDataUserType,
            cashBox: formDataCashBox,
            groupId: formDataGroupId,
            groupName: grpName,
            phone: formDataPhone.trim(),
            email: formDataEmail.trim(),
            isActive: formDataIsActive,
          };
        }
        return u;
      }));

      // إذا كان المستخدم من نوع الإدارة، يتم تفعيل كافة الصلاحيات له تلقائياً
      if (isAdmin) {
        setPermissionsMap(prev => ({
          ...prev,
          [`usr_${editingUser.id}`]: JSON.parse(JSON.stringify(ADMIN_FULL_PERMISSIONS)),
        }));
      }

      showToast(isAdmin ? 'تم تحديث المستخدم مع تفعيل كافة صلاحيات الإدارة تلقائياً' : 'تم تحديث بيانات المستخدم بنجاح');
    } else {
      // إضافة جديد مع منح الإدارة كافة الصلاحيات تلقائياً أو وراثة صلاحيات القسم
      const newUserId = `usr-${Date.now()}`;
      const newUser: UserItem = {
        id: newUserId,
        fullName: cleanFullName,
        username: cleanFullName,
        password: formDataPassword.trim() || '123456',
        branch: formDataBranch.trim(),
        userType: formDataUserType,
        cashBox: formDataCashBox,
        groupId: formDataGroupId,
        groupName: grpName,
        phone: formDataPhone.trim(),
        email: formDataEmail.trim(),
        isActive: formDataIsActive,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setUsers(prev => [...prev, newUser]);

      // منح الصلاحيات تلقائياً: إذا كان نوع المستخدم هو الادارة يحصل على كافة الصلاحيات بنسبة 100%
      setPermissionsMap(prev => {
        const targetPerms = isAdmin
          ? ADMIN_FULL_PERMISSIONS
          : (prev[`grp_${formDataGroupId}`] || DEFAULT_PERMISSIONS);
        return {
          ...prev,
          [`usr_${newUserId}`]: JSON.parse(JSON.stringify(targetPerms)),
        };
      });

      if (isAdmin) {
        showToast(`تمت إضافة المستخدم بنجاح مع منحه كافة صلاحيات الإدارة الكاملة تلقائياً`);
      } else {
        showToast(`تمت إضافة المستخدم بنجاح وتوريث صلاحيات قسم "${grpName}" له تلقائياً`);
      }
    }

    setIsUserModalOpen(false);
  };

  // فتح نافذة فرع جديد / تعديل فرع
  const handleOpenNewBranchModal = () => {
    setEditingBranch(null);
    setFormBranchName('');
    setFormBranchAddress('');
    setFormBranchPhone('');
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranchModal = (branch: BranchItem) => {
    setEditingBranch(branch);
    setFormBranchName(branch.name);
    setFormBranchAddress(branch.address || '');
    setFormBranchPhone(branch.phone || '');
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formBranchName.trim();
    if (!cleanName) return;

    if (editingBranch) {
      const oldName = editingBranch.name;
      setBranches(prev => prev.map(b => b.id === editingBranch.id ? {
        ...b,
        name: cleanName,
        address: formBranchAddress.trim(),
        phone: formBranchPhone.trim(),
      } : b));
      if (oldName !== cleanName) {
        setUsers(prev => prev.map(u => u.branch === oldName ? { ...u, branch: cleanName } : u));
      }
      showToast('تم تعديل بيانات الفرع بنجاح');
    } else {
      const exists = branches.some(b => b.name.trim().toLowerCase() === cleanName.toLowerCase());
      if (!exists) {
        const newBr: BranchItem = {
          id: `br-${Date.now()}`,
          name: cleanName,
          address: formBranchAddress.trim(),
          phone: formBranchPhone.trim(),
          createdAt: new Date().toISOString().slice(0, 10),
        };
        setBranches(prev => [...prev, newBr]);
      }
      if (isUserModalOpen) {
        setFormDataBranch(cleanName);
      }
      showToast(`تمت إضافة الفرع "${cleanName}" بنجاح`);
    }
    setIsBranchModalOpen(false);
  };

  const handleDeleteBranch = (branch: BranchItem) => {
    if (window.confirm(`هل أنت متأكد من حذف الفرع: ${branch.name}؟`)) {
      setBranches(prev => prev.filter(b => b.id !== branch.id));
      showToast('تم حذف الفرع بنجاح');
    }
  };

  // حذف مستخدم
  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المستخدم: ${name}؟`)) {
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('تم حذف المستخدم بنجاح');
    }
  };

  // فتح نافذة مجموعة جديدة
  const handleOpenNewGroupModal = () => {
    setEditingGroup(null);
    setFormGroupName('');
    setFormGroupLatinName('');
    setFormGroupType('المستخدم');
    setFormGroupCode(`GRP-0${groups.length + 1}`);
    setFormGroupAccount('');
    setFormGroupDesc('');
    setIsGroupModalOpen(true);
  };

  // فتح نافذة تعديل مجموعة
  const handleOpenEditGroupModal = (group: UserGroup) => {
    setEditingGroup(group);
    setFormGroupName(group.name);
    setFormGroupLatinName(group.latinName || '');
    setFormGroupType(group.type || 'المستخدم');
    setFormGroupCode(group.code);
    setFormGroupAccount(group.departmentAccount || '');
    setFormGroupDesc(group.description || '');
    setIsGroupModalOpen(true);
  };

  // فتح شاشة صلاحيات القسم مباشرة
  const handleOpenGroupPermissions = (group: UserGroup) => {
    const isAdmGrp = checkIsAdminUserOrGroup(undefined, group.name, group.code);
    // تهيئة الصلاحيات إذا لم تكن موجودة
    if (!permissionsMap[`grp_${group.id}`]) {
      setPermissionsMap(prev => ({
        ...prev,
        [`grp_${group.id}`]: JSON.parse(JSON.stringify(isAdmGrp ? ADMIN_FULL_PERMISSIONS : DEFAULT_PERMISSIONS)),
      }));
    }
    setSelectedPermGroupId(group.id);
    setPermTargetType('group');
    setActiveTab('permissions');
    showToast(`تم فتح شاشة صلاحيات قسم: ${group.name} ${isAdmGrp ? '(الإدارة - كافة الصلاحيات مفعلة تلقائياً)' : ''}`);
  };

  // فتح شاشة صلاحيات موظف محدد مباشرة للتعديل الفردي
  const handleOpenUserPermissions = (user: UserItem) => {
    const isAdmin = checkIsAdminUserOrGroup(user.userType, user.groupName);
    // إذا لم تكن له صلاحيات مخصصة، للإدارة كافة الصلاحيات تلقائياً ولغيره ننسخ من قسمه
    if (!permissionsMap[`usr_${user.id}`]) {
      const targetPerms = isAdmin 
        ? ADMIN_FULL_PERMISSIONS 
        : (permissionsMap[`grp_${user.groupId}`] || DEFAULT_PERMISSIONS);
      setPermissionsMap(prev => ({
        ...prev,
        [`usr_${user.id}`]: JSON.parse(JSON.stringify(targetPerms)),
      }));
    }
    setSelectedPermUserId(user.id);
    setPermTargetType('user');
    setActiveTab('permissions');
    showToast(`تم فتح شاشة صلاحيات: ${user.fullName} ${isAdmin ? '(الإدارة - كافة الصلاحيات مفعلة تلقائياً)' : ''}`);
  };

  // حفظ المجموعة (إضافة أو تعديل)
  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGroupName.trim()) return;

    const isAdmGrp = checkIsAdminUserOrGroup(undefined, formGroupName, formGroupCode);

    if (editingGroup) {
      setGroups(prev => prev.map(g => {
        if (g.id === editingGroup.id) {
          return {
            ...g,
            name: formGroupName.trim(),
            latinName: formGroupLatinName.trim(),
            type: formGroupType,
            code: formGroupCode.trim() || g.code,
            departmentAccount: formGroupAccount.trim() || g.departmentAccount,
            description: formGroupDesc.trim() || g.description,
          };
        }
        return g;
      }));

      // تحديث اسم المجموعة في جدول المستخدمين إذا تغير
      setUsers(prev => prev.map(u => {
        if (u.groupId === editingGroup.id) {
          return { ...u, groupName: formGroupName.trim() };
        }
        return u;
      }));

      if (isAdmGrp) {
        setPermissionsMap(prev => ({
          ...prev,
          [`grp_${editingGroup.id}`]: JSON.parse(JSON.stringify(ADMIN_FULL_PERMISSIONS)),
        }));
      }

      showToast('تم تعديل بيانات المجموعة بنجاح');
    } else {
      const newGroupId = `grp-${Date.now()}`;
      const newGrp: UserGroup = {
        id: newGroupId,
        name: formGroupName.trim(),
        latinName: formGroupLatinName.trim(),
        type: formGroupType,
        code: formGroupCode.trim() || `GRP-0${groups.length + 1}`,
        departmentAccount: formGroupAccount.trim() || `حساب ${formGroupName.trim()}`,
        description: formGroupDesc.trim(),
        permissions: ['issue_transfers', 'payout_transfers', 'cash_in_out'],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setGroups(prev => [...prev, newGrp]);

      // تجهيز مصفوفة الصلاحيات (للإدارة كافة الصلاحيات مفعلة 100% تلقائياً)
      setPermissionsMap(prev => ({
        ...prev,
        [`grp_${newGroupId}`]: JSON.parse(JSON.stringify(isAdmGrp ? ADMIN_FULL_PERMISSIONS : DEFAULT_PERMISSIONS)),
      }));

      setSelectedPermGroupId(newGroupId);
      showToast(isAdmGrp ? 'تمت إضافة مجموعة الإدارة ومنحها كافة الصلاحيات تلقائياً' : 'تمت إضافة المجموعة بنجاح، وتجهيز صلاحياتها المعتمدة');
    }

    setIsGroupModalOpen(false);
  };

  // المفتاح الحالي للهدف (مجموعة أو مستخدم)
  const currentTargetKey = permTargetType === 'group' ? `grp_${selectedPermGroupId}` : `usr_${selectedPermUserId}`;

  // فحص ما إذا كان الهدف المختار في شاشة الصلاحيات هو الادارة
  const isTargetAdmin = useMemo(() => {
    if (permTargetType === 'user') {
      const u = users.find(user => user.id === selectedPermUserId);
      if (!u) return false;
      return checkIsAdminUserOrGroup(u.userType, u.groupName);
    } else {
      const g = groups.find(grp => grp.id === selectedPermGroupId);
      if (!g) return false;
      return checkIsAdminUserOrGroup(undefined, g.name, g.code);
    }
  }, [permTargetType, selectedPermUserId, selectedPermGroupId, users, groups]);

  // تحضير القيود المعروضة حسب الأوبشن المحدد
  interface DisplayedPermissionItem {
    categoryKey: string;
    categoryLabel: string;
    row: PermissionRow;
  }

  const displayedPermissionItems: DisplayedPermissionItem[] = useMemo(() => {
    const opt = PROGRAM_OPTIONS.find(o => o.key === selectedCategory);
    const label = opt ? opt.label : selectedCategory;
    const defaultRows = isTargetAdmin ? ADMIN_FULL_PERMISSIONS[selectedCategory] : DEFAULT_PERMISSIONS[selectedCategory];
    const savedRows = permissionsMap[currentTargetKey]?.[selectedCategory];
    const rows = savedRows || defaultRows || [];
    return rows.map(row => ({
      categoryKey: selectedCategory,
      categoryLabel: label,
      row: isTargetAdmin && !savedRows
        ? { ...row, createEntry: true, editEntry: true, deleteEntry: true, cancelEntry: true, printEntry: true, logEntry: true }
        : row,
    }));
  }, [selectedCategory, currentTargetKey, permissionsMap, isTargetAdmin]);

  // تبديل صلاحية معينة من الصلاحيات الست المعتمدة
  const handleTogglePermission = (
    categoryKey: string,
    rowId: string, 
    field: 'createEntry' | 'editEntry' | 'deleteEntry' | 'cancelEntry' | 'printEntry' | 'logEntry'
  ) => {
    setPermissionsMap(prev => {
      const defaultToUse = isTargetAdmin ? ADMIN_FULL_PERMISSIONS : DEFAULT_PERMISSIONS;
      const targetObj = prev[currentTargetKey] ? JSON.parse(JSON.stringify(prev[currentTargetKey])) : JSON.parse(JSON.stringify(defaultToUse));
      const categoryRows = targetObj[categoryKey] ? [...targetObj[categoryKey]] : [...(defaultToUse[categoryKey] || [])];
      
      const updatedRows = categoryRows.map(row => {
        if (row.id === rowId) {
          return { ...row, [field]: !row[field] };
        }
        return row;
      });

      return {
        ...prev,
        [currentTargetKey]: {
          ...targetObj,
          [categoryKey]: updatedRows,
        }
      };
    });
  };

  // تعيين كل الصلاحيات في القسم الحالي إلى نعم أو لا
  const handleSetAllCurrentCategory = (value: boolean) => {
    setPermissionsMap(prev => {
      const defaultToUse = isTargetAdmin ? ADMIN_FULL_PERMISSIONS : DEFAULT_PERMISSIONS;
      const targetObj = prev[currentTargetKey] ? JSON.parse(JSON.stringify(prev[currentTargetKey])) : JSON.parse(JSON.stringify(defaultToUse));
      const categoryRows = targetObj[selectedCategory] ? [...targetObj[selectedCategory]] : [...(defaultToUse[selectedCategory] || [])];
      
      const updatedRows = categoryRows.map(row => ({
        ...row,
        createEntry: value,
        editEntry: value,
        deleteEntry: value,
        cancelEntry: value,
        printEntry: value,
        logEntry: value,
      }));

      return {
        ...prev,
        [currentTargetKey]: {
          ...targetObj,
          [selectedCategory]: updatedRows,
        }
      };
    });
    showToast(value ? 'تم تفعيل كافة الصلاحيات (نعم)' : 'تم حظر وتعطيل كافة الصلاحيات (لا)');
  };

  // استعادة الصلاحيات الافتراضية
  const handleResetCurrentPermissions = () => {
    setPermissionsMap(prev => {
      const defaultToUse = isTargetAdmin ? ADMIN_FULL_PERMISSIONS : DEFAULT_PERMISSIONS;
      const targetObj = prev[currentTargetKey] ? JSON.parse(JSON.stringify(prev[currentTargetKey])) : JSON.parse(JSON.stringify(defaultToUse));
      
      return {
        ...prev,
        [currentTargetKey]: {
          ...targetObj,
          [selectedCategory]: JSON.parse(JSON.stringify(defaultToUse[selectedCategory] || [])),
        }
      };
    });
    showToast(isTargetAdmin ? 'تمت استعادة الصلاحيات الكاملة للإدارة تلقائياً (100% نعم)' : 'تمت استعادة الصلاحيات الافتراضية');
  };

  // حفظ واعتماد الصلاحيات
  const handleSavePermissions = () => {
    localStorage.setItem('smart_ledger_permissions_map', JSON.stringify(permissionsMap));
    window.dispatchEvent(new Event('smart_ledger_permissions_updated'));
    showToast('تم حفظ واعتماد مصفوفة الصلاحيات بنجاح');
  };

  // تفريغ كافة البيانات للبدء بفحص جديد
  const handleClearAllData = () => {
    if (window.confirm('هل أنت متأكد من تفريغ كافة البيانات؟ سيتم مسح المجموعات والمستخدمين وإعادة ضبط الصلاحيات لإجراء الفحص النظيف.')) {
      setGroups([]);
      setUsers([]);
      setPermissionsMap({});
      localStorage.removeItem('smart_ledger_user_groups_clean');
      localStorage.removeItem('smart_ledger_users_list_clean');
      localStorage.removeItem('smart_ledger_permissions_map');
      localStorage.removeItem('smart_ledger_user_groups');
      localStorage.removeItem('smart_ledger_users_list');
      showToast('تم تفريغ كافة البيانات بنجاح، يمكنك الآن إضافة المجموعات والمستخدمين للفحص.');
    }
  };

  // فتح سجل القيد وتتبع التعديلات (منو عدل وشنو التعديل)
  const handleOpenAuditModal = (row: PermissionRow) => {
    setSelectedAuditRow(row);
    setIsAuditModalOpen(true);
  };

  // إضافة حركة تعديل تجريبية لسجل القيد
  const handleAddTestAuditRecord = () => {
    if (!selectedAuditRow) return;

    const newRecord: EntryAuditRecord = {
      id: `audit-${Date.now()}`,
      entryNumber: `JV-${Math.floor(1000 + Math.random() * 9000)}`,
      operationName: selectedAuditRow.name,
      modifiedBy: testAuditUser || 'المستخدم الحالي',
      userRole: 'مشرف حسابات',
      timestamp: new Date().toLocaleString('ar-IQ'),
      actionType: testAuditAction,
      reason: testAuditReason || 'تعديل وتدقيق محاسبي مباشر',
      ipAddress: '192.168.1.10',
      changes: [
        {
          field: testAuditField || 'المبلغ',
          before: testAuditBefore || '0',
          after: testAuditAfter || '0',
        }
      ]
    };

    // تحديث السجل في الصف
    const updatedAuditLogs = [newRecord, ...(selectedAuditRow.auditLogs || [])];
    const updatedSelectedRow = { ...selectedAuditRow, auditLogs: updatedAuditLogs };
    setSelectedAuditRow(updatedSelectedRow);

    // تحديثه في permissionsMap
    setPermissionsMap(prev => {
      const targetObj = prev[currentTargetKey] ? JSON.parse(JSON.stringify(prev[currentTargetKey])) : JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
      const categoryRows = targetObj[selectedCategory] ? [...targetObj[selectedCategory]] : [...(DEFAULT_PERMISSIONS[selectedCategory] || [])];
      
      const updatedRows = categoryRows.map(r => {
        if (r.id === selectedAuditRow.id) {
          return updatedSelectedRow;
        }
        return r;
      });

      return {
        ...prev,
        [currentTargetKey]: {
          ...targetObj,
          [selectedCategory]: updatedRows,
        }
      };
    });

    showToast('تم توثيق حركة التعديل في سجل القيد بنجاح');
  };

  // تصفية المستخدمين بناءً على الحقول العلوية
  const filteredUsers = users.filter(user => {
    const matchName = !filterFullName || user.fullName.toLowerCase().includes(filterFullName.toLowerCase());
    const matchBranch = !filterBranch || filterBranch === 'all' || user.branch === filterBranch;
    const matchGroup = !filterGroup || filterGroup === 'all' || user.groupName === filterGroup;
    return matchName && matchBranch && matchGroup;
  });

  // دعم اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isBranchModalOpen) {
          setIsBranchModalOpen(false);
        } else if (isAuditModalOpen) {
          setIsAuditModalOpen(false);
        } else if (isGroupModalOpen) {
          setIsGroupModalOpen(false);
        } else if (isUserModalOpen) {
          setIsUserModalOpen(false);
        } else if (onClose) {
          onClose();
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (activeTab === 'groups') {
          handleOpenNewGroupModal();
        } else if (activeTab === 'branches') {
          handleOpenNewBranchModal();
        } else {
          handleOpenNewUserModal();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        setFilterFullName('');
        setFilterBranch('all');
        setFilterGroup('all');
      } else if (e.key === 'F6') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isUserModalOpen, isGroupModalOpen, isBranchModalOpen, isAuditModalOpen, activeTab]);

  return (
    <div className="p-4 sm:p-6 space-y-4 w-full max-w-full mx-auto font-sans" dir="rtl">

      {/* التنبيه المنبثق */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 p-3 bg-[#0284c7] text-white rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-200" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. ترويسة الشاشة المتناسقة باللون الأزرق السماوي المتدرج */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3.5 rounded-2xl shadow-sm flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-sky-200 border border-white/20 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide">إدارة المستخدمين والصلاحيات</h1>
            <p className="text-[11px] text-sky-100/90 font-medium">
              توصيف المجموعات • إدارة حسابات المستخدمين • مصفوفة الصلاحيات المتقدمة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs px-3 py-1 rounded-xl font-bold">
            {users.length} مستخدم
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
              title="إغلاق (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. ترويسة التبويبات العلوية */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer rounded-xl ${
              activeTab === 'users'
                ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            إدارة المستخدمين
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer rounded-xl ${
              activeTab === 'groups'
                ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            توصيف المجموعات
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer rounded-xl ${
              activeTab === 'branches'
                ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            إدارة الفروع ({branches.length})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer rounded-xl ${
              activeTab === 'permissions'
                ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            أقسام الصلاحيات
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearAllData}
            title="تفريغ كافة المستخدمين والمجموعات لإعادة الفحص النظيف"
            className="text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تفريغ البيانات للفحص</span>
          </button>
        </div>
      </div>

      {/* المحتوى بحسب التبويب النشط */}
      {activeTab === 'users' ? (
        <div className="space-y-4">
          
          {/* شريط الفلاتر والبحث */}
          <div className="bg-slate-50/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              {/* الحقل 1 (أقصى اليمين): الاسم الكامل */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الموظف / المستخدم</label>
                <input
                  type="text"
                  value={filterFullName}
                  onChange={(e) => setFilterFullName(e.target.value)}
                  placeholder="بحث باسم الموظف..."
                  className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>

              {/* الحقل 2 (الوسط): الفرع */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">الفرع</label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500 shadow-inner cursor-pointer"
                >
                  <option value="all">جميع الفروع</option>
                  {branchOptions.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* الحقل 3 (اليسار): المجموعة */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">المجموعة</label>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fffef0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500 shadow-inner cursor-pointer"
                >
                  <option value="all">جميع المجموعات</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* زر إضافة مستخدم سريع */}
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleOpenNewUserModal}
                className="px-4 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4 text-sky-200" />
                <span>مستخدم جديد .F2</span>
              </button>
            </div>
          </div>

          {/* جدول المستخدمين المطابق تماماً للصورة المرفقة */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                
                {/* ترويسة الجدول باللون الأزرق الموحد مع أسهم لأسفل ↓ */}
                <thead>
                  <tr className="bg-[#0284c7] text-white font-bold h-9">
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-36">
                      <span className="flex items-center justify-center gap-1">
                        <span>↓</span>
                        <span>اسم المستخدم</span>
                      </span>
                    </th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center">
                      <span className="flex items-center justify-center gap-1">
                        <span>↓</span>
                        <span>الفرع</span>
                      </span>
                    </th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-28">
                      <span className="flex items-center justify-center gap-1">
                        <span>↓</span>
                        <span>النوع</span>
                      </span>
                    </th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-36">
                      <span className="flex items-center justify-center gap-1">
                        <span>↓</span>
                        <span>الصندوق</span>
                      </span>
                    </th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-28">
                      <span className="flex items-center justify-center gap-1">
                        <span>↓</span>
                        <span>الحالة</span>
                      </span>
                    </th>
                    <th className="px-4 py-2 text-center w-24">
                      <span className="flex items-center justify-center gap-1">
                        <span>↓</span>
                        <span>العمليات</span>
                      </span>
                    </th>
                  </tr>
                </thead>

                {/* أسطر الجدول */}
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        لا يوجد مستخدمين مطابقين لمعايير البحث المحددة
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-slate-50/80 transition-colors h-10 text-slate-800"
                      >
                        {/* 1. اسم المستخدم */}
                        <td className="px-4 py-2 border-l border-slate-200 font-bold text-center">
                          {user.fullName}
                        </td>

                        {/* 2. الفرع */}
                        <td className="px-4 py-2 border-l border-slate-200 text-center text-slate-700">
                          {user.branch}
                        </td>

                        {/* 3. النوع */}
                        <td className="px-4 py-2 border-l border-slate-200 text-center font-medium">
                          {checkIsAdminUserOrGroup(user.userType, user.groupName) ? (
                            <span 
                              className="inline-flex items-center gap-1 bg-emerald-50 text-[#0b5a49] border border-emerald-300 px-2 py-0.5 rounded-full text-xs font-bold"
                              title="نوع المستخدم (الادارة) يمتلك كافة صلاحيات النظام تلقائياً بدون الحاجة لتخصيص يدوي"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{user.userType} (كافة الصلاحيات تلقائياً)</span>
                            </span>
                          ) : (
                            <span className="text-slate-800">{user.userType}</span>
                          )}
                        </td>

                        {/* 4. الصندوق */}
                        <td className="px-4 py-2 border-l border-slate-200 text-center text-slate-600 font-medium">
                          {user.cashBox}
                        </td>

                        {/* 5. الحالة: فعال مع نقطة خضراء */}
                        <td className="px-4 py-2 border-l border-slate-200 text-center">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                              <span>فعال</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
                              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                              <span>معطل</span>
                            </span>
                          )}
                        </td>

                        {/* 6. العمليات: زر تعديل القلم وزر الصلاحيات وزر الحذف */}
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setPermTargetType('user');
                                setSelectedPermUserId(user.id);
                                setActiveTab('permissions');
                              }}
                              className="w-7 h-7 border border-emerald-600 rounded bg-white hover:bg-emerald-50 text-emerald-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="صلاحيات المستخدم"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditUserModal(user)}
                              className="w-7 h-7 border border-[#0b5a49] rounded bg-white hover:bg-emerald-50 text-[#0b5a49] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="تعديل بيانات المستخدم"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#0b5a49]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id, user.fullName)}
                              className="w-7 h-7 border border-rose-300 rounded bg-white hover:bg-rose-50 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                              title="حذف المستخدم"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>

            {/* شريط الإحصائية السفلي */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
              <span>إجمالي المستخدمين المعروضين: <strong className="text-slate-900">{filteredUsers.length}</strong></span>
              <span>المجموعة المحددة: <strong className="text-[#0b5a49]">{filterGroup === 'all' ? 'كافة المجموعات' : filterGroup}</strong></span>
            </div>
          </div>

        </div>
      ) : activeTab === 'groups' ? (
        /* تبويب: توصيف المجموعات - مطابق بنسبة 100% للصورة المرفقة */
        <div className="space-y-3">
          
          {/* شريط الإجراءات والمسار العريض */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span>أدوات</span>
              <span className="text-slate-400">/</span>
              <span>إدارة المستخدمين</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-bold">توصيف المجموعات</span>
            </div>

            {/* زر إضافة مجموعة - مطابق لتصميم الصورة المرفقة */}
            <button
              type="button"
              onClick={handleOpenNewGroupModal}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>اضافة مجموعة</span>
            </button>
          </div>

          {/* جدول توصيف المجموعات */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                
                {/* ترويسة الجدول: زرقاء موحدة #0284c7 بنصوص بيضاء وأسهم ↓ */}
                <thead>
                  <tr className="bg-[#0284c7] text-white font-bold h-9 select-none">
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-1/4">
                      <span className="inline-flex items-center justify-center gap-1">
                        <span className="text-[10px]">↓</span>
                        <span>الاسم</span>
                      </span>
                    </th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-1/4">
                      <span className="inline-flex items-center justify-center gap-1">
                        <span className="text-[10px]">↓</span>
                        <span>الاسم اللاتيني</span>
                      </span>
                    </th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-1/4">
                      <span className="inline-flex items-center justify-center gap-1">
                        <span className="text-[10px]">↓</span>
                        <span>النوع</span>
                      </span>
                    </th>
                    <th className="px-4 py-2 text-center w-1/4">
                      <span className="inline-flex items-center justify-center gap-1">
                        <span className="text-[10px]">↓</span>
                        <span>العمليات</span>
                      </span>
                    </th>
                  </tr>
                </thead>

                {/* أسطر المجموعات */}
                <tbody className="divide-y divide-slate-200">
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-500 bg-slate-50/50">
                        <p className="font-bold text-slate-700 text-xs">لا توجد مجموعات مضافة</p>
                        <p className="text-[11px] text-slate-500 mt-1">اضغط على زر "اضافة مجموعة" لإنشاء أول مجموعة</p>
                      </td>
                    </tr>
                  ) : (
                    groups.map(group => (
                      <tr key={group.id} className="hover:bg-slate-50/80 transition-colors h-11">
                        
                        {/* 1. الاسم */}
                        <td className="px-4 py-2 border-l border-slate-200 text-center font-bold text-slate-800">
                          {group.name}
                        </td>

                        {/* 2. الاسم اللاتيني */}
                        <td className="px-4 py-2 border-l border-slate-200 text-center text-slate-600 font-sans">
                          {group.latinName || ''}
                        </td>

                        {/* 3. النوع */}
                        <td className="px-4 py-2 border-l border-slate-200 text-center font-medium text-slate-800">
                          {group.type || 'المستخدم'}
                        </td>

                        {/* 4. العمليات: زر تعديل قلم + زر صلاحيات بالإطار الذهبي + زر حذف */}
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* زر تعديل (قلم في مربع أبيض بإطار خفيف) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditGroupModal(group)}
                              className="w-7 h-7 border border-slate-300 rounded bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="تعديل"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            {/* زر صلاحيات (إطار ذهبي مطابق للصورة المرفقة) */}
                            <button
                              type="button"
                              onClick={() => handleOpenGroupPermissions(group)}
                              className="px-2.5 py-1 border border-[#c49a45] bg-[#fcfaf5] hover:bg-[#f6f0df] text-[#8c651e] rounded flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                              title="صلاحيات"
                            >
                              <Key className="w-3.5 h-3.5 text-[#b5893a]" />
                              <span>صلاحيات</span>
                            </button>

                            {/* زر حذف اختياري للحذف عند الحاجة */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف مجموعة: ${group.name}؟`)) {
                                  setGroups(prev => prev.filter(g => g.id !== group.id));
                                  showToast('تم حذف المجموعة بنجاح');
                                }
                              }}
                              className="w-7 h-7 border border-rose-200 rounded bg-white hover:bg-rose-50 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>

            {/* شريط الإحصائية السفلي */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
              <span>إجمالي المجموعات المعروضة: <strong className="text-slate-900">{groups.length}</strong></span>
              <span>النظام: <strong className="text-[#0b4d3c]">إدارة وتوصيف المجموعات</strong></span>
            </div>
          </div>

        </div>
      ) : activeTab === 'branches' ? (
        /* تبويب: إدارة الفروع */
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span>أدوات</span>
              <span className="text-slate-400">/</span>
              <span>إدارة المستخدمين</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-bold">إدارة الفروع</span>
            </div>

            <button
              type="button"
              onClick={handleOpenNewBranchModal}
              className="px-4 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-sky-200" />
              <span>إضافة فرع جديد</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0284c7] text-white font-bold h-9 select-none">
                    <th className="px-4 py-2 border-l border-sky-600 text-center">اسم الفرع</th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center">العنوان / المدينة</th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-36">رقم الهاتف</th>
                    <th className="px-4 py-2 border-l border-sky-600 text-center w-28">عدد الموظفين</th>
                    <th className="px-4 py-2 text-center w-28">العمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 bg-slate-50/50">
                        <p className="font-bold text-slate-700 text-xs">لا توجد فروع مضافة حالياً</p>
                        <p className="text-[11px] text-slate-500 mt-1">اضغط على زر «إضافة فرع جديد» لإضافة فروع الشركة</p>
                      </td>
                    </tr>
                  ) : (
                    branches.map(branch => {
                      const empCount = users.filter(u => u.branch === branch.name).length;
                      return (
                        <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors h-11">
                          <td className="px-4 py-2 border-l border-slate-200 font-bold text-slate-900">
                            {branch.name}
                          </td>
                          <td className="px-4 py-2 border-l border-slate-200 text-slate-600">
                            {branch.address || '-'}
                          </td>
                          <td className="px-4 py-2 border-l border-slate-200 font-mono text-slate-600" dir="ltr">
                            {branch.phone || '-'}
                          </td>
                          <td className="px-4 py-2 border-l border-slate-200 font-bold text-[#0284c7]">
                            {empCount}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditBranchModal(branch)}
                                className="w-7 h-7 border border-slate-300 rounded bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                title="تعديل الفرع"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBranch(branch)}
                                className="w-7 h-7 border border-rose-200 rounded bg-white hover:bg-rose-50 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                                title="حذف الفرع"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
              <span>إجمالي الفروع: <strong className="text-slate-900">{branches.length}</strong></span>
              <span>تظهر هذه الفروع مباشرة في قائمة اختيار الفرع عند إضافة المستخدمين وتسجيل الدخول</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* تبويب: أقسام الصلاحيات (مطابق 100% لتصميم النظام والصورة المرفقة) */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          
          {/* شريط الإجراءات والتحكم بأقسام الصلاحيات */}
          <div className="bg-[#fcfdfd] border border-slate-300 p-3.5 rounded shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            
            {/* اختيار الهدف: مجموعة أو مستخدم */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#0b5a49]" />
                <span>تخصيص الصلاحيات لـ:</span>
              </span>

              {/* أزرار التبديل بين مجموعة ومستخدم */}
              <div className="inline-flex rounded border border-slate-300 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setPermTargetType('group')}
                  className={`px-3 py-1 font-bold rounded-xs cursor-pointer transition-colors ${
                    permTargetType === 'group'
                      ? 'bg-white text-[#0b5a49] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مجموعة / قسم
                </button>
                <button
                  type="button"
                  onClick={() => setPermTargetType('user')}
                  className={`px-3 py-1 font-bold rounded-xs cursor-pointer transition-colors ${
                    permTargetType === 'user'
                      ? 'bg-white text-[#0b5a49] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مستخدم محدد
                </button>
              </div>

              {/* القائمة المنسدلة للهدف المختار */}
              {permTargetType === 'group' ? (
                <select
                  value={selectedPermGroupId}
                  onChange={(e) => setSelectedPermGroupId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold focus:outline-none focus:border-[#0b5a49] cursor-pointer"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>مجموعة: {g.name} ({g.code})</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedPermUserId}
                  onChange={(e) => setSelectedPermUserId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold focus:outline-none focus:border-[#0b5a49] cursor-pointer"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>المستخدم: {u.fullName} - {u.userType} ({u.groupName})</option>
                  ))}
                </select>
              )}
            </div>

            {/* أزرار التحكم السريع: منح الكل، حظر الكل، استعادة، حفظ */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetAllCurrentCategory(true)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0b5a49] border border-emerald-300 rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تفعيل كافة الصلاحيات في هذا القسم (نعم)"
              >
                <Check className="w-3.5 h-3.5" />
                <span>منح الكل (نعم)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetAllCurrentCategory(false)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تعطيل كافة الصلاحيات في هذا القسم (لا)"
              >
                <X className="w-3.5 h-3.5" />
                <span>حظر الكل (لا)</span>
              </button>

              <button
                type="button"
                onClick={handleResetCurrentPermissions}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="استعادة الصلاحيات الافتراضية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>افتراضي</span>
              </button>

              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-4 py-1.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ الصلاحيات</span>
              </button>
            </div>

          </div>

          {/* تنبيه إشعار نوع المستخدم (الادارة) - كافة الصلاحيات مفعلة تلقائياً */}
          {isTargetAdmin && (
            <div className="bg-emerald-50 border border-emerald-300 text-[#0b5a49] rounded px-4 py-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  نوع المستخدم ({permTargetType === 'user' ? (users.find(u => u.id === selectedPermUserId)?.userType || 'الادارة') : 'مجموعة الادارة'}) يمتلك كافة الصلاحيات تلقائياً بدون الحاجة لتخصيص يدوي.
                </span>
              </div>
              <span className="text-xs bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded shadow-2xs">
                كافة الصلاحيات نشطة (100%)
              </span>
            </div>
          )}

          {/* العرض الرئيسي المطابق بنسبة 100% للصورة المرفقة مع الصلاحيات المحاسبية المطلوبة */}
          <div className="flex flex-col lg:flex-row items-start gap-4">
            
            {/* جدول مصفوفة الصلاحيات (على اليسار في الصورة وبالمحتوى الرئيسي) */}
            <div className="flex-1 w-full border border-slate-300 rounded-sm overflow-hidden bg-white shadow-xs">
              
              {/* شريط علوي صغير لتوضيح الأوبشن الحالي وإحصائياته */}
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs">الأوبشن الحالي:</span>
                  <span className="bg-[#0b5a49] text-white px-2.5 py-0.5 rounded text-xs font-bold">
                    {categoriesList.find(c => c.key === selectedCategory)?.label || selectedCategory}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    ({displayedPermissionItems.length} عمليات / قيود)
                  </span>
                </div>

                <span className="text-[11px] text-slate-600 font-medium">
                  {permTargetType === 'group' 
                    ? `تعديل صلاحيات قسم: ${groups.find(g => g.id === selectedPermGroupId)?.name || ''}` 
                    : `تعديل صلاحيات مستخدم: ${users.find(u => u.id === selectedPermUserId)?.fullName || ''}`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  
                  {/* ترويسة الجدول بالأخضر الداكن وأسهم لأسفل ↓ مطابقة للأوبشنات المطلوبة */}
                  <thead>
                    <tr className="bg-[#0b5a49] text-white font-bold h-10">
                      <th className="px-4 py-2 border-l border-emerald-800 text-center min-w-[170px]">
                        <span className="flex items-center justify-center gap-1">
                          <span>↓</span>
                          <span>اسم القيد / العملية</span>
                        </span>
                      </th>
                      <th className="px-2 py-2 border-l border-emerald-800 text-center w-16" title="إدخال وعمل القيد المحاسبي">
                        <span className="flex flex-col items-center justify-center">
                          <span>↓</span>
                          <span className="text-[11px] leading-tight">عمل القيد</span>
                        </span>
                      </th>
                      <th className="px-2 py-2 border-l border-emerald-800 text-center w-16" title="تعديل القيد المحاسبي">
                        <span className="flex flex-col items-center justify-center">
                          <span>↓</span>
                          <span className="text-[11px] leading-tight">تعديل القيد</span>
                        </span>
                      </th>
                      <th className="px-2 py-2 border-l border-emerald-800 text-center w-16" title="حذف القيد المحاسبي">
                        <span className="flex flex-col items-center justify-center">
                          <span>↓</span>
                          <span className="text-[11px] leading-tight">حذف القيد</span>
                        </span>
                      </th>
                      <th className="px-2 py-2 border-l border-emerald-800 text-center w-16" title="إلغاء القيد المحاسبي">
                        <span className="flex flex-col items-center justify-center">
                          <span>↓</span>
                          <span className="text-[11px] leading-tight">إلغاء القيد</span>
                        </span>
                      </th>
                      <th className="px-2 py-2 border-l border-emerald-800 text-center w-16" title="طباعة سند القيد">
                        <span className="flex flex-col items-center justify-center">
                          <span>↓</span>
                          <span className="text-[11px] leading-tight">طباعة القيد</span>
                        </span>
                      </th>
                      <th className="px-2 py-2 text-center w-16" title="صلاحية سجل القيد وتتبع التعديلات">
                        <span className="flex flex-col items-center justify-center">
                          <span>↓</span>
                          <span className="text-[11px] leading-tight">سجل القيد</span>
                        </span>
                      </th>
                    </tr>
                  </thead>

                  {/* أسطر العمليات والقيود */}
                  <tbody className="divide-y divide-slate-200">
                    {displayedPermissionItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                          لا توجد قيود أو عمليات معرفة في هذا الأوبشن حالياً.
                        </td>
                      </tr>
                    ) : (
                      displayedPermissionItems.map(({ categoryKey, row }) => (
                        <tr key={`${categoryKey}-${row.id}`} className="hover:bg-slate-50/70 transition-colors h-11">
                          
                          {/* 1. اسم العملية أو القيد */}
                          <td className="px-4 py-2 border-l border-slate-200 font-bold text-slate-800">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-900">{row.name}</span>
                              {row.auditLogs && row.auditLogs.length > 0 && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold" title="عدد حركات التعديل المسجلة">
                                  {row.auditLogs.length} تعديل
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. عمل القيد (إدخال القيد) */}
                          <td className="px-1.5 py-1.5 border-l border-slate-200 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(categoryKey, row.id, 'createEntry')}
                              className={`font-bold text-xs w-11 h-7 rounded-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs mx-auto ${
                                row.createEntry 
                                  ? 'bg-[#0b5a49] hover:bg-[#084538] text-white' 
                                  : 'bg-[#7a2228] hover:bg-[#681c21] text-white'
                              }`}
                              title={`عمل القيد: ${row.createEntry ? 'مسموح (نعم)' : 'محظور (لا)'}`}
                            >
                              {row.createEntry ? 'نعم' : 'لا'}
                            </button>
                          </td>

                          {/* 3. تعديل القيد */}
                          <td className="px-1.5 py-1.5 border-l border-slate-200 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(categoryKey, row.id, 'editEntry')}
                              className={`font-bold text-xs w-11 h-7 rounded-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs mx-auto ${
                                row.editEntry 
                                  ? 'bg-[#0b5a49] hover:bg-[#084538] text-white' 
                                  : 'bg-[#7a2228] hover:bg-[#681c21] text-white'
                              }`}
                              title={`تعديل القيد: ${row.editEntry ? 'مسموح (نعم)' : 'محظور (لا)'}`}
                            >
                              {row.editEntry ? 'نعم' : 'لا'}
                            </button>
                          </td>

                          {/* 4. حذف القيد */}
                          <td className="px-1.5 py-1.5 border-l border-slate-200 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(categoryKey, row.id, 'deleteEntry')}
                              className={`font-bold text-xs w-11 h-7 rounded-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs mx-auto ${
                                row.deleteEntry 
                                  ? 'bg-[#0b5a49] hover:bg-[#084538] text-white' 
                                  : 'bg-[#7a2228] hover:bg-[#681c21] text-white'
                              }`}
                              title={`حذف القيد: ${row.deleteEntry ? 'مسموح (نعم)' : 'محظور (لا)'}`}
                            >
                              {row.deleteEntry ? 'نعم' : 'لا'}
                            </button>
                          </td>

                          {/* 5. إلغاء القيد */}
                          <td className="px-1.5 py-1.5 border-l border-slate-200 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(categoryKey, row.id, 'cancelEntry')}
                              className={`font-bold text-xs w-11 h-7 rounded-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs mx-auto ${
                                row.cancelEntry 
                                  ? 'bg-[#0b5a49] hover:bg-[#084538] text-white' 
                                  : 'bg-[#7a2228] hover:bg-[#681c21] text-white'
                              }`}
                              title={`إلغاء القيد: ${row.cancelEntry ? 'مسموح (نعم)' : 'محظور (لا)'}`}
                            >
                              {row.cancelEntry ? 'نعم' : 'لا'}
                            </button>
                          </td>

                          {/* 6. طباعة القيد */}
                          <td className="px-1.5 py-1.5 border-l border-slate-200 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(categoryKey, row.id, 'printEntry')}
                              className={`font-bold text-xs w-11 h-7 rounded-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs mx-auto ${
                                row.printEntry 
                                  ? 'bg-[#0b5a49] hover:bg-[#084538] text-white' 
                                  : 'bg-[#7a2228] hover:bg-[#681c21] text-white'
                              }`}
                              title={`طباعة القيد: ${row.printEntry ? 'مسموح (نعم)' : 'محظور (لا)'}`}
                            >
                              {row.printEntry ? 'نعم' : 'لا'}
                            </button>
                          </td>

                          {/* 7. سجل القيد (صلاحية منو عدل وشنو التعديل) */}
                          <td className="px-1.5 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(categoryKey, row.id, 'logEntry')}
                              className={`font-bold text-xs w-11 h-7 rounded-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs mx-auto ${
                                row.logEntry 
                                  ? 'bg-[#0b5a49] hover:bg-[#084538] text-white' 
                                  : 'bg-[#7a2228] hover:bg-[#681c21] text-white'
                              }`}
                              title={`صلاحية كشف سجل القيد: ${row.logEntry ? 'مسموح (نعم)' : 'محظور (لا)'}`}
                            >
                              {row.logEntry ? 'نعم' : 'لا'}
                            </button>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>

                </table>
              </div>

              {/* شريط الإيضاح السفلي والمفاهيم المحاسبية */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#0b5a49] inline-block"></span>
                    <strong className="text-slate-800">نعم:</strong> صلاحية مسموحة للمستخدم/القسم
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#7a2228] inline-block"></span>
                    <strong className="text-slate-800">لا:</strong> صلاحية محظورة ومقفلة
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <History className="w-3.5 h-3.5 shrink-0" />
                  <span><strong>سجل القيد:</strong> يوثق تاريخ التعديل، سبب التعديل، القيم السابقة والجديدة، وهوية من قام بالتعديل.</span>
                </div>
              </div>
            </div>

            {/* صندوق أقسام الصلاحيات على اليمين (الأوبشنات - مطابق 100% للصورة المرفقة) */}
            <div className="w-full lg:w-64 shrink-0 border-2 border-[#0b5a49] bg-white p-2.5 rounded-xs shadow-xs space-y-2">
              
              {/* ترويسة قائمة الأوبشنات */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700">أقسام الصلاحيات (الأوبشنات)</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                  {categoriesList.length}
                </span>
              </div>

              {/* قائمة الأزرار للأوبشنات */}
              <div className="space-y-1.5">
                {categoriesList.map((cat) => {
                  const isActive = selectedCategory === cat.key;

                  if (isActive) {
                    return (
                      <div
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                        className="w-full bg-[#edf3f0] border border-[#0b5a49] text-[#0b5a49] font-bold text-xs py-2 px-3 rounded-xs flex items-center justify-between cursor-pointer shadow-2xs select-none transition-all"
                      >
                        <div className="w-5 h-5 rounded-full border border-emerald-600 bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="flex-1 text-center font-bold text-sm tracking-wide">{cat.label}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className="w-full bg-[#1c1d1a] hover:bg-[#282924] text-[#f7f5ed] font-bold text-sm py-2 px-3 rounded-xs flex items-center justify-center cursor-pointer transition-colors shadow-2xs select-none"
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* شريط التحكم السفلي الموحد */}
      <div className="bg-slate-100/90 px-5 py-3 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterFullName('');
                setFilterBranch('all');
                setFilterGroup('all');
              }}
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="إفراغ وتصفير الفلاتر (F3)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>تفريغ .F3</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="طباعة (F6)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>طباعة .F6</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllData}
              className="h-8 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="تفريغ كافة البيانات للفحص"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>تفريغ البيانات للفحص</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="إغلاق والعودة للرئيسية (ESC)"
              >
                <X className="w-3.5 h-3.5 text-slate-600" />
                <span>انهاء .ESC</span>
              </button>
            )}

            <button
              type="button"
              onClick={
                activeTab === 'groups'
                  ? handleOpenNewGroupModal
                  : activeTab === 'branches'
                    ? handleOpenNewBranchModal
                    : handleOpenNewUserModal
              }
              className="h-8 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
              title="إضافة جديد (F2)"
            >
              <Plus className="w-4 h-4 text-sky-200" />
              <span>
                {activeTab === 'groups'
                  ? 'إضافة مجموعة .F2'
                  : activeTab === 'branches'
                    ? 'إضافة فرع .F2'
                    : 'إضافة مستخدم .F2'}
              </span>
            </button>
          </div>
        </div>

      {/* نافذة المودال: مستخدم جديد أو تعديل مستخدم */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            
            {/* رأس النافذة */}
            <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-200" />
                <span>{editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد للنظام'}</span>
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* جسم النموذج */}
            <form onSubmit={handleSaveUser} className="p-4 space-y-3.5 text-xs">
              
              {/* اسم الموظف (يُستخدم نفسه كاسم مستخدم للدخول بدون الحاجة لكتابة اسم إنجليزي) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الموظف / اسم المستخدم (للدخول) *</label>
                <input
                  type="text"
                  required
                  value={formDataFullName}
                  onChange={(e) => setFormDataFullName(e.target.value)}
                  placeholder="مثال: بهاء الخالدي"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                />
              </div>

              {/* كلمة المرور ورقم الهاتف والبريد الإلكتروني */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    value={formDataPassword}
                    onChange={(e) => setFormDataPassword(e.target.value)}
                    placeholder={editingUser ? 'اتركه فارغاً للإبقاء' : '••••••••'}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={formDataPhone}
                    onChange={(e) => setFormDataPhone(e.target.value)}
                    placeholder="0770xxxxxxx"
                    dir="ltr"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>البريد الإلكتروني</span>
                    <span className="text-[10px] text-emerald-700 font-normal">لاستعادة الرمز</span>
                  </label>
                  <input
                    type="email"
                    value={formDataEmail}
                    onChange={(e) => setFormDataEmail(e.target.value)}
                    placeholder="user@example.com"
                    dir="ltr"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  />
                </div>
              </div>

              {/* الفرع والمجموعة (القسم) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">الفرع *</label>
                    <button
                      type="button"
                      onClick={handleOpenNewBranchModal}
                      className="text-[10px] font-bold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-0.5 cursor-pointer"
                      title="إضافة فرع جديد للقائمة"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة فرع</span>
                    </button>
                  </div>
                  <select
                    required
                    value={formDataBranch}
                    onChange={(e) => setFormDataBranch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0b5a49] cursor-pointer"
                  >
                    {branchOptions.length === 0 ? (
                      <option value="">— يرجى إضافة فرع أولاً —</option>
                    ) : (
                      branchOptions.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))
                    )}
                    {formDataBranch && !branchOptions.includes(formDataBranch) && (
                      <option value={formDataBranch}>{formDataBranch}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المجموعة (قسم الشركة) *</label>
                  <select
                    value={formDataGroupId}
                    onChange={(e) => setFormDataGroupId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* النوع والصندوق */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع المستخدم (الرتبة) *</label>
                  <select
                    value={formDataUserType}
                    onChange={(e) => setFormDataUserType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  >
                    <option value="مدير">مدير (كافة الصلاحيات تلقائياً)</option>
                    <option value="موظف">موظف</option>
                    <option value="مدير فرع">مدير فرع</option>
                  </select>
                  {checkIsAdminUserOrGroup(formDataUserType) && (
                    <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 inline text-emerald-600 shrink-0" />
                      <span>نوع المستخدم ({formDataUserType}) يمتلك كافة الصلاحيات تلقائياً بدون تخصيص</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الصندوق المخصص *</label>
                  <select
                    value={formDataCashBox}
                    onChange={(e) => setFormDataCashBox(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0b5a49]"
                  >
                    {cashBoxOptions.map(cb => (
                      <option key={cb} value={cb}>{cb}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* حالة الحساب */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">حالة تفعيل حساب المستخدم:</span>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDataIsActive}
                    onChange={(e) => setFormDataIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#0b5a49] rounded border-slate-300 focus:ring-[#0b5a49]"
                  />
                  <span className={`font-bold ${formDataIsActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {formDataIsActive ? 'فعال ومفعل للعمليات' : 'معطل مؤقتاً'}
                  </span>
                </label>
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* نافذة المودال: توصيف المجموعات (مطابق 100% للصورة المرفقة) */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-300 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
            
            {/* ترويسة النافذة: عنوان في المنتصف وزر إغلاق أحمر داكن في أقصى اليسار */}
            <div className="relative py-3 px-4 border-b border-slate-200 bg-white flex items-center justify-center">
              {/* زر الإغلاق الأحمر المربع في أعلى اليسار */}
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="absolute top-2.5 left-2.5 w-6 h-6 bg-[#8B2635] hover:bg-[#721f2b] text-white flex items-center justify-center rounded-none cursor-pointer transition-colors shadow-2xs"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <h3 className="font-bold text-sm text-[#0b4d3c] text-center select-none">
                توصيف المجموعات
              </h3>
            </div>

            <form onSubmit={handleSaveGroup} className="p-5 space-y-3.5 text-xs">
              
              {/* 1. الاسم */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-right">الاسم</label>
                <input
                  type="text"
                  required
                  value={formGroupName}
                  onChange={(e) => setFormGroupName(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-none text-slate-900 focus:outline-none focus:border-[#0b4d3c] text-right"
                />
              </div>

              {/* 2. الاسم اللاتيني */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-right">الاسم اللاتيني</label>
                <input
                  type="text"
                  value={formGroupLatinName}
                  onChange={(e) => setFormGroupLatinName(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-none text-slate-900 focus:outline-none focus:border-[#0b4d3c] text-right font-sans"
                />
              </div>

              {/* 3. النوع */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-right">النوع</label>
                <select
                  value={formGroupType}
                  onChange={(e) => setFormGroupType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-none text-slate-900 focus:outline-none focus:border-[#0b4d3c] text-right cursor-pointer"
                >
                  <option value="المستخدم">المستخدم</option>
                  <option value="الوكيل">الوكيل</option>
                  <option value="المدير">المدير</option>
                  <option value="أمين صندوق">أمين صندوق</option>
                </select>
              </div>

              {/* أزرار الإجراءات: حفظ باللون الأخضر وإغلاق باللون الأحمر الداكن في المنتصف */}
              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-1.5 bg-[#1e6e48] hover:bg-[#165638] text-white rounded-none font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-6 py-1.5 bg-[#8B2635] hover:bg-[#721f2b] text-white rounded-none font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>اغلاق</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* نافذة المودال: إضافة / تعديل فرع */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-200" />
                <span>{editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الفرع *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formBranchName}
                  onChange={(e) => setFormBranchName(e.target.value)}
                  placeholder="مثال: فرع المنصور - بغداد"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العنوان / المدينة</label>
                <input
                  type="text"
                  value={formBranchAddress}
                  onChange={(e) => setFormBranchAddress(e.target.value)}
                  placeholder="بغداد - المنصور..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم هاتف الفرع</label>
                <input
                  type="text"
                  value={formBranchPhone}
                  onChange={(e) => setFormBranchPhone(e.target.value)}
                  placeholder="0770xxxxxxx"
                  dir="ltr"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBranch ? 'حفظ التعديلات' : 'حفظ الفرع'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة سجل القيد وتتبع التعديلات (منو عدل وشنو التعديل) */}
      {isAuditModalOpen && selectedAuditRow && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            
            {/* رأس النافذة */}
            <div className="bg-[#0b5a49] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm">
                    سجل تدقيق القيد والتعديلات المحاسبية (Audit Trail)
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    العملية: <strong className="text-white">{selectedAuditRow.name}</strong> — تتبع دقيق لمن أجرى التعديل وتفاصيل ما تم تغييره
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* محتوى السجل */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* شريط حالة صلاحية هذا المستخدم / القسم */}
              <div className={`p-3 rounded border flex items-center justify-between ${
                selectedAuditRow.logEntry 
                  ? 'bg-emerald-50 border-emerald-300 text-[#0b5a49]' 
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedAuditRow.logEntry ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">حالة صلاحية سجل القيد للمستخدم المختار: </span>
                    <span>
                      {selectedAuditRow.logEntry 
                        ? 'مسموحة (نعم) 🟢 — يحق لهذا المستخدم/القسم استعراض سجل التعديلات وهوية من عدل.' 
                        : 'محظورة ومقفلة (لا) 🔴 — هذا المستخدم أو القسم ممنوع من رؤية سجل التعديلات.'}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] bg-white px-2 py-0.5 rounded font-bold shadow-2xs">
                  {permTargetType === 'group' ? 'صلاحية قسم' : 'صلاحية مستخدم فردي'}
                </span>
              </div>

              {/* بطاقة توضيحية لطلب المستخدم */}
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 text-xs leading-relaxed">
                <strong className="block mb-1 text-amber-950 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>المقصود بسجل القيد في النظام:</span>
                </strong>
                يوثق النظام آلياً أي حركة تعديل أو إلغاء تتم على القيود والسندات، بحيث يظهر بوضوح: 
                <strong> منو عدل القيد؟</strong> (اسم المستخدم، صفته الوظيفية، وعنوان الـ IP)، 
                <strong> متى تم التعديل؟</strong> (التاريخ والوقت)، 
                <strong> وشنو صار تعديل؟</strong> (القيم الأصلية قبل التعديل مقارنة بالقيم الجديدة بعد التعديل)، مع توثيق سبب التعديل.
              </div>

              {/* قائمة الحركات المسجلة */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>الحركات المسجلة في سجل هذا القيد ({selectedAuditRow.auditLogs?.length || 0})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">مرتبة من الأحدث إلى الأقدم</span>
                </div>

                {(!selectedAuditRow.auditLogs || selectedAuditRow.auditLogs.length === 0) ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded border border-slate-200">
                    لا توجد حركات تعديل مسجلة سابقاً على هذا القيد. يمكنك تسجيل حركة تعديل تجريبية أدناه.
                  </div>
                ) : (
                  selectedAuditRow.auditLogs.map((log) => (
                    <div key={log.id} className="border border-slate-200 rounded-md bg-white shadow-2xs overflow-hidden">
                      
                      {/* رأس حركة التعديل */}
                      <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            log.actionType === 'تعديل قيد' 
                              ? 'bg-blue-100 text-blue-800' 
                              : log.actionType === 'إلغاء قيد' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.actionType}
                          </span>
                          <span className="font-mono font-bold text-slate-700">{log.entryNumber}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600 font-bold">المعدل: {log.modifiedBy}</span>
                          <span className="text-slate-500">({log.userRole})</span>
                        </div>

                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{log.timestamp}</span>
                          </span>
                          {log.ipAddress && (
                            <span className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px]">
                              IP: {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* سبب التعديل */}
                      {log.reason && (
                        <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-100 text-[11px] text-slate-700">
                          <span className="font-bold text-slate-800">سبب ومبرر التعديل: </span>
                          <span>{log.reason}</span>
                        </div>
                      )}

                      {/* جدول مقارنة التعديل (شنو صار تعديل) */}
                      <div className="p-3">
                        <table className="w-full text-xs text-right border border-slate-200 rounded">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold">
                              <th className="p-1.5 border-l border-slate-200 w-1/3">الحقل / البيان المعدل</th>
                              <th className="p-1.5 border-l border-slate-200 text-rose-800 w-1/3">القيمة قبل التعديل 🔴</th>
                              <th className="p-1.5 text-emerald-800 w-1/3">القيمة بعد التعديل 🟢</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {log.changes.map((change, cIdx) => (
                              <tr key={cIdx} className="hover:bg-slate-50">
                                <td className="p-1.5 border-l border-slate-200 font-medium text-slate-800">
                                  {change.field}
                                </td>
                                <td className="p-1.5 border-l border-slate-200 font-mono text-rose-700 bg-rose-50/40 font-semibold">
                                  {change.before}
                                </td>
                                <td className="p-1.5 font-mono text-emerald-700 bg-emerald-50/40 font-semibold">
                                  {change.after}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* نموذج إضافة حركة تعديل تجريبية لسجل القيد */}
              <div className="border border-emerald-200 rounded-md bg-emerald-50/30 p-3.5 space-y-2.5">
                <h4 className="font-bold text-xs text-[#0b5a49] flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>تسجيل حركة تعديل فورية لتجربة سجل القيد (Audit Simulator)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-0.5">منو أجرى التعديل؟</label>
                    <input 
                      type="text"
                      value={testAuditUser}
                      onChange={(e) => setTestAuditUser(e.target.value)}
                      placeholder="اسم المستخدم وصفته"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-0.5">نوع الحركة</label>
                    <select
                      value={testAuditAction}
                      onChange={(e) => setTestAuditAction(e.target.value as any)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="تعديل قيد">تعديل قيد محاسبي</option>
                      <option value="إلغاء قيد">إلغاء قيد محاسبي</option>
                      <option value="حذف قيد">حذف قيد محاسبي</option>
                      <option value="إنشاء قيد">إنشاء قيد محاسبي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-0.5">سبب التعديل</label>
                    <input 
                      type="text"
                      value={testAuditReason}
                      onChange={(e) => setTestAuditReason(e.target.value)}
                      placeholder="ملاحظات سبب التعديل"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-0.5">الحقل المعدل</label>
                    <input 
                      type="text"
                      value={testAuditField}
                      onChange={(e) => setTestAuditField(e.target.value)}
                      placeholder="مثال: المبلغ، الحساب"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-rose-800 font-bold mb-0.5">القيمة قبل التعديل 🔴</label>
                    <input 
                      type="text"
                      value={testAuditBefore}
                      onChange={(e) => setTestAuditBefore(e.target.value)}
                      placeholder="القيمة السابقة"
                      className="w-full px-2 py-1 bg-white border border-rose-300 text-rose-700 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-emerald-800 font-bold mb-0.5">القيمة بعد التعديل 🟢</label>
                    <input 
                      type="text"
                      value={testAuditAfter}
                      onChange={(e) => setTestAuditAfter(e.target.value)}
                      placeholder="القيمة الجديدة"
                      className="w-full px-2 py-1 bg-white border border-emerald-300 text-emerald-700 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="text-left pt-1">
                  <button
                    type="button"
                    onClick={handleAddTestAuditRecord}
                    className="px-4 py-1.5 bg-[#0b5a49] hover:bg-[#084538] text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs mr-auto"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>توثيق التعديل في سجل القيد الآن</span>
                  </button>
                </div>
              </div>

            </div>

            {/* أسفل النافذة */}
            <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                يتم حفظ كل التعديلات وتتبعها وفق معايير المحاسبة والرقابة المالية الذكية.
              </span>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-1.5 bg-[#0b5a49] text-white rounded font-bold hover:bg-[#084538] cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
