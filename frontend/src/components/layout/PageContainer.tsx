import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div
      className={`w-full max-w-[1600px] mx-auto space-y-6 pb-12 min-h-[calc(100vh-8.5rem)] animate-in fade-in duration-200 ${className}`}
    >
      {children}
    </div>
  );
}
