import { Suspense } from "react";
import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Operations Portal Sign In — WMS Nusantara",
  description:
    "Enterprise multi-role login portal for Warehouse Administrators, Customers, and Logistics Fleet Drivers.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
