import { Metadata } from "next";
import { DriverShell } from "@/components/layout/DriverShell";

export const metadata: Metadata = {
  title: "Driver Fleet — WMS Nusantara",
  description:
    "Antarmuka operasional driver logistik, penugasan rute pengiriman, pemilihan truk reefer, dan digital POD WMS Nusantara.",
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DriverShell>{children}</DriverShell>;
}
