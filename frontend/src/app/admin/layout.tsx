import { Metadata } from "next";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata: Metadata = {
  title: "Admin Operasional — WMS Nusantara",
  description:
    "Pusat komando operasional pergudangan, kapasitas rak, armada logistik, dan tagihan WMS Nusantara.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
