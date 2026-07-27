const CURRENCY_FORMATTER = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Rendered alongside `tabular-nums` everywhere so digits stay column-aligned.
export function formatCurrency(amount: number): string {
  return `৳${CURRENCY_FORMATTER.format(amount)}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(date);
}

const SHOP_CATEGORY_LABEL: Record<string, string> = {
  food_beverage: "Food & Beverage",
  stationery: "Stationery",
  printing: "Printing",
  other: "Other",
};

export function formatShopCategory(category: string): string {
  return SHOP_CATEGORY_LABEL[category] ?? category;
}
