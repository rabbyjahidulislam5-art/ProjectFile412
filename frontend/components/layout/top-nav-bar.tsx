"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/student/notification-bell";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/nav";
import type { AuthUser } from "@/types/auth";
import { ProfileMenu } from "./profile-menu";

interface TopNavBarProps {
  navItems: NavItem[];
  user: AuthUser;
  rootHref: string;
  profileHref: string;
}

function isActiveRoute(pathname: string, href: string, isRoot: boolean): boolean {
  return isRoot ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNavBar({ navItems, user, rootHref, profileHref }: TopNavBarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden h-16 w-full border-b border-border-subtle bg-bg-surface md:flex">
      <div className="flex w-full items-center justify-between gap-6 px-6">
        <Link href={rootHref} className="shrink-0 font-display text-lg font-semibold tracking-tight text-text-primary">
          Smart Campus
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {navItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href, item.href === rootHref);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-accent-primary"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
                )}
              >
                <item.icon className="h-4 w-4" />
                {/* Icon-only on tablet to save width (Module 0 §2.3). */}
                <span className="hidden lg:inline">{item.label}</span>
                {isActive ? (
                  <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent-primary" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <NotificationBell />
          <ProfileMenu user={user} profileHref={profileHref} />
        </div>
      </div>
    </header>
  );
}
