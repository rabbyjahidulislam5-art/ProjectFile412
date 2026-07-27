"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getNotifications, getUnreadCount, markNotificationRead, queryKeys } from "@/lib/api/student";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// A dropdown panel, not a page (Module 0 §2.2).
export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: getUnreadCount,
  });

  const { data, isPending } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => getNotifications(1),
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });

  const unreadCount = unread?.count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-control text-text-secondary outline-none transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-secondary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-primary ring-2 ring-bg-surface" />
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-h-[420px] w-[320px] overflow-y-auto p-0">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-text-primary">Notifications</p>
        </div>
        <DropdownMenuSeparator className="my-0" />

        {isPending ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.notifications.length > 0 ? (
          <ul>
            {data.notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  disabled={notification.isRead}
                  onClick={() => markRead.mutate(notification.id)}
                  className={cn(
                    "w-full border-b border-border-subtle px-4 py-3 text-left transition-colors last:border-0",
                    notification.isRead ? "opacity-60" : "hover:bg-bg-surface",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead ? (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary" />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text-primary">{notification.title}</p>
                      {notification.body ? (
                        <p className="mt-0.5 text-xs text-text-secondary">{notification.body}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-text-secondary">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Bell} title="No notifications yet" className="py-10" />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
