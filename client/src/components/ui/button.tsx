import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button component variants configured via class-variance-authority.
 * Supports primary, secondary, outline, destructive, ghost, and link variants, and sm, md, lg, and icon sizes.
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] shadow-xs cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-950",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        outline: "border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/50",
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60",
        ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-lg gap-1.5 px-3 text-xs",
        md: "h-10 rounded-xl px-4 py-2 text-sm",
        lg: "h-12 rounded-xl px-6 py-3 text-base",
        default: "h-9 px-4 py-2",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

/**
 * Props for the custom Button component.
 * Inherits standard HTML button elements attributes and supports VariantProps.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * Reusable custom Button component supporting various size/style configurations and interactive animations.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    // Map existing code variants to new custom variants to guarantee compatibility
    let resolvedVariant = variant;
    if (variant === "default") resolvedVariant = "primary";

    let resolvedSize = size;
    if (size === "default") resolvedSize = "md";

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
