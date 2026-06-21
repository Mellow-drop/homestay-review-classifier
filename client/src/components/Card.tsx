import React from "react";
import { cn } from "@/lib/utils";

interface CustomCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function Card({
  title,
  description,
  icon,
  badge,
  className,
  children,
}: CustomCardProps) {
  return (
    <div
      className={cn(
        "glass-card transition-all duration-200 hover:scale-[1.01] hover:shadow-lg border rounded-2xl p-6 flex flex-col justify-between gap-4 h-full w-full",
        className
      )}
    >
      <div className="space-y-4">
        {/* Header containing icon and badge */}
        <div className="flex items-center justify-between">
          {icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-800 dark:text-slate-200">
              {icon}
            </div>
          )}
          {badge && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
              {badge}
            </span>
          )}
        </div>

        {/* Content containing Title and Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            {description}
          </p>
        </div>
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
