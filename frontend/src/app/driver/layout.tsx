import { Metadata } from "next";
import { DriverShell } from "@/components/layout/DriverShell";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Driver Fleet — WMS Nusantara",
  description:
    "Logistics driver operational interface, dispatch route assignment, reefer truck selection, and WMS Nusantara digital POD.",
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["DRIVER"]}>
      <DriverShell>{children}</DriverShell>
    </AuthGuard>
  );
}
