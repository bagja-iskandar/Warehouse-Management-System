import { mockDb } from "@/mock/db/mock-db";
import { Invoice } from "@/types";
import { apiClient } from "@/lib/api-client";

export interface IBillingService {
  getInvoices(customerId?: string): Promise<Invoice[]>;
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
      amount: Number(amount || 7812000),
      paymentReference: paymentReference || "TRX-PAY-AUTO",
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
    note?: string
  ): Promise<Invoice> {
    const res = await apiClient<any>(`/billing/invoices/${invoiceId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({
        action,
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
      paymentMethod: raw.paymentMethod,
      paymentProofUrl: raw.paymentProofUrl,
      verifiedByAdminId: raw.verifiedByAdminId,
      verifiedAt: raw.verifiedAt,
      createdAt: raw.createdAt,
    };
  }
}

/**
 * In-Memory Mock Implementation (Local Development & Offline Testing)
 */
export class MockBillingService implements IBillingService {
  async getInvoices(customerId?: string): Promise<Invoice[]> {
    return mockDb.getInvoices(customerId);
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const list = await mockDb.getInvoices();
    return list.find((i) => i.id === id || i.invoiceNumber === id) || null;
  }

  async payInvoice(
    invoiceId: string,
    method: Invoice["paymentMethod"],
    proofUrl: string,
    _amount?: number,
    _paymentReference?: string,
    _notes?: string
  ): Promise<Invoice> {
    return mockDb.payInvoice(invoiceId, method, proofUrl);
  }

  async verifyPayment(
    invoiceId: string,
    action: "VERIFY" | "REJECT",
    _note?: string
  ): Promise<Invoice> {
    const list = await mockDb.getInvoices();
    const inv = list.find((i) => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");
    inv.status = action === "VERIFY" ? "PAID" : "OVERDUE";
    return inv;
  }
}

// Service Factory / Dependency Injection Selection
const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const billingService: IBillingService = isMock
  ? new MockBillingService()
  : new HttpBillingService();
