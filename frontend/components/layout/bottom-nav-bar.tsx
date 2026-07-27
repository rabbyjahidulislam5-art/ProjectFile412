"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/nav";

function isActiveRoute(pathname: string, href: string, isRoot: boolean): boolean {
  // The role home would otherwise match every nested route beneath it.
  return isRoot ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNavBar({ navItems, rootHref }: { navItems: NavItem[]; rootHref: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border-subtle bg-bg-surface/95 backdrop-blur md:hidden">
      {navItems.map((item) => {
        const isActive = isActiveRoute(pathname, item.href, item.href === rootHref);

        if (item.elevated) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="flex flex-1 flex-col items-center justify-center"
            >
              <span
                className={cn(
                  "-mt-6 flex h-14 w-14 items-center justify-center rounded-full shadow-soft transition-transform",
                  "bg-accent-primary text-bg-primary active:scale-95",
                  isActive && "ring-2 ring-accent-secondary ring-offset-2 ring-offset-bg-surface",
                )}
              >
                <item.icon className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <span className="mt-1 text-[11px] text-text-secondary">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <item.icon
              className={cn("h-5 w-5", isActive ? "text-accent-primary" : "text-text-secondary")}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={cn("text-[11px]", isActive ? "text-accent-primary" : "text-text-secondary")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
