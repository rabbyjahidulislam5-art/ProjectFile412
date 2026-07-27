"use client";

import { LayoutGrid, PenTool, Printer, Store, Utensils, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopCategory } from "@/types/student";

const CATEGORIES: ReadonlyArray<{ value: ShopCategory | "all"; label: string; icon: LucideIcon }> = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "food_beverage", label: "Food & Beverage", icon: Utensils },
  { value: "stationery", label: "Stationery", icon: PenTool },
  { value: "printing", label: "Printing", icon: Printer },
  { value: "other", label: "Other", icon: Store },
];

interface CategoryFilterChipsProps {
  value: ShopCategory | "all";
  onChange: (value: ShopCategory | "all") => void;
}

export function CategoryFilterChips({ value, onChange }: CategoryFilterChipsProps) {
  return (
    // Scrolls horizontally on mobile; fits inline on desktop at typical widths.
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {CATEGORIES.map((category) => {
        const isActive = category.value === value;
        return (
          <button
            key={category.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(category.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary",
              isActive
                ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                : "border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary",
            )}
          >
            <category.icon className="h-4 w-4" />
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
