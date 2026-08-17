import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Operations Portal Sign In — WMS Nusantara",
  description:
    "Enterprise multi-role login portal for Warehouse Administrators, Customers, and Logistics Fleet Drivers.",
};

export default function LoginPage() {
  return <LoginForm />;
}
