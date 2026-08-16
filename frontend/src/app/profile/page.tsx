import { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profil & Pengaturan Akun — WMS Nusantara",
  description:
    "Kelola data profil, PIC perusahaan, pengaturan kata sandi, dan riwayat sesi pengguna WMS Nusantara.",
};

export default function ProfilePage() {
  return <ProfileView initialTab="profile" />;
}
