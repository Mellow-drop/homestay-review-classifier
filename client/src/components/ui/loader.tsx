import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  variant?: "spinner" | "skeleton";
  className?: string;
  size?: "sm" | "md" | "lg";
  count?: number; // For skeleton lines
}

export function Loader({
  variant = "spinner",
  className,
  size = "md",
  count = 3,
}: LoaderProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-2.5 w-full animate-pulse", className)}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "bg-slate-200 dark:bg-slate-800 rounded-lg",
              idx === count - 1 ? "w-2/3 h-4" : "w-full h-4"
            )}
          />
        ))}
      </div>
    );
  }

  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("flex justify-center items-center p-4", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-slate-200 dark:border-slate-800 border-t-slate-800 dark:border-t-slate-100",
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
export default Loader;
