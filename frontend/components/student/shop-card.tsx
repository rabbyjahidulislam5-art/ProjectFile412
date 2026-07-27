import Link from "next/link";
import Image from "next/image";
import { Star, Store } from "lucide-react";
import { formatShopCategory } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Shop } from "@/types/student";

interface ShopCardProps {
  shop: Shop;
  /** `grid` is the directory tile; `header` is the Shop Detail banner. */
  variant?: "grid" | "header";
}

function ShopLogo({ shop, size }: { shop: Shop; size: number }) {
  if (!shop.logoUrl) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-control bg-bg-elevated text-text-secondary"
        style={{ width: size, height: size }}
      >
        <Store className="h-1/2 w-1/2" />
      </div>
    );
  }

  return (
    <Image
      src={shop.logoUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-control object-cover"
      unoptimized
    />
  );
}

function ShopMeta({ shop }: { shop: Shop }) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <span>{formatShopCategory(shop.category)}</span>
      {shop.rating > 0 ? (
        <>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star className="h-3 w-3 fill-accent-primary text-accent-primary" />
            {shop.rating.toFixed(1)}
          </span>
        </>
      ) : null}
    </div>
  );
}

export function ShopCard({ shop, variant = "grid" }: ShopCardProps) {
  if (variant === "header") {
    return (
      <div className="flex items-center gap-4 rounded-card border border-border-subtle bg-bg-surface p-5">
        <ShopLogo shop={shop} size={64} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold text-text-primary">{shop.name}</h1>
          <div className="mt-1">
            <ShopMeta shop={shop} />
          </div>
          {shop.status !== "active" ? (
            <p className="mt-2 text-xs text-state-warning">This shop is temporarily unavailable.</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/student/shops/${shop.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-card border border-border-subtle bg-bg-surface p-4 transition-colors",
        "hover:border-accent-primary/40 hover:bg-bg-elevated",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary",
      )}
    >
      <ShopLogo shop={shop} size={48} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{shop.name}</p>
        <div className="mt-1">
          <ShopMeta shop={shop} />
        </div>
      </div>
    </Link>
  );
}
