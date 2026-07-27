"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/student";
import { toast } from "@/components/ui/use-toast";

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;

type RealtimeEventName =
  | "wallet.balance_updated"
  | "dues.updated"
  | "food.tab_updated"
  | "notification.created";

interface RealtimeMessage {
  event: RealtimeEventName;
  payload?: Record<string, unknown>;
}

function websocketUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return `${apiUrl.replace(/^http/, "ws")}/ws/notifications`;
}

/**
 * Single app-wide socket. Server events carry no data of their own — they mark
 * the affected caches stale and let react-query refetch, so the UI can never
 * drift from what the database actually holds.
 */
export function useRealtime(enabled: boolean) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;

    function connect() {
      if (disposed) return;

      const socket = new WebSocket(websocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        // Backfill anything pushed while this client was offline (Module 0 §8).
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
        void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
      };

      socket.onmessage = (event) => {
        let message: RealtimeMessage;
        try {
          message = JSON.parse(event.data as string) as RealtimeMessage;
        } catch {
          return;
        }

        switch (message.event) {
          case "wallet.balance_updated":
            void queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance });
            void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
            break;
          case "dues.updated":
            void queryClient.invalidateQueries({ queryKey: queryKeys.dues });
            break;
          case "food.tab_updated":
            void queryClient.invalidateQueries({ queryKey: queryKeys.prepaidBalances });
            void queryClient.invalidateQueries({ queryKey: queryKeys.postpaidTabs });
            break;
          case "notification.created": {
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
            void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
            const { title, body } = (message.payload ?? {}) as { title?: string; body?: string };
            if (title) toast({ title, description: body });
            break;
          }
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        // Exponential backoff, capped — a server restart shouldn't turn into a
        // reconnect storm from every open tab.
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempts.current,
          RECONNECT_MAX_DELAY_MS,
        );
        reconnectAttempts.current += 1;
        reconnectTimer.current = window.setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, queryClient]);
}
