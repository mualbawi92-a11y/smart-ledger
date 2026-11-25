export interface ProductItem {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  costPriceIQD: number;
  sellingPriceIQD: number;
  installmentPriceIQD: number;
  quantity: number;
  minQuantity: number;
  unit: string;
  notes?: string;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  itemsCount?: number;
}

export interface InstallmentContract {
  id: string;
  invoiceId: string;
  invoiceCode: string;
  clientName: string;
  clientPhone?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  totalAmountIQD: number;
  downPaymentIQD: number;
  remainingAmountIQD: number;
  installmentsCount: number;
  monthlyAmountIQD: number;
  startDate: string;
  nextDueDate: string;
  status: 'active' | 'completed' | 'overdue';
  overdueCount: number;
  notes?: string;
}

export interface GuarantorItem {
  id: string;
  name: string;
  phone: string;
  clientName: string;
  workplace?: string;
  nationalId?: string;
  notes?: string;
}
