export type InvoiceStatus = "UNPAID" | "PENDING_VERIFICATION" | "PAID" | "OVERDUE" | "CANCELLED";

export interface InvoiceItem {
  id: string;
  description: string; // e.g. "Sewa Slot Cold Storage (2.5 m3) - Bulan Agustus 2026"
  goodsName?: string;
  volumeM3: number;
  ratePerM3: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-08-0142"
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingMonth: string; // e.g. "Agustus 2026"
  issueDate: string;
  dueDate: string;
  paidDate?: string;

  items: InvoiceItem[];
  subtotal: number;
  penaltyFee: number; // Denda jika lewat jatuh tempo
  totalAmount: number;

  status: InvoiceStatus;
  paymentMethod?: "BANK_TRANSFER" | "QRIS" | "VIRTUAL_ACCOUNT";
  paymentProofUrl?: string;
  verifiedByAdminId?: string;
  verifiedAt?: string;

  createdAt: string;
}
