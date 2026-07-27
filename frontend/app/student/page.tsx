"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileWarning, Plus, RefreshCw, ScanLine, Utensils, type LucideIcon } from "lucide-react";
import { WalletBalanceCard } from "@/components/student/wallet-balance-card";
import { TransactionRow } from "@/components/student/transaction-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getTransactions, queryKeys } from "@/lib/api/student";

const QUICK_ACTIONS: ReadonlyArray<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Add Money", href: "/student/wallet/add-money", icon: Plus },
  { label: "Scan to Pay", href: "/student/scan", icon: ScanLine },
  { label: "View Dues", href: "/student/dues", icon: FileWarning },
  { label: "Food & Tab", href: "/student/food", icon: Utensils },
];

// Desktop shows a longer feed than mobile (Module 1 §3.1). Fetching the larger
// set once and slicing per breakpoint avoids a second request on resize.
const ACTIVITY_LIMIT = 8;

function QuickActionRow() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex flex-col items-center justify-center gap-2 rounded-card border border-border-subtle bg-bg-surface p-4 text-center transition-colors hover:border-accent-primary/40 hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
        >
          <action.icon className="h-5 w-5 text-accent-primary" />
          <span className="text-xs font-medium text-text-primary">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

function RecentActivity() {
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.transactions({ limit: ACTIVITY_LIMIT }),
    queryFn: () => getTransactions({ limit: ACTIVITY_LIMIT }),
  });

  return (
    <section className="rounded-card border border-border-subtle bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <h2 className="text-sm font-medium text-text-primary">Recent Activity</h2>
        {data && data.transactions.length > 0 ? (
          <Link href="/student/ledger" className="text-xs text-accent-secondary hover:underline">
            View All
          </Link>
        ) : null}
      </div>

      <div className="px-5">
        {isPending ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-text-secondary">Couldn&apos;t load your activity.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-auto"
              loading={isRefetching}
              onClick={() => void refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : data.transactions.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Add money to get started."
            action={
              <Button asChild size="sm" className="w-auto">
                <Link href="/student/wallet/add-money">Add Money</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {/* Last 5 on mobile, all 8 from `md` up. */}
            {data.transactions.map((transaction, index) => (
              <li key={transaction.id} className={index >= 5 ? "hidden md:block" : undefined}>
                <TransactionRow transaction={transaction} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function StudentHomePage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WalletBalanceCard />
        </div>
        <div className="lg:col-span-1">
          <QuickActionRow />
        </div>
      </div>

      <RecentActivity />
    </div>
  );
}
