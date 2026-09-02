import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: {
    default: "WMS Nusantara — Enterprise Warehouse & Logistics Platform",
    template: "%s — WMS Nusantara",
  },
  description:
    "Enterprise-grade Warehouse Management System supporting cold storage, general inventory, vehicle selection, dynamic scheduling, and subscription billing.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans min-h-full flex flex-col bg-background text-foreground">
        <AppProviders>
          <main className="flex-1">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
