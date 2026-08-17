import { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profile & Account Settings — WMS Nusantara",
  description:
    "Manage user profile data, company PIC, password settings, and active session history for WMS Nusantara.",
};

export default function ProfilePage() {
  return <ProfileView initialTab="profile" />;
}
