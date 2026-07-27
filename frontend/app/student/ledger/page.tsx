"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Receipt, SearchX } from "lucide-react";
import { TransactionRow } from "@/components/student/transaction-row";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getShops, getTransactions, queryKeys, type TransactionFilters } from "@/lib/api/student";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Transaction, TransactionType } from "@/types/student";

const TYPE_OPTIONS: ReadonlyArray<{ value: TransactionType | ""; label: string }> = [
  { value: "", label: "All types" },
  { value: "deposit", label: "Money added" },
  { value: "shop_payment", label: "Shop payment" },
  { value: "fee_payment", label: "Fee payment" },
  { value: "fine_payment", label: "Fine payment" },
  { value: "prepaid_purchase", label: "Prepaid plan" },
  { value: "postpaid_settlement", label: "Food tab settled" },
  { value: "mass_payment", label: "Multiple dues paid" },
  { value: "refund", label: "Refund" },
  { value: "waiver_adjustment", label: "Waiver adjustment" },
];

const STATUS_BADGE: Record<Transaction["status"], { variant: BadgeProps["variant"]; label: string }> = {
  success: { variant: "paid", label: "Success" },
  pending: { variant: "pending", label: "Pending" },
  failed: { variant: "overdue", label: "Failed" },
};

const selectClassName =
  "w-full rounded-control border border-border-subtle bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-secondary focus:ring-1 focus:ring-accent-secondary";

export default function LedgerPage() {
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 20 });
  const [dateError, setDateError] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => getTransactions(filters),
  });

  const { data: shopsData } = useQuery({ queryKey: queryKeys.shops(), queryFn: () => getShops() });

  // Any filter change resets to page 1 — staying on page 5 of a narrower result
  // set would show an empty page.
  function updateFilter(patch: Partial<TransactionFilters>) {
    const next = { ...filters, ...patch, page: 1 };

    if (next.from && next.to && new Date(next.from) > new Date(next.to)) {
      setDateError("Start date must be on or before the end date.");
      return;
    }

    setDateError(null);
    setFilters(next);
  }

  const hasActiveFilters = Boolean(filters.type || filters.from || filters.to || filters.shop_id);

  const columns: ReadonlyArray<DataTableColumn<Transaction>> = [
    {
      key: "date",
      header: "Date",
      render: (row) => <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "details",
      header: "Details",
      render: (row) => <TransactionRow transaction={row} />,
      // The mobile card already leads with this via `mobileTitle`.
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={STATUS_BADGE[row.status].variant}>{STATUS_BADGE[row.status].label}</Badge>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span className="whitespace-nowrap tabular-nums">
          {row.direction === "credit" ? "+" : "−"}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Transactions</h1>

      <div className="grid grid-cols-1 gap-3 rounded-card border border-border-subtle bg-bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select
          aria-label="Filter by type"
          className={selectClassName}
          value={filters.type ?? ""}
          onChange={(event) =>
            updateFilter({ type: (event.target.value || undefined) as TransactionType | undefined })
          }
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by shop"
          className={selectClassName}
          value={filters.shop_id ?? ""}
          onChange={(event) => updateFilter({ shop_id: event.target.value || undefined })}
        >
          <option value="">All shops</option>
          {shopsData?.shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>

        <Input
          label="From"
          type="date"
          value={filters.from ?? ""}
          onChange={(event) => updateFilter({ from: event.target.value || undefined })}
        />
        <Input
          label="To"
          type="date"
          value={filters.to ?? ""}
          onChange={(event) => updateFilter({ to: event.target.value || undefined })}
          error={dateError ?? undefined}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data?.transactions ?? []}
        rowKey={(row) => row.id}
        isLoading={isPending}
        pagination={data?.pagination}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        mobileTitle={(row) => <TransactionRow transaction={row} />}
        emptyState={
          hasActiveFilters ? (
            <EmptyState
              icon={SearchX}
              title="No matches for this filter"
              description="Try widening the date range or clearing a filter."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-auto"
                  onClick={() => {
                    setDateError(null);
                    setFilters({ page: 1, limit: 20 });
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Your wallet activity will show up here."
              action={
                <Button asChild size="sm" className="w-auto">
                  <Link href="/student/wallet/add-money">Add Money</Link>
                </Button>
              }
            />
          )
        }
      />
    </div>
  );
}
