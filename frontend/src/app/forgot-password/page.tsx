import { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Pemulihan Kata Sandi — WMS Nusantara",
  description:
    "Layanan pemulihan kata sandi akun pengguna enterprise Warehouse Management System WMS Nusantara.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
