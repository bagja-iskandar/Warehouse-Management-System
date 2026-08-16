import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "@/services";
import { Invoice } from "@/types";

export const billingKeys = {
  all: ["billing"] as const,
  invoices: (customerId?: string) => [...billingKeys.all, "invoices", { customerId }] as const,
};

export function useInvoices(customerId?: string) {
  return useQuery({
    queryKey: billingKeys.invoices(customerId),
    queryFn: () => billingService.getInvoices(customerId),
    staleTime: 1000 * 60 * 3,
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      method,
      proofUrl,
    }: {
      invoiceId: string;
      method: Invoice["paymentMethod"];
      proofUrl: string;
    }) => billingService.payInvoice(invoiceId, method, proofUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}
