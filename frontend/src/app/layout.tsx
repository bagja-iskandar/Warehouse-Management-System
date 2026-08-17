import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Warehouse Management System — Modern Logistics Platform",
  description:
    "Enterprise-grade Warehouse Management System supporting cold storage, general inventory, vehicle selection, dynamic scheduling, and subscription billing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-background text-foreground`}>
        <AppProviders>
          <main className="flex-1">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
