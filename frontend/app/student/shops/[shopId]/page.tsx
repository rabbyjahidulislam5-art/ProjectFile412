"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { ShopCard } from "@/components/student/shop-card";
import { PrepaidPlanCard } from "@/components/student/prepaid-plan-card";
import { QrCodeDisplay } from "@/components/student/qr-code-display";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { toast } from "@/components/ui/use-toast";
import { ApiClientError } from "@/lib/api-client";
import { getPrepaidPlans, getShop, purchasePrepaidPlan, queryKeys } from "@/lib/api/student";
import { formatCurrency } from "@/lib/format";
import type { PrepaidPlan } from "@/types/student";

export default function ShopDetailPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [planToConfirm, setPlanToConfirm] = useState<PrepaidPlan | null>(null);

  const shopQuery = useQuery({ queryKey: queryKeys.shop(shopId), queryFn: () => getShop(shopId) });

  const isFoodShop = shopQuery.data?.shop.category === "food_beverage";
  const plansQuery = useQuery({
    queryKey: queryKeys.prepaidPlans(shopId),
    queryFn: () => getPrepaidPlans(shopId),
    enabled: isFoodShop,
  });

  const purchase = useMutation({
    mutationFn: (planId: string) => purchasePrepaidPlan(shopId, planId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance });
      void queryClient.invalidateQueries({ queryKey: queryKeys.prepaidBalances });
      setPlanToConfirm(null);
      toast({ title: "Prepaid plan activated", description: result.message });
      router.push("/student/food");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Purchase failed",
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
    },
  });

  if (shopQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (shopQuery.isError) {
    return (
      <EmptyState
        icon={Store}
        title="Shop not found"
        description="This shop may have been removed."
        action={
          <Button asChild variant="secondary" size="sm" className="w-auto">
            <Link href="/student/shops">Back to Shops</Link>
          </Button>
        }
      />
    );
  }

  const { shop } = shopQuery.data;
  const isActive = shop.status === "active";

  return (
    <div className="space-y-6">
      <ShopCard shop={shop} variant="header" />

      {/* Split-panel on desktop so the page keeps its own bookmarkable URL. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <QrCodeDisplay token={shop.qrToken} label="Scan this code at the counter to pay" />

          <Button
            className="w-full"
            disabled={!isActive}
            onClick={() => router.push(`/student/scan?shopId=${shop.id}`)}
          >
            Pay Now
          </Button>

          {!isActive ? (
            <p className="text-center text-xs text-state-warning">This shop is temporarily unavailable.</p>
          ) : null}
        </div>

        {isFoodShop ? (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-text-primary">Prepaid Plans</h2>

            {plansQuery.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : plansQuery.data && plansQuery.data.plans.length > 0 ? (
              <div className="space-y-3">
                {plansQuery.data.plans.map((plan) => (
                  <PrepaidPlanCard
                    key={plan.id}
                    mode="purchase"
                    plan={plan}
                    disabled={!isActive}
                    isPending={purchase.isPending && planToConfirm?.id === plan.id}
                    onBuy={() => setPlanToConfirm(plan)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-card border border-border-subtle bg-bg-surface p-6">
                <p className="text-sm text-text-secondary">No prepaid plans available right now.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <Modal open={planToConfirm !== null} onOpenChange={(open) => !open && setPlanToConfirm(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirm purchase</ModalTitle>
            <ModalDescription>
              {planToConfirm
                ? `${planToConfirm.name} costs ${formatCurrency(planToConfirm.price)} and stays valid for ${planToConfirm.validityDays} days. This amount will be debited from your wallet.`
                : null}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setPlanToConfirm(null)}>
              Cancel
            </Button>
            <Button
              loading={purchase.isPending}
              onClick={() => planToConfirm && purchase.mutate(planToConfirm.id)}
            >
              Confirm & Pay
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
