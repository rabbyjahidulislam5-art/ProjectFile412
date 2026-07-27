"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { NotificationBell } from "@/components/student/notification-bell";

interface MobileHeaderProps {
  title: string;
  /** Contextual back affordance on nested routes (Module 0 §2.1). */
  showBack?: boolean;
  /** Role-specific slot — the student's balance chip lives here. */
  accessory?: React.ReactNode;
}

export function MobileHeader({ title, showBack = false, accessory }: MobileHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border-subtle bg-bg-surface px-4 md:hidden">
      {showBack ? (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-control text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}

      <span className="min-w-0 flex-1 truncate font-display text-base font-semibold text-text-primary">
        {title}
      </span>

      <div className="flex shrink-0 items-center gap-2">
        {accessory}
        <NotificationBell />
      </div>
    </header>
  );
}
