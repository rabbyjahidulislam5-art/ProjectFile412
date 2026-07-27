"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks } from "lucide-react";
import { DueListItem } from "@/components/student/due-list-item";
import { StickySummaryBar } from "@/components/student/sticky-summary-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { ApiClientError } from "@/lib/api-client";
import { getDues, getWalletBalance, massPayDues, queryKeys } from "@/lib/api/student";
import { clearMassPaySelection, readMassPaySelection } from "@/lib/mass-pay-selection";
import type { DueItem, DueItemRef } from "@/types/student";

export default function MassPayPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selection, setSelection] = useState<DueItemRef[] | null>(null);

  // Session storage is only readable after mount, so the selection is hydrated
  // in an effect rather than during render.
  useEffect(() => {
    setSelection(readMassPaySelection());
  }, []);

  const duesQuery = useQuery({ queryKey: queryKeys.dues, queryFn: getDues });
  const { data: wallet } = useQuery({ queryKey: queryKeys.walletBalance, queryFn: getWalletBalance });

  // Re-resolve the selection against freshly fetched dues so anything paid or
  // waived in another tab silently drops out before submission.
  const items = useMemo<DueItem[]>(() => {
    if (!duesQuery.data || !selection) return [];
    const all = [
      ...duesQuery.data.semesterFees,
      ...duesQuery.data.libraryFines,
      ...duesQuery.data.adminFines,
      ...duesQuery.data.postpaidTabs,
    ];
    return selection
      .map((ref) => all.find((item) => item.type === ref.type && item.id === ref.id))
      .filter((item): item is DueItem => item !== undefined && item.canPay);
  }, [duesQuery.data, selection]);

  const massPay = useMutation({
    mutationFn: massPayDues,
    onSuccess: (result) => {
      clearMassPaySelection();
      void queryClient.invalidateQueries({ queryKey: queryKeys.dues });
      void queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance });
      void queryClient.invalidateQueries({ queryKey: queryKeys.postpaidTabs });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
      toast({ title: "All selected dues cleared", description: result.message });
      router.push("/student/dues");
    },
    onError: (error) => {
      // A 409 means the batch went stale between selection and submit; the whole
      // thing rolled back, so refetching is enough to show the current truth.
      if (error instanceof ApiClientError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.dues });
      }
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
    },
  });

  if (duesQuery.isPending || selection === null) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Nothing selected to pay"
        description="Pick the fees or fines you'd like to clear, then continue."
        action={
          <Button asChild variant="secondary" size="sm" className="w-auto">
            <Link href="/student/dues">Back to Dues &amp; Fines</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Mass Payment</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review the {items.length} item{items.length === 1 ? "" : "s"} below. They&apos;re paid together in a
          single transaction.
        </p>
      </div>

      {/* Two-column on desktop: the summary rides alongside rather than below. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ul className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <DueListItem key={`${item.type}:${item.id}`} item={item} />
          ))}
        </ul>

        <div className="lg:col-span-1">
          <StickySummaryBar
            items={items}
            walletBalance={wallet?.balance ?? 0}
            isPending={massPay.isPending}
            onSubmit={() => massPay.mutate(items.map((item) => ({ type: item.type, id: item.id })))}
          />

          {wallet && wallet.balance < items.reduce((sum, item) => sum + item.amount, 0) ? (
            <Button asChild variant="secondary" className="mt-3 w-full">
              <Link href="/student/wallet/add-money">Add Money</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
