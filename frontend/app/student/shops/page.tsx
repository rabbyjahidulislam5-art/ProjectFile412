"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Store } from "lucide-react";
import { CategoryFilterChips } from "@/components/student/category-filter-chips";
import { ShopCard } from "@/components/student/shop-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getShops, queryKeys } from "@/lib/api/student";
import type { ShopCategory } from "@/types/student";

export default function ShopDirectoryPage() {
  const [category, setCategory] = useState<ShopCategory | "all">("all");

  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.shops(category === "all" ? undefined : category),
    queryFn: () => getShops(category === "all" ? undefined : category),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Shops</h1>

      <CategoryFilterChips value={category} onChange={setCategory} />

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-card border border-state-danger/30 bg-bg-surface p-6 text-center">
          <p className="text-sm text-text-secondary">Couldn&apos;t load shops.</p>
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
      ) : data.shops.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No shops in this category yet"
          description="Try another category to see what's open on campus."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
}
