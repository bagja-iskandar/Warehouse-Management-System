"use client";

import React from "react";
import { LucideIcon, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-4 text-center bg-white border border-slate-200 border-dashed rounded-2xl space-y-4 max-w-lg mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 mx-auto flex items-center justify-center">
        <Icon className="h-7 w-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <a href={actionHref}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-xl">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>{actionLabel}</span>
              </Button>
            </a>
          ) : (
            <Button
              onClick={onAction}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>{actionLabel}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
