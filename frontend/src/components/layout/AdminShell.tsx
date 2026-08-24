"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { CommandSearchDialog } from "./CommandSearchDialog";
import { NotificationDrawer } from "./NotificationDrawer";
import { useOperationalCounts } from "@/hooks/use-operational-counts";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { data: counts } = useOperationalCounts();
  const unreadNotificationsCount = counts?.unreadNotificationsCount ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Clean White Rounded Floating Admin Sidebar (Fixed left-4 top-4 bottom-4 w-64) */}
      <AdminSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport with Harmonious Padding & Margins */}
      <div className="lg:pl-72 flex flex-col min-h-screen p-4 space-y-4 transition-all duration-300">
        {/* Rounded Floating Admin Topbar */}
        <AdminTopbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* Page Main Content */}
        <main className="flex-1 w-full">{children}</main>
      </div>

      {/* Interactive Global Command Search (Cmd + K) */}
      <CommandSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Slide-over Notifications Center */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}
