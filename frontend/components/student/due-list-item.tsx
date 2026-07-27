"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DueItem, DueItemStatus } from "@/types/student";

const STATUS_PRESENTATION: Record<DueItemStatus, { variant: BadgeProps["variant"]; label: string }> = {
  pending: { variant: "pending", label: "Pending" },
  overdue: { variant: "overdue", label: "Overdue" },
  paid: { variant: "paid", label: "Paid" },
  waived: { variant: "waived", label: "Waived" },
  under_review: { variant: "under_review", label: "Under Review" },
};

interface DueListItemProps {
  item: DueItem;
  /** Omitted in read-only contexts such as the Mass Payment review list. */
  isSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onPay?: (item: DueItem) => void;
  onDispute?: (item: DueItem) => void;
  isPaying?: boolean;
}

export function DueListItem({
  item,
  isSelected,
  onSelectedChange,
  onPay,
  onDispute,
  isPaying = false,
}: DueListItemProps) {
  const status = STATUS_PRESENTATION[item.status];
  const isSelectable = item.canPay && onSelectedChange !== undefined;

  return (
    <li className="rounded-card border border-border-subtle bg-bg-surface p-4">
      <div className="flex items-start gap-3">
        {isSelectable ? (
          <Checkbox
            className="mt-1"
            checked={isSelected}
            onCheckedChange={(checked) => onSelectedChange?.(checked === true)}
            aria-label={`Select ${item.title} for payment`}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{item.title}</p>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {item.detail ? <p className="mt-1 text-xs text-text-secondary">{item.detail}</p> : null}
          {item.dueDate ? (
            <p className="mt-1 text-xs text-text-secondary">Due {formatDate(item.dueDate)}</p>
          ) : null}
        </div>

        <p className="shrink-0 font-display text-base font-semibold tabular-nums text-text-primary">
          {formatCurrency(item.amount)}
        </p>
      </div>

      {item.status === "under_review" ? (
        <p className="mt-3 text-xs text-state-warning">Appeal submitted — awaiting Admin Office review.</p>
      ) : null}

      {(item.canPay && onPay) || (item.canDispute && onDispute) ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {item.canPay && onPay ? (
            <Button size="sm" className="w-auto" loading={isPaying} onClick={() => onPay(item)}>
              Pay Now
            </Button>
          ) : null}
          {item.canDispute && onDispute ? (
            <Button variant="ghost" size="sm" className="w-auto" onClick={() => onDispute(item)}>
              Dispute
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
