"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getWalletBalance, queryKeys } from "@/lib/api/student";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { formatCurrency } from "@/lib/format";

/**
 * The app's signature component (Module 0 §3.3). The count-up on the hero
 * variant is the one deliberate flourish in an otherwise banking-flat UI.
 */
export function WalletBalanceCard({ variant = "hero" }: { variant?: "hero" | "chip" }) {
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.walletBalance,
    queryFn: getWalletBalance,
  });

  const animated = useCountUp(data?.balance ?? 0);

  if (variant === "chip") {
    return (
      <Link
        href="/student"
        className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1.5"
      >
        <Wallet className="h-3.5 w-3.5 text-accent-primary" />
        <span className="text-xs font-medium tabular-nums text-text-primary">
          {isPending || isError ? "—" : formatCurrency(data.balance)}
        </span>
      </Link>
    );
  }

  if (isPending) {
    return (
      <div className="rounded-card border border-border-subtle bg-bg-surface p-6 shadow-soft">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-10 w-48" />
        <Skeleton className="mt-6 h-11 w-full sm:w-40" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-state-danger/30 bg-bg-surface p-6">
        <p className="text-sm font-medium text-text-primary">Couldn&apos;t load your balance</p>
        <p className="mt-1 text-sm text-text-secondary">Check your connection and try again.</p>
        <Button variant="secondary" size="sm" className="mt-4" loading={isRefetching} onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-card border border-border-subtle bg-gradient-to-br from-bg-elevated to-bg-surface p-6 shadow-soft">
      {/* Restrained gold wash — reads as premium without competing with the figure. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-primary/10 blur-3xl"
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-text-secondary">
          <Wallet className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Wallet Balance</span>
        </div>

        <p className="mt-3 font-display text-4xl font-semibold tabular-nums text-text-primary sm:text-5xl">
          {formatCurrency(animated)}
        </p>
        <p className="mt-1 text-xs text-text-secondary">{data.currency} · Available to spend</p>

        <Button asChild className="mt-6">
          <Link href="/student/wallet/add-money">
            <Plus className="h-4 w-4" />
            Add Money
          </Link>
        </Button>
      </div>
    </div>
  );
}
