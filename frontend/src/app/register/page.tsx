import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Customer Account Registration — WMS Nusantara",
  description:
    "Corporate registration form for tenants to lease standard dry and cold storage warehouse capacity in WMS Nusantara.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
