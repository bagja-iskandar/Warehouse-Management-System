import { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Customer Portal — WMS Nusantara",
  description:
    "Self-service portal for standard & cold storage warehouse rentals, inventory goods registration, and logistics requests in WMS Nusantara.",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["CUSTOMER"]}>
      <CustomerShell>{children}</CustomerShell>
    </AuthGuard>
  );
}
