import {
  BookX,
  CheckCircle2,
  GraduationCap,
  ListChecks,
  PlusCircle,
  Receipt,
  RotateCcw,
  ShieldAlert,
  Store,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import type { Transaction } from "@/types/student";

// Fixed icon + label per transaction type (Module 1 §3.9 business logic).
const TYPE_PRESENTATION: Record<Transaction["type"], { icon: LucideIcon; label: string }> = {
  deposit: { icon: PlusCircle, label: "Money added" },
  shop_payment: { icon: Store, label: "Shop payment" },
  fine_payment: { icon: ShieldAlert, label: "Fine payment" },
  fee_payment: { icon: GraduationCap, label: "Fee payment" },
  prepaid_purchase: { icon: Ticket, label: "Prepaid plan" },
  postpaid_settlement: { icon: Receipt, label: "Food tab settled" },
  refund: { icon: RotateCcw, label: "Refund" },
  waiver_adjustment: { icon: CheckCircle2, label: "Waiver adjustment" },
  mass_payment: { icon: ListChecks, label: "Multiple dues paid" },
};

function describe(transaction: Transaction): string {
  if (transaction.shop) return transaction.shop.name;
  if (transaction.type === "fine_payment" && transaction.referenceType === "library_fine") return "Library";
  if (transaction.type === "deposit" && transaction.gateway) {
    return transaction.gateway === "bkash" ? "bKash" : "SSLCommerz";
  }
  return TYPE_PRESENTATION[transaction.type].label;
}

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  // A library fine reads better with the library icon than the generic shield.
  const isLibraryFine =
    transaction.type === "fine_payment" && transaction.referenceType === "library_fine";
  const Icon = isLibraryFine ? BookX : TYPE_PRESENTATION[transaction.type].icon;

  const isCredit = transaction.direction === "credit";
  const isFailed = transaction.status === "failed";

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          isCredit ? "bg-state-success/10 text-state-success" : "bg-bg-elevated text-text-secondary",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {TYPE_PRESENTATION[transaction.type].label}
        </p>
        <p className="truncate text-xs text-text-secondary">
          {describe(transaction)} · {formatRelativeTime(transaction.createdAt)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            isFailed
              ? "text-text-secondary line-through"
              : isCredit
                ? "text-state-success"
                : "text-text-primary",
          )}
        >
          {isCredit ? "+" : "−"}
          {formatCurrency(transaction.amount)}
        </p>
        {transaction.status !== "success" ? (
          <p
            className={cn(
              "text-[11px] capitalize",
              isFailed ? "text-state-danger" : "text-state-warning",
            )}
          >
            {transaction.status}
          </p>
        ) : null}
      </div>
    </div>
  );
}
