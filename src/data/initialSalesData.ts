import { ProductItem, ProductCategory, InstallmentContract, GuarantorItem } from '../types/sales';

export const INITIAL_PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'cat-1', code: 'SEC-01', name: 'أجهزة الموبايل والهواتف', description: 'أجهزة الهواتف الذكية والإلكترونيات', itemsCount: 2 },
  { id: 'cat-2', code: 'SEC-02', name: 'أجهزة منزلية وكهربائيات', description: 'شاشات وبرادات وغسالات', itemsCount: 1 },
  { id: 'cat-3', code: 'SEC-03', name: 'إكسسوارات وملحقات', description: 'سماعات وشواحن وكفرات', itemsCount: 1 },
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prd-1',
    code: 'PRD-101',
    barcode: '692187654321',
    name: 'هاتف Samsung Galaxy A54 5G 128GB',
    category: 'أجهزة الموبايل والهواتف',
    costPriceIQD: 420000,
    sellingPriceIQD: 495000,
    installmentPriceIQD: 560000,
    quantity: 12,
    minQuantity: 3,
    unit: 'قطعة',
    notes: 'ضمان سنة شركة النبع',
    createdAt: '2026-10-20'
  },
  {
    id: 'prd-2',
    code: 'PRD-102',
    barcode: '692187654322',
    name: 'هاتف iPhone 15 Pro Max 256GB',
    category: 'أجهزة الموبايل والهواتف',
    costPriceIQD: 1550000,
    sellingPriceIQD: 1720000,
    installmentPriceIQD: 1950000,
    quantity: 5,
    minQuantity: 2,
    unit: 'قطعة',
    notes: 'أصلي مع فيش معتمد',
    createdAt: '2026-10-21'
  },
  {
    id: 'prd-3',
    code: 'PRD-103',
    barcode: '692187654323',
    name: 'شاشة LG Smart 4K UHD 55 Inch',
    category: 'أجهزة منزلية وكهربائيات',
    costPriceIQD: 620000,
    sellingPriceIQD: 730000,
    installmentPriceIQD: 825000,
    quantity: 8,
    minQuantity: 2,
    unit: 'جهاز',
    notes: 'شاشة سمارت ويب أو إس',
    createdAt: '2026-10-22'
  },
  {
    id: 'prd-4',
    code: 'PRD-104',
    barcode: '692187654324',
    name: 'سماعة Apple AirPods Pro 2 Type-C',
    category: 'إكسسوارات وملحقات',
    costPriceIQD: 280000,
    sellingPriceIQD: 337500,
    installmentPriceIQD: 380000,
    quantity: 15,
    minQuantity: 4,
    unit: 'علبة',
    notes: 'إصدار أصلي مع الشاحن',
    createdAt: '2026-10-23'
  }
];

export const INITIAL_INSTALLMENTS: InstallmentContract[] = [
  {
    id: 'inst-1',
    invoiceId: 'inv-101',
    invoiceCode: 'INV-2026-001',
    clientName: 'أحمد جاسم الشمري',
    clientPhone: '07701234567',
    guarantorName: 'حيدر جاسم الشمري',
    guarantorPhone: '07709876543',
    totalAmountIQD: 1258500,
    downPaymentIQD: 106000,
    remainingAmountIQD: 1046500,
    installmentsCount: 10,
    monthlyAmountIQD: 106000,
    startDate: '2026-08-15',
    nextDueDate: '2026-10-15',
    status: 'overdue',
    overdueCount: 1,
    notes: 'قسط شهر تشرين الأول متأخر بقيمة 106,000 د.ع'
  },
  {
    id: 'inst-2',
    invoiceId: 'inv-102',
    invoiceCode: 'INV-2026-002',
    clientName: 'مصطفى كمال التميمي',
    clientPhone: '07802345678',
    guarantorName: 'علي كمال التميمي',
    guarantorPhone: '07801239876',
    totalAmountIQD: 825000,
    downPaymentIQD: 719000,
    remainingAmountIQD: 106000,
    installmentsCount: 6,
    monthlyAmountIQD: 106000,
    startDate: '2026-09-01',
    nextDueDate: '2026-11-01',
    status: 'active',
    overdueCount: 0,
    notes: 'الأقساط منتظمة'
  }
];

export const INITIAL_GUARANTORS: GuarantorItem[] = [
  {
    id: 'guar-1',
    name: 'حيدر جاسم الشمري',
    phone: '07709876543',
    clientName: 'أحمد جاسم الشمري',
    workplace: 'وزارة التربية - مديرية الكرخ',
    nationalId: '198422345511',
    notes: 'كفالة راتب مع بطاقة ماستر'
  },
  {
    id: 'guar-2',
    name: 'علي كمال التميمي',
    phone: '07801239876',
    clientName: 'مصطفى كمال التميمي',
    workplace: 'شركة توزيع المنتجات النفطية',
    nationalId: '199144882233',
    notes: 'كفالة شخصية مع كتاب تأييد'
  }
];
