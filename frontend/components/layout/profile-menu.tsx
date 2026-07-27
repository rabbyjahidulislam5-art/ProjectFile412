"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth";

function initials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileMenu({ user, profileHref }: { user: AuthUser; profileHref: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await apiRequest("/auth/logout", { method: "POST" });
    // Drop every cached response so the next account to sign in on this device
    // never sees the previous one's data.
    queryClient.clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary text-sm font-semibold text-bg-primary outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent-secondary">
        {initials(user.fullName) || <UserIcon className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium text-text-primary">{user.fullName}</p>
          <p className="truncate text-xs text-text-secondary">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(profileHref)}>
          <UserIcon className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="text-state-danger focus:bg-state-danger/10">
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
