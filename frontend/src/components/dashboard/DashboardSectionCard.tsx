import React from "react";

interface DashboardSectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export function DashboardSectionCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  headerAction,
  children,
  className = "",
  bodyClassName = "",
  noPadding = false,
}: DashboardSectionCardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between transition-all ${className}`}
    >
      {/* Card Header Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/40">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Card Body */}
      <div className={`flex-1 ${noPadding ? "" : "p-6"} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
