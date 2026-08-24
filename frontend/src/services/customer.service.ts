import { apiClient } from "@/lib/api-client";

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER";
  phone: string;
  avatarUrl: string | null;
  companyName: string | null;
  address: string | null;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  createdAt: string;
  totalGoodsCount: number;
  storedGoodsCount: number;
  totalVolumeM3: number;
  totalInvoicesCount: number;
  unpaidInvoicesCount: number;
  totalBilledAmount: number;
  recentGoods: Array<{
    id: string;
    barcode: string;
    name: string;
    quantity: number;
    unit: string;
    volumeM3: number;
    status: string;
    warehouseName: string;
    slotCode: string | null;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    billingMonth: string;
    totalAmount: number;
    status: string;
    dueDate: string;
  }>;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  status?: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  avatarUrl?: string;
}

export const customerService = {
  async getCustomers(): Promise<CustomerItem[]> {
    const res = await apiClient<CustomerItem[]>("/users/customers");
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  async getCustomerById(id: string): Promise<CustomerItem> {
    const res = await apiClient<CustomerItem>(`/users/${id}`);
    return res;
  },

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<CustomerItem> {
    const res = await apiClient<CustomerItem>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return res;
  },

  async deleteCustomer(id: string): Promise<{ success: boolean; message: string; deletedId: string }> {
    return apiClient<{ success: boolean; message: string; deletedId: string }>(`/users/${id}`, {
      method: "DELETE",
    });
  },
};
