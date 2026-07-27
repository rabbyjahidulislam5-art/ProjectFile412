"use client";

import { cn } from "@/lib/utils";
import { passwordStrength } from "@/lib/validations/auth";

const BAR_COLORS = [
  "bg-state-danger",
  "bg-state-danger",
  "bg-state-warning",
  "bg-state-warning",
  "bg-state-success",
  "bg-state-success",
];

function PasswordStrengthMeter({ value }: { value: string }) {
  if (!value) return null;
  const { score, label } = passwordStrength(value);

  return (
    <div className="mt-1.5 w-full" aria-live="polite">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full bg-bg-elevated transition-colors duration-300",
              index < score && BAR_COLORS[score],
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  );
}

export { PasswordStrengthMeter };
