"use client";

import { Check, Smartphone, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentProvider = "bkash" | "sslcommerz";

const PROVIDERS = [
  { value: "bkash", label: "bKash", description: "Mobile wallet", icon: Smartphone },
  { value: "sslcommerz", label: "SSLCommerz", description: "Card & bank", icon: CreditCard },
] as const;

interface PaymentMethodCardProps {
  value: PaymentProvider | null;
  onChange: (value: PaymentProvider) => void;
}

// Radio-group semantics with card affordances (Module 1 §5.1).
export function PaymentMethodCard({ value, onChange }: PaymentMethodCardProps) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PROVIDERS.map((provider) => {
        const isSelected = provider.value === value;
        return (
          <button
            key={provider.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(provider.value)}
            className={cn(
              "relative flex items-center gap-3 rounded-card border p-4 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary",
              isSelected
                ? "border-accent-primary bg-accent-primary/5"
                : "border-border-subtle bg-bg-surface hover:border-border-subtle hover:bg-bg-elevated",
            )}
          >
            <provider.icon
              className={cn("h-5 w-5 shrink-0", isSelected ? "text-accent-primary" : "text-text-secondary")}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-text-primary">{provider.label}</span>
              <span className="block text-xs text-text-secondary">{provider.description}</span>
            </span>
            {isSelected ? (
              <Check className="absolute right-3 top-3 h-4 w-4 text-accent-primary" strokeWidth={3} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
