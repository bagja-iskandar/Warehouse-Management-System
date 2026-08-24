import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DashboardErrorState({
  title = "Unable to Load Dashboard Data",
  message = "An error occurred while connecting to the warehouse database. Please verify your connection or try again.",
  onRetry,
  className = "",
}: DashboardErrorStateProps) {
  return (
    <div
      className={`p-8 bg-rose-50/70 border border-rose-200 rounded-2xl text-center space-y-3 max-w-lg mx-auto my-12 ${className}`}
    >
      <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-rose-950">{title}</h3>
        <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <Button
            size="sm"
            onClick={onRetry}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </Button>
        </div>
      )}
    </div>
  );
}
