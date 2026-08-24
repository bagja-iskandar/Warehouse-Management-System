import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeColor?: string;
  breadcrumb?: string;
  isFetching?: boolean;
  onRefresh?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  badgeText,
  badgeColor = "bg-indigo-600 text-white",
  breadcrumb,
  isFetching = false,
  onRefresh,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        {breadcrumb && (
          <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
            {breadcrumb}
          </span>
        )}
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
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
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
