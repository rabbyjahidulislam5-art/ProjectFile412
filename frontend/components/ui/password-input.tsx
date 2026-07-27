"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputProps } from "@/components/ui/input";

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            placeholder=" "
            aria-invalid={Boolean(error)}
            className={cn(
              "peer w-full rounded-control border bg-bg-surface px-4 pb-2 pt-5 pr-11 text-sm text-text-primary outline-none transition-colors placeholder-shown:pt-3.5",
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
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:text-accent-secondary"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error ? <p className="mt-1.5 text-xs text-state-danger animate-in fade-in slide-in-from-top-1">{error}</p> : null}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
