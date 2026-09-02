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
  compact?: boolean;
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
  compact = false,
}: DashboardSectionCardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between transition-all ${className}`}
    >
      {/* Card Header Bar */}
      <div
        className={`border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 ${
          compact ? "px-4 py-2.5 sm:py-3" : "px-6 py-4"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div
              className={`rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 ${
                compact ? "h-7 w-7" : "h-8 w-8"
              }`}
            >
              <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className={`font-bold text-slate-900 truncate ${
                  compact ? "text-xs" : "text-sm"
                }`}
              >
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p
                className={`text-slate-400 mt-0.5 truncate ${
                  compact ? "text-[10.5px]" : "text-xs"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Card Body */}
      <div
        className={`flex-1 ${
          noPadding ? "" : compact ? "p-4" : "p-6"
        } ${bodyClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
