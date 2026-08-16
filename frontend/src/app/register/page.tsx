import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Pendaftaran Akun Customer — WMS Nusantara",
  description:
    "Formulir registrasi akun perusahaan customer untuk menyewa kapasitas ruang gudang standard dan cold storage WMS Nusantara.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
