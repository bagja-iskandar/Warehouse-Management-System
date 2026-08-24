import React from "react";
import { Boxes } from "lucide-react";

interface DashboardEmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function DashboardEmptyState({
  icon: Icon = Boxes,
  title,
  description,
  action,
  className = "",
}: DashboardEmptyStateProps) {
  return (
    <div
      className={`py-12 px-4 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-xl space-y-3 flex flex-col items-center justify-center ${className}`}
    >
      <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-xs font-bold text-slate-700">{title}</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
