"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookX, CheckCircle2, GraduationCap, Receipt, RefreshCw, ShieldAlert, type LucideIcon } from "lucide-react";
import { DueListItem } from "@/components/student/due-list-item";
import { DisputeFineForm } from "@/components/student/dispute-fine-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { ApiClientError } from "@/lib/api-client";
import { getDues, getWalletBalance, payDue, queryKeys } from "@/lib/api/student";
import { formatCurrency } from "@/lib/format";
import { saveMassPaySelection } from "@/lib/mass-pay-selection";
import type { DueItem, DueItemRef, DuesResponse } from "@/types/student";

type CategoryKey = "semesterFees" | "libraryFines" | "adminFines" | "postpaidTabs";

const CATEGORIES: ReadonlyArray<{
  key: CategoryKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  emptyMessage: string;
}> = [
  {
    key: "semesterFees",
    label: "Semester Fees",
    shortLabel: "Fees",
    icon: GraduationCap,
    emptyMessage: "No pending semester fees. You're all clear.",
  },
  {
    key: "libraryFines",
    label: "Library Fines",
    shortLabel: "Library",
    icon: BookX,
    emptyMessage: "No pending library fines. You're all clear.",
  },
  {
    key: "adminFines",
    label: "Admin Fines",
    shortLabel: "Admin",
    icon: ShieldAlert,
    emptyMessage: "No pending admin fines. You're all clear.",
  },
  {
    key: "postpaidTabs",
    label: "Food Tabs",
    shortLabel: "Food",
    icon: Receipt,
    emptyMessage: "No billed food tabs.",
  },
];

function selectionKey(ref: DueItemRef): string {
  return `${ref.type}:${ref.id}`;
}

export default function DuesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Record<string, DueItem>>({});
  const [fineToDispute, setFineToDispute] = useState<DueItem | null>(null);
  const [payingItemKey, setPayingItemKey] = useState<string | null>(null);

  const duesQuery = useQuery({ queryKey: queryKeys.dues, queryFn: getDues });
  const { data: wallet } = useQuery({ queryKey: queryKeys.walletBalance, queryFn: getWalletBalance });

  const pay = useMutation({
    mutationFn: payDue,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dues });
      void queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance });
      void queryClient.invalidateQueries({ queryKey: queryKeys.postpaidTabs });
      toast({ title: "Payment successful", description: result.message });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
    },
    onSettled: () => setPayingItemKey(null),
  });

  const selectedItems = useMemo(() => Object.values(selected), [selected]);

  const isEverythingClear = useMemo(() => {
    if (!duesQuery.data) return false;
    return duesQuery.data.summary.pendingCount === 0 && duesQuery.data.summary.underReviewCount === 0;
  }, [duesQuery.data]);

  function toggleSelection(item: DueItem, isSelected: boolean) {
    setSelected((current) => {
      const next = { ...current };
      const key = selectionKey(item);
      if (isSelected) {
        next[key] = item;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  function handlePay(item: DueItem) {
    if (wallet && item.amount > wallet.balance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: `You need ${formatCurrency(item.amount - wallet.balance)} more to pay this item.`,
      });
      return;
    }
    setPayingItemKey(selectionKey(item));
    pay.mutate({ type: item.type, id: item.id });
  }

  function handleProceedToMassPay() {
    saveMassPaySelection(selectedItems.map((item) => ({ type: item.type, id: item.id })));
    router.push("/student/dues/mass-pay");
  }

  if (duesQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (duesQuery.isError) {
    return (
      <div className="rounded-card border border-state-danger/30 bg-bg-surface p-6 text-center">
        <p className="text-sm text-text-secondary">Couldn&apos;t load your dues.</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 w-auto"
          loading={duesQuery.isRefetching}
          onClick={() => void duesQuery.refetch()}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const dues = duesQuery.data;

  function renderCategory(category: (typeof CATEGORIES)[number]) {
    const items = dues[category.key as keyof DuesResponse] as DueItem[];

    if (items.length === 0) {
      return <EmptyState icon={category.icon} title={category.emptyMessage} />;
    }

    return (
      <ul className="space-y-3">
        {items.map((item) => {
          const key = selectionKey(item);
          return (
            <DueListItem
              key={key}
              item={item}
              isSelected={Boolean(selected[key])}
              onSelectedChange={(isSelected) => toggleSelection(item, isSelected)}
              onPay={handlePay}
              onDispute={setFineToDispute}
              isPaying={payingItemKey === key}
            />
          );
        })}
      </ul>
    );
  }

  if (isEverythingClear) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Dues &amp; Fines</h1>
        <EmptyState
          icon={CheckCircle2}
          title="You're all clear"
          description="No pending fees, fines, or food tabs."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Dues &amp; Fines</h1>
        <p className="text-sm text-text-secondary">
          {dues.summary.pendingCount} pending ·{" "}
          <span className="tabular-nums text-text-primary">{formatCurrency(dues.summary.pendingTotal)}</span>
        </p>
      </div>

      <Link
        href="/student/food"
        className="block rounded-card border border-border-subtle bg-bg-surface px-5 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
      >
        Manage your food tab →
      </Link>

      {/* Mobile: tabbed. Desktop: all categories side by side, no switching. */}
      <div className="lg:hidden">
        <Tabs defaultValue={CATEGORIES[0]!.key}>
          <TabsList>
            {CATEGORIES.map((category) => (
              <TabsTrigger key={category.key} value={category.key}>
                {category.shortLabel}
              </TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((category) => (
            <TabsContent key={category.key} value={category.key}>
              {renderCategory(category)}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((category) => (
          <section key={category.key} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <category.icon className="h-4 w-4 text-text-secondary" />
              {category.label}
            </h2>
            {renderCategory(category)}
          </section>
        ))}
      </div>

      {selectedItems.length > 0 ? (
        <div className="sticky bottom-20 z-30 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-subtle bg-bg-elevated p-4 shadow-soft md:bottom-6">
          <p className="text-sm text-text-primary">
            {selectedItems.length} selected ·{" "}
            <span className="tabular-nums">
              {formatCurrency(selectedItems.reduce((sum, item) => sum + item.amount, 0))}
            </span>
          </p>
          <Button size="sm" className="w-auto" onClick={handleProceedToMassPay}>
            Proceed
          </Button>
        </div>
      ) : null}

      <DisputeFineForm fine={fineToDispute} onClose={() => setFineToDispute(null)} />
    </div>
  );
}
