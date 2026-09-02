import { Metadata } from "next";
import { AdminShell } from "@/components/layout/AdminShell";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Operations Admin — WMS Nusantara",
  description:
    "Operations command center for warehouse capacity, rack allocation, logistics fleet, and billing in WMS Nusantara.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
