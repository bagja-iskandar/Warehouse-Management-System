import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk Portal Operasional — WMS Nusantara",
  description:
    "Portal login enterprise multi-role untuk Admin Gudang, Customer, dan Driver Logistik WMS Nusantara.",
};

export default function LoginPage() {
  return <LoginForm />;
}
