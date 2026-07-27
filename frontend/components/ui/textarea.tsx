import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;

    return (
      <div className="w-full">
        <label htmlFor={textareaId} className="mb-1.5 block text-xs font-medium text-text-secondary">
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-control border bg-bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors",
            "border-border-subtle placeholder:text-text-secondary focus:border-accent-secondary focus:ring-1 focus:ring-accent-secondary",
            error && "border-state-danger focus:border-state-danger focus:ring-state-danger",
            className,
          )}
          {...props}
        />
        {error ? <p className="mt-1.5 text-xs text-state-danger">{error}</p> : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
