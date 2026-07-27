"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { DueItem } from "@/types/student";

interface StickySummaryBarProps {
  items: readonly DueItem[];
  walletBalance: number;
  isPending: boolean;
  onSubmit: () => void;
}

/**
 * Running total plus the submit action for Mass Payment (Module 1 §5.5).
 * Sticky bottom bar on mobile, sticky side panel on desktop.
 */
export function StickySummaryBar({ items, walletBalance, isPending, onSubmit }: StickySummaryBarProps) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const hasEnoughBalance = walletBalance >= total;
  const canSubmit = items.length > 0 && hasEnoughBalance && !isPending;

  return (
    <div className="sticky bottom-16 z-30 rounded-card border border-border-subtle bg-bg-surface p-5 shadow-soft md:bottom-6">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${item.type}:${item.id}`} className="flex items-start justify-between gap-4 text-sm">
            <span className="min-w-0 truncate text-text-secondary">{item.title}</span>
            <span className="shrink-0 tabular-nums text-text-primary">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4">
        <span className="text-sm font-medium text-text-primary">Total</span>
        <span className="font-display text-xl font-semibold tabular-nums text-text-primary">
          {formatCurrency(total)}
        </span>
      </div>

      <p className="mt-2 text-xs text-text-secondary">
        Wallet balance: <span className="tabular-nums">{formatCurrency(walletBalance)}</span>
      </p>

      {!hasEnoughBalance && items.length > 0 ? (
        <p className="mt-2 text-xs text-state-danger">
          You need {formatCurrency(total - walletBalance)} more to pay these items.
        </p>
      ) : null}

      <Button className="mt-4 w-full" disabled={!canSubmit} loading={isPending} onClick={onSubmit}>
        Pay All Selected
      </Button>
    </div>
  );
}
