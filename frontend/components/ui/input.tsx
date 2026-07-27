import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            placeholder=" "
            aria-invalid={Boolean(error)}
            className={cn(
              "peer w-full rounded-control border bg-bg-surface px-4 pb-2 pt-5 text-sm text-text-primary outline-none transition-colors placeholder-shown:pt-3.5",
              "border-border-subtle focus:border-accent-secondary focus:ring-1 focus:ring-accent-secondary",
              error && "border-state-danger focus:border-state-danger focus:ring-state-danger",
              className,
            )}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute left-4 top-2 text-xs text-text-secondary transition-all",
              "peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:text-accent-secondary",
            )}
          >
            {label}
          </label>
        </div>
        {error ? <p className="mt-1.5 text-xs text-state-danger">{error}</p> : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
