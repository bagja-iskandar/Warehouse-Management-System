import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "@/services";
import { Invoice } from "@/types";

export const billingKeys = {
  all: ["billing"] as const,
  invoices: (customerId?: string) =>
    [...billingKeys.all, "invoices", { customerId }] as const,
  invoice: (id: string) => [...billingKeys.all, "invoice", id] as const,
};

export function useInvoices(customerId?: string) {
  return useQuery({
    queryKey: billingKeys.invoices(customerId),
    queryFn: () => billingService.getInvoices(customerId),
    staleTime: 1000 * 60 * 3,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: billingKeys.invoice(id),
    queryFn: () => billingService.getInvoiceById(id),
    enabled: !!id,
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      method,
      proofUrl,
      amount,
      paymentReference,
      notes,
    }: {
      invoiceId: string;
      method: Invoice["paymentMethod"];
      proofUrl: string;
      amount?: number;
      paymentReference?: string;
      notes?: string;
    }) =>
      billingService.payInvoice(
        invoiceId,
        method,
        proofUrl,
        amount,
        paymentReference,
        notes
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      action,
      note,
    }: {
      invoiceId: string;
      action: "VERIFY" | "REJECT";
      note?: string;
    }) => billingService.verifyPayment(invoiceId, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}
