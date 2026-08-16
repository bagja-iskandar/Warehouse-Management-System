"use client";

import React, { useState } from "react";
import { DriverSidebar } from "./DriverSidebar";
import { DriverTopbar } from "./DriverTopbar";
import { DriverBottomNav } from "./DriverBottomNav";
import { CommandSearchDialog } from "./CommandSearchDialog";
import { NotificationDrawer } from "./NotificationDrawer";

interface DriverShellProps {
  children: React.ReactNode;
}

export function DriverShell({ children }: DriverShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Clean White Rounded Floating Driver Sidebar */}
      <DriverSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport with Harmonious Padding & Margins */}
      <div className="lg:pl-72 flex flex-col min-h-screen p-4 space-y-4 pb-24 lg:pb-6 transition-all duration-300">
        {/* Rounded Floating Driver Topbar */}
        <DriverTopbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={1}
        />

        {/* Page Main Content */}
        <main className="flex-1 w-full">{children}</main>
      </div>

      {/* Mobile Bottom Floating Navigation Bar (Active on Mobile) */}
      <div className="lg:hidden">
        <DriverBottomNav />
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
