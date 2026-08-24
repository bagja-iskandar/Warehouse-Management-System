export type InvoiceStatus =
  | "UNPAID"
  | "PENDING_PAYMENT"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type PaymentStatus =
  | "NOT_STARTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "FAILED";

export type PaymentMethod = "BANK_TRANSFER" | "QRIS" | "VIRTUAL_ACCOUNT";

export interface InvoiceItem {
  id: string;
  goodsId?: string | null;
  description: string;
  goodsName?: string | null;
  volumeM3: number;
  ratePerM3: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  customerName?: string;
  customerCompany?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  proofUrl?: string | null;
  status: PaymentStatus;
  notes?: string | null;
  rejectionReason?: string | null;
  receiptNumber?: string | null;
  submittedAt: string;
  verifiedAt?: string | null;
  verifiedByAdminId?: string | null;
  verifiedByAdminName?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerCompany?: string | null;
  customerEmail: string;
  billingMonth: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string | null;

  items: InvoiceItem[];
  subtotal: number;
  penaltyFee: number;
  totalAmount: number;

  status: InvoiceStatus;
  latestPaymentStatus?: PaymentStatus;
  latestRejectionReason?: string | null;
  receiptNumber?: string | null;

  paymentMethod?: PaymentMethod | null;
  paymentProofUrl?: string | null;
  verifiedByAdminId?: string | null;
  verifiedAt?: string | null;

  payments?: Payment[];
  createdAt: string;
}
