"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, Ticket } from "lucide-react";
import { PrepaidPlanCard } from "@/components/student/prepaid-plan-card";
import { PostpaidTabListItem } from "@/components/student/postpaid-tab-list-item";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { ApiClientError } from "@/lib/api-client";
import { getPostpaidTabs, getPrepaidBalances, payDue, queryKeys } from "@/lib/api/student";
import { useRouter } from "next/navigation";

type Segment = "prepaid" | "postpaid";

const SEGMENTS = [
  { value: "prepaid" as const, label: "Prepaid" },
  { value: "postpaid" as const, label: "Postpaid" },
];

function PrepaidSection() {
  const router = useRouter();
  const { data, isPending } = useQuery({
    queryKey: queryKeys.prepaidBalances,
    queryFn: getPrepaidBalances,
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-44 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.balances.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="No active meal plans"
        description="Browse food shops to get started."
        action={
          <Button asChild size="sm" className="w-auto">
            <Link href="/student/shops">Browse Shops</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.balances.map((balance) => (
        <PrepaidPlanCard
          key={balance.id}
          mode="owned"
          balance={balance}
          onTopUp={(shopId) => router.push(`/student/shops/${shopId}`)}
        />
      ))}
    </div>
  );
}

function PostpaidSection() {
  const queryClient = useQueryClient();
  const [payingTabId, setPayingTabId] = useState<string | null>(null);

  const { data, isPending } = useQuery({ queryKey: queryKeys.postpaidTabs, queryFn: getPostpaidTabs });

  const pay = useMutation({
    mutationFn: (tabId: string) => payDue({ type: "postpaid_tab", id: tabId }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.postpaidTabs });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dues });
      void queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance });
      toast({ title: "Tab settled", description: result.message });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
    },
    onSettled: () => setPayingTabId(null),
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.tabs.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No open food tabs"
        description="Charges added at a food shop counter will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.tabs.map((tab) => (
        <PostpaidTabListItem
          key={tab.id}
          tab={tab}
          isPaying={payingTabId === tab.id}
          onPay={(tabId) => {
            setPayingTabId(tabId);
            pay.mutate(tabId);
          }}
        />
      ))}
    </div>
  );
}

export default function FoodPage() {
  const [segment, setSegment] = useState<Segment>("prepaid");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Food &amp; Tab</h1>

      {/* Mobile: one section at a time. Desktop: both visible side by side. */}
      <div className="lg:hidden">
        <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />
        <div className="mt-4">{segment === "prepaid" ? <PrepaidSection /> : <PostpaidSection />}</div>
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-primary">Prepaid Plans</h2>
          <PrepaidSection />
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-primary">Postpaid Tabs</h2>
          <PostpaidSection />
        </section>
      </div>
    </div>
  );
}
