import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  children,
  actions,
  className = "",
}: FilterBarProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8 text-xs h-9.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50 hover:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {children && (
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {children}
          </div>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
