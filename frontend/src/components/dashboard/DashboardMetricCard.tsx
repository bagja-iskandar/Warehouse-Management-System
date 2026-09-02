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
  compact?: boolean;
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
  compact = false,
}: DashboardMetricCardProps) {
  const styles = THEME_STYLES[theme];

  return (
    <div
      className={`bg-white border border-slate-200 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 ${
        compact
          ? "p-3 sm:p-3.5 rounded-xl space-y-2"
          : "p-5 rounded-2xl shadow-sm space-y-3"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`font-semibold text-slate-500 line-clamp-1 ${
            compact ? "text-[11px]" : "text-xs"
          }`}
        >
          {label}
        </span>
        <div
          className={`${
            compact ? "h-7 w-7 rounded-lg" : "h-8.5 w-8.5 rounded-xl"
          } ${styles.iconBg} ${styles.iconColor} flex items-center justify-center shrink-0`}
        >
          <Icon className={compact ? "h-3.5 w-3.5" : "h-4.5 w-4.5"} />
        </div>
      </div>

      <div className={compact ? "space-y-0.5" : "space-y-1"}>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className={`font-extrabold text-slate-900 font-mono tracking-tight ${
              compact ? "text-lg sm:text-xl" : "text-2xl"
            }`}
          >
            {value}
          </span>
          {subvalue && (
            <span
              className={`text-slate-400 font-mono ${
                compact ? "text-[10px]" : "text-xs"
              }`}
            >
              {subvalue}
            </span>
          )}
          {badge && <div className="ml-auto">{badge}</div>}
        </div>

        {progress && (
          <div className={compact ? "pt-1 space-y-0.5" : "pt-1.5 space-y-1"}>
            <div
              className={`w-full bg-slate-100 rounded-full overflow-hidden ${
                compact ? "h-1.5" : "h-2"
              }`}
            >
              <div
                className={`${progress.colorClass || styles.barColor} ${
                  compact ? "h-1.5" : "h-2"
                } rounded-full transition-all duration-500`}
                style={{
                  width: `${Math.min(100, Math.max(0, progress.value))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {subtext && (
        <div
          className={`text-slate-400 font-medium border-t border-slate-100/80 ${
            compact ? "text-[10px] pt-1" : "text-[11px] pt-1"
          }`}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}
