import { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";

export const metadata: Metadata = {
  title: "Portal Customer — WMS Nusantara",
  description:
    "Portal layanan mandiri sewa gudang standard & cold storage, registrasi barang inventaris, dan pengajuan logistik WMS Nusantara.",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerShell>{children}</CustomerShell>;
}
