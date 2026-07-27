"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Pagination } from "@/types/student";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Right-align numeric columns so figures line up under `tabular-nums`. */
  align?: "left" | "right";
  /** Hidden in the mobile card layout — used for columns the card shows another way. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: ReadonlyArray<DataTableColumn<T>>;
  rows: readonly T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  /** Card headline on mobile, where a table would be unreadable. */
  mobileTitle?: (row: T) => React.ReactNode;
}

/**
 * One dataset, two presentations: a real table from `md` up, and a stacked
 * card per row below it. This is the standard table→card swap for every
 * back-office screen in the app (Module 0 §3.7).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyState,
  pagination,
  onPageChange,
  mobileTitle,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="space-y-4">
      {/* Desktop / tablet: true table */}
      <div className="hidden overflow-x-auto rounded-card border border-border-subtle md:block">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-surface">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary",
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border-subtle last:border-0 hover:bg-bg-surface">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-3 text-text-primary", column.align === "right" && "text-right")}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per row, same fields stacked vertically */}
      <ul className="space-y-2 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-card border border-border-subtle bg-bg-surface p-4">
            {mobileTitle ? <div className="mb-3">{mobileTitle(row)}</div> : null}
            <dl className="space-y-2">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-text-secondary">{column.header}</dt>
                    <dd className="text-right text-sm text-text-primary">{column.render(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>

      {pagination && pagination.totalPages > 1 && onPageChange ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-auto"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-auto"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
