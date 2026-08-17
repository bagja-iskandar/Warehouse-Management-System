import { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Change Password — WMS Nusantara",
  description:
    "Update account operational password for WMS Nusantara Warehouse Management System.",
};

export default function ChangePasswordPage() {
  return <ProfileView initialTab="password" />;
}
