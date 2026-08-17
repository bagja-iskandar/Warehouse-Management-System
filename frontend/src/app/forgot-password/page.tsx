import { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Password Recovery — WMS Nusantara",
  description:
    "Enterprise user account password recovery service for Warehouse Management System WMS Nusantara.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
