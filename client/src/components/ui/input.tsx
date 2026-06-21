import * as React from "react";
import { cn } from "@/lib/utils";
import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";

/**
 * Props for the custom Input component.
 * @property {string} [label] - Optional descriptive label rendered above the input field.
 * @property {string} [error] - Optional validation error message rendered below the input field.
 * @property {function} [onChange] - Optional change event handler.
 */
export interface InputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  label?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Reusable form input component supporting labels, validation errors, and composition events.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, onKeyDown, onCompositionStart, onCompositionEnd, onChange, ...props }, ref) => {
    const dialogComposition = useDialogComposition();

    const {
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
      onKeyDown: handleKeyDown,
    } = useComposition<HTMLInputElement>({
      onKeyDown: (e) => {
        const isComposing = (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();
        if (e.key === "Enter" && isComposing) {
          return;
        }
        onKeyDown?.(e);
      },
      onCompositionStart: (e) => {
        dialogComposition.setComposing(true);
        onCompositionStart?.(e);
      },
      onCompositionEnd: (e) => {
        dialogComposition.markCompositionEnd();
        setTimeout(() => {
          dialogComposition.setComposing(false);
        }, 100);
        onCompositionEnd?.(e);
      },
    });

    const inputElement = (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-slate-400 selection:bg-primary selection:text-primary-foreground dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 h-10 w-full min-w-0 rounded-xl border bg-transparent px-4 py-2 text-sm shadow-xs transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:border-slate-400 dark:focus-visible:border-slate-700 focus-visible:ring-1 focus-visible:ring-slate-300/30",
          error && "border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/10",
          className
        )}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onChange={onChange}
        {...props}
      />
    );

    if (label || error) {
      return (
        <div className="flex flex-col gap-1.5 w-full">
          {label && (
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </label>
          )}
          {inputElement}
          {error && (
            <span className="text-xs font-semibold text-rose-500 mt-0.5 leading-none">
              {error}
            </span>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = "Input";

export { Input };
