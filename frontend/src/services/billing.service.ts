import { mockDb } from "@/mock/db/mock-db";
import { Invoice } from "@/types";

export interface IBillingService {
  getInvoices(customerId?: string): Promise<Invoice[]>;
  payInvoice(
    invoiceId: string,
    method: Invoice["paymentMethod"],
    proofUrl: string
  ): Promise<Invoice>;
}

export class MockBillingService implements IBillingService {
  async getInvoices(customerId?: string): Promise<Invoice[]> {
    return mockDb.getInvoices(customerId);
  }

  async payInvoice(
    invoiceId: string,
    method: Invoice["paymentMethod"],
    proofUrl: string
  ): Promise<Invoice> {
    return mockDb.payInvoice(invoiceId, method, proofUrl);
  }
}

export const billingService: IBillingService = new MockBillingService();
