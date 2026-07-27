"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PostpaidTab } from "@/types/student";

const STATUS_BADGE = {
  open: { variant: "pending", label: "Running" },
  billed: { variant: "overdue", label: "Billed" },
  paid: { variant: "paid", label: "Paid" },
} as const;

interface PostpaidTabListItemProps {
  tab: PostpaidTab;
  isPaying: boolean;
  onPay: (tabId: string) => void;
}

function monthLabel(monthPeriod: string): string {
  const [year, month] = monthPeriod.split("-");
  if (!year || !month) return monthPeriod;
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function PostpaidTabListItem({ tab, isPaying, onPay }: PostpaidTabListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const badge = STATUS_BADGE[tab.status];

  return (
    <div className="rounded-card border border-border-subtle bg-bg-surface">
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{tab.shop.name}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {monthLabel(tab.monthPeriod)} · {tab.charges.length} charge
            {tab.charges.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-semibold tabular-nums text-text-primary">
            {formatCurrency(tab.totalAmount)}
          </p>
          <Badge variant={badge.variant} className="mt-1">
            {badge.label}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-secondary transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded ? (
        <div className="border-t border-border-subtle px-5 py-4">
          {tab.charges.length === 0 ? (
            <p className="text-sm text-text-secondary">No charges on this tab yet.</p>
          ) : (
            <ul className="space-y-3">
              {tab.charges.map((charge) => (
                <li key={charge.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-primary">{charge.description ?? "Charge"}</p>
                    <p className="text-xs text-text-secondary">{formatDate(charge.chargedAt)}</p>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums text-text-primary">
                    {formatCurrency(charge.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab.status === "billed" ? (
        <div className="border-t border-border-subtle p-5">
          <Button loading={isPaying} onClick={() => onPay(tab.id)}>
            Pay Monthly Tab
          </Button>
        </div>
      ) : null}
    </div>
  );
}
