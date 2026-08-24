import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  badgeColor?: string;
  isFetching?: boolean;
  onRefresh?: () => void;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  badgeText,
  badgeVariant = "default",
  badgeColor = "bg-indigo-600 text-white",
  isFetching = false,
  onRefresh,
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badgeText && (
            <Badge className={`${badgeColor} text-[10px] font-semibold`}>
              {badgeText}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 px-3 flex items-center gap-1.5 rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
