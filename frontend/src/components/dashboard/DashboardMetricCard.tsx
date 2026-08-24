import React from "react";

export type MetricTheme = "indigo" | "emerald" | "amber" | "sky" | "rose" | "purple";

interface DashboardMetricCardProps {
  label: string;
  value: React.ReactNode;
  subvalue?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  subtext?: React.ReactNode;
  progress?: {
    value: number; // 0 to 100
    colorClass?: string;
  };
  theme?: MetricTheme;
  className?: string;
}

const THEME_STYLES: Record<MetricTheme, { iconBg: string; iconColor: string; barColor: string }> = {
  indigo: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    barColor: "bg-indigo-600",
  },
  emerald: {
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    barColor: "bg-emerald-600",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    barColor: "bg-amber-500",
  },
  sky: {
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    barColor: "bg-sky-600",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    barColor: "bg-rose-600",
  },
  purple: {
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    barColor: "bg-purple-600",
  },
};

export function DashboardMetricCard({
  label,
  value,
  subvalue,
  icon: Icon,
  badge,
  subtext,
  progress,
  theme = "indigo",
  className = "",
}: DashboardMetricCardProps) {
  const styles = THEME_STYLES[theme];

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between transition-all hover:border-slate-300 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 line-clamp-1">
          {label}
        </span>
        <div
          className={`h-8.5 w-8.5 rounded-xl ${styles.iconBg} ${styles.iconColor} flex items-center justify-center shrink-0`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {value}
          </span>
          {subvalue && (
            <span className="text-xs text-slate-400 font-mono">
              {subvalue}
            </span>
          )}
          {badge && <div className="ml-auto">{badge}</div>}
        </div>

        {progress && (
          <div className="pt-1.5 space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`${progress.colorClass || styles.barColor} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {subtext && (
        <div className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-50">
          {subtext}
        </div>
      )}
    </div>
  );
}
