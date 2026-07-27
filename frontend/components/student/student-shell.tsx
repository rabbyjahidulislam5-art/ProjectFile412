"use client";

import { usePathname } from "next/navigation";
import { FileWarning, ScanLine, Store, UserCircle, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WalletBalanceCard } from "@/components/student/wallet-balance-card";
import { useRealtime } from "@/lib/hooks/use-realtime";
import type { AuthUser } from "@/types/auth";
import type { NavItem } from "@/types/nav";

export const STUDENT_ROOT = "/student";

// The student's 5 primary nav destinations (Module 1 §2.1).
const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/student", icon: Wallet },
  { label: "Shops", href: "/student/shops", icon: Store },
  { label: "Scan", href: "/student/scan", icon: ScanLine, elevated: true },
  { label: "Dues", href: "/student/dues", icon: FileWarning },
  { label: "Profile", href: "/student/profile", icon: UserCircle },
];

// Longest-prefix match so nested routes inherit their section's title.
const PAGE_TITLES: ReadonlyArray<[string, string]> = [
  ["/student/wallet/add-money", "Add Money"],
  ["/student/dues/mass-pay", "Mass Payment"],
  ["/student/shops", "Shops"],
  ["/student/scan", "Scan to Pay"],
  ["/student/dues", "Dues & Fines"],
  ["/student/food", "Food & Tab"],
  ["/student/ledger", "Transactions"],
  ["/student/profile", "Profile"],
  ["/student", "Home"],
];

function resolveTitle(pathname: string): string {
  const match = PAGE_TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match?.[1] ?? "Smart Campus";
}

export function StudentShell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const pathname = usePathname();

  // One socket for the whole student session, mounted with the shell so every
  // page inherits live balance/dues/tab updates.
  useRealtime(true);

  const isNested = pathname !== STUDENT_ROOT;

  return (
    <AppShell
      user={user}
      navItems={NAV_ITEMS}
      rootHref={STUDENT_ROOT}
      profileHref="/student/profile"
      pageTitle={resolveTitle(pathname)}
      showBack={isNested}
      headerAccessory={<WalletBalanceCard variant="chip" />}
    >
      {children}
    </AppShell>
  );
}
