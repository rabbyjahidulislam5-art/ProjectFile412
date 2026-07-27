"use client";

import { CalendarClock, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PrepaidBalance, PrepaidPlan } from "@/types/student";

interface PurchaseModeProps {
  mode: "purchase";
  plan: PrepaidPlan;
  disabled?: boolean;
  isPending?: boolean;
  onBuy: (planId: string) => void;
}

interface OwnedModeProps {
  mode: "owned";
  balance: PrepaidBalance;
  onTopUp: (shopId: string) => void;
}

type PrepaidPlanCardProps = PurchaseModeProps | OwnedModeProps;

/**
 * One component, two faces (Module 1 §5.4): a purchasable plan on Shop Detail,
 * and the student's own remaining balance on Food Subscription & Tab.
 */
export function PrepaidPlanCard(props: PrepaidPlanCardProps) {
  if (props.mode === "purchase") {
    const { plan, disabled, isPending, onBuy } = props;
    return (
      <div className="rounded-card border border-border-subtle bg-bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Ticket className="h-4 w-4 text-accent-primary" />
              {plan.name}
            </p>
            <p className="mt-1 text-xs text-text-secondary">Valid for {plan.validityDays} days</p>
          </div>
          <p className="shrink-0 font-display text-lg font-semibold tabular-nums text-text-primary">
            {formatCurrency(plan.price)}
          </p>
        </div>
        <Button className="mt-4" disabled={disabled} loading={isPending} onClick={() => onBuy(plan.id)}>
          Buy Prepaid Plan
        </Button>
      </div>
    );
  }

  const { balance, onTopUp } = props;
  const isExpired = balance.status === "expired";

  return (
    <div className="rounded-card border border-border-subtle bg-bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{balance.shop.name}</p>
          <p className="mt-1 truncate text-xs text-text-secondary">{balance.plan.name}</p>
        </div>
        <Badge variant={isExpired ? "waived" : "paid"}>{isExpired ? "Expired" : "Active"}</Badge>
      </div>

      <p className="mt-4 font-display text-2xl font-semibold tabular-nums text-text-primary">
        {formatCurrency(balance.balance)}
      </p>
      <p className="text-xs text-text-secondary">Remaining balance</p>

      {balance.expiresAt ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary">
          <CalendarClock className="h-3.5 w-3.5" />
          {isExpired ? "Expired" : "Expires"} {formatDate(balance.expiresAt)}
        </p>
      ) : null}

      <Button
        variant="secondary"
        size="sm"
        className="mt-4"
        disabled={balance.shop.status !== "active"}
        onClick={() => onTopUp(balance.shop.id)}
      >
        Top Up
      </Button>
    </div>
  );
}
