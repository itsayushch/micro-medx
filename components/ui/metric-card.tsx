"use client";

import * as React from "react";
import { ArrowUp, ArrowRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  hint?: string;
  icon?: React.ReactNode;
  variant?: "default" | "critical" | "warning" | "success" | "teal" | "purple";
  onAction?: () => void;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend = "up",
  hint,
  icon,
  variant = "default",
  onAction,
  className,
}: MetricCardProps) {
  const isUp = trend === "up";

  const variantStyles = {
    default: {
      border: "border-slate-200/90 hover:border-slate-300",
      iconBg: "bg-blue-50 text-blue-700 ring-blue-500/20",
      accent: "bg-blue-600",
    },
    critical: {
      border: "border-rose-200/90 hover:border-rose-300",
      iconBg: "bg-rose-50 text-rose-700 ring-rose-500/20",
      accent: "bg-rose-500",
    },
    warning: {
      border: "border-amber-200/90 hover:border-amber-300",
      iconBg: "bg-amber-50 text-amber-700 ring-amber-500/20",
      accent: "bg-amber-500",
    },
    success: {
      border: "border-emerald-200/90 hover:border-emerald-300",
      iconBg: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
      accent: "bg-emerald-500",
    },
    teal: {
      border: "border-teal-200/90 hover:border-teal-300",
      iconBg: "bg-teal-50 text-teal-700 ring-teal-500/20",
      accent: "bg-teal-500",
    },
    purple: {
      border: "border-purple-200/90 hover:border-purple-300",
      iconBg: "bg-purple-50 text-purple-700 ring-purple-500/20",
      accent: "bg-purple-600",
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4.5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between",
        style.border,
        className
      )}
    >
      <div className={cn("absolute top-0 left-0 right-0 h-1", style.accent)} />

      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-poppins">
          {title}
        </p>
        {icon ? (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center ring-1 group-hover:scale-105 transition-transform shrink-0",
              style.iconBg
            )}
          >
            {icon}
          </div>
        ) : (
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors"
            aria-label={`${title} options`}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums font-poppins">
              {value}
            </p>
            {change && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isUp
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                <ArrowUp className={cn("h-2.5 w-2.5", !isUp && "rotate-180")} />
                {change}
              </span>
            )}
          </div>
          {hint && (
            <p className="mt-1 text-[11px] font-medium text-slate-500 line-clamp-1">
              {hint}
            </p>
          )}
        </div>

        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-2xs hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label={`Open ${title}`}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
