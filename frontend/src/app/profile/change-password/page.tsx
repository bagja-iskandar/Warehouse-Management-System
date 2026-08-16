import { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Ubah Kata Sandi — WMS Nusantara",
  description:
    "Pembaruan kata sandi akun operasional Warehouse Management System WMS Nusantara.",
};

export default function ChangePasswordPage() {
  return <ProfileView initialTab="password" />;
}
