import { Invoice, Payment } from "@/types";
import { apiClient } from "@/lib/api-client";

export interface IBillingService {
  getInvoices(customerId?: string): Promise<Invoice[]>;
  getPendingPayments(): Promise<Payment[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  payInvoice(
    invoiceId: string,
    method: Invoice["paymentMethod"],
    proofUrl: string,
    amount?: number,
    paymentReference?: string,
    notes?: string
  ): Promise<Invoice>;
  verifyPayment(
    invoiceId: string,
    action: "VERIFY" | "REJECT",
    rejectionReason?: string,
    note?: string
  ): Promise<Invoice>;
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL)
 */
export class HttpBillingService implements IBillingService {
  async getInvoices(customerId?: string): Promise<Invoice[]> {
    const params: Record<string, any> = { limit: 100 };
    if (customerId) params.customerId = customerId;

    const res = await apiClient<{ items: any[]; totalItems: number }>(
      "/billing/invoices",
      { params }
    );

    const items = res?.items || (Array.isArray(res) ? res : []);
    return items.map((item) => this.mapBackendInvoiceToFrontend(item));
  }

  async getPendingPayments(): Promise<Payment[]> {
    const res = await apiClient<Payment[]>("/billing/payments/pending");
    return Array.isArray(res) ? res : [];
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const res = await apiClient<any>(`/billing/invoices/${id}`);
      if (!res) return null;
      return this.mapBackendInvoiceToFrontend(res);
    } catch (err) {
      return null;
    }
  }

  async payInvoice(
    invoiceId: string,
    method: Invoice["paymentMethod"],
    proofUrl: string,
    amount?: number,
    paymentReference?: string,
    notes?: string
  ): Promise<Invoice> {
    const payload = {
      paymentMethod: method || "BANK_TRANSFER",
      paymentProofUrl: proofUrl,
      amount: Number(amount || 0),
      paymentReference: paymentReference || `TRX-${Date.now().toString().slice(-8)}`,
      notes: notes || "WMS rental invoice payment",
    };

    const res = await apiClient<any>(`/billing/invoices/${invoiceId}/pay`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return this.mapBackendInvoiceToFrontend(res);
  }

  async verifyPayment(
    invoiceId: string,
    action: "VERIFY" | "REJECT",
    rejectionReason?: string,
    note?: string
  ): Promise<Invoice> {
    const res = await apiClient<any>(`/billing/invoices/${invoiceId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({
        action,
        rejectionReason: rejectionReason || note || "Payment proof invalid",
        note: note || "Verifikasi pembayaran faktur oleh Admin WMS",
      }),
    });

    return this.mapBackendInvoiceToFrontend(res);
  }

  private mapBackendInvoiceToFrontend(raw: any): Invoice {
    return {
      id: raw.id,
      invoiceNumber:
        raw.invoiceNumber || `INV-${raw.id.substring(0, 8).toUpperCase()}`,
      customerId: raw.customerId,
      customerName: raw.customerName || raw.customer?.name || "Customer",
      customerCompany: raw.customerCompany || raw.customer?.companyName || null,
      customerEmail:
        raw.customerEmail || raw.customer?.email || "customer@wms.id",
      billingMonth: raw.billingMonth || "August 2026",
      issueDate: raw.issueDate || raw.createdAt,
      dueDate: raw.dueDate || raw.createdAt,
      paidDate: raw.paidDate,
      items: Array.isArray(raw.items)
        ? raw.items.map((i: any) => ({
            id: i.id,
            description: i.description || "Warehouse Storage Space Rental",
            goodsName: i.goodsName || i.goodsItem?.name,
            volumeM3: Number(i.volumeM3 || 0),
            ratePerM3: Number(i.ratePerM3 || 0),
            subtotal: Number(i.subtotal || 0),
          }))
        : [],
      subtotal: Number(raw.subtotal || 0),
      penaltyFee: Number(raw.penaltyFee || 0),
      totalAmount: Number(raw.totalAmount || 0),
      status: raw.status,
      latestPaymentStatus: raw.latestPaymentStatus || (raw.status === "PAID" ? "VERIFIED" : raw.status === "PENDING_PAYMENT" ? "UNDER_REVIEW" : "NOT_STARTED"),
      latestRejectionReason: raw.latestRejectionReason || null,
      receiptNumber: raw.receiptNumber || null,
      paymentMethod: raw.paymentMethod,
      paymentProofUrl: raw.paymentProofUrl,
      verifiedByAdminId: raw.verifiedByAdminId,
      verifiedAt: raw.verifiedAt,
      payments: Array.isArray(raw.payments) ? raw.payments : [],
      createdAt: raw.createdAt,
    };
  }
}

export const billingService: IBillingService = new HttpBillingService();
