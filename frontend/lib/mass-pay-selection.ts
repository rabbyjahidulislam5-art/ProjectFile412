import type { DueItemRef } from "@/types/student";

const STORAGE_KEY = "smart-campus:mass-pay-selection";

// Carries the Dues & Fines selection across to the Mass Payment page. Session
// storage rather than a query string: a 50-item batch would not fit in a URL,
// and the selection is meaningless outside the current tab anyway.
export function saveMassPaySelection(items: readonly DueItemRef[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function readMassPaySelection(): DueItemRef[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DueItemRef =>
        typeof item === "object" && item !== null && "type" in item && "id" in item,
    );
  } catch {
    return [];
  }
}

export function clearMassPaySelection(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
