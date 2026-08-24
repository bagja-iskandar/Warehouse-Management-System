import React from "react";

interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardContainer({ children, className = "" }: DashboardContainerProps) {
  return (
    <div
      className={`w-full max-w-[1600px] mx-auto space-y-6 pb-12 min-h-[calc(100vh-8.5rem)] animate-in fade-in duration-200 ${className}`}
    >
      {children}
    </div>
  );
}
