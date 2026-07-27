// Transient signals tell a client "your cached view is stale, refetch".
// Persisted notifications are separate: they also land in the `notifications`
// table so an offline user can backfill on reconnect (Module 0 §8).
export const RealtimeEvent = {
  WalletBalanceUpdated: "wallet.balance_updated",
  DuesUpdated: "dues.updated",
  FoodTabUpdated: "food.tab_updated",
  NotificationCreated: "notification.created",
} as const;

export type RealtimeEventName = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];

export interface RealtimeMessage {
  event: RealtimeEventName;
  payload?: Record<string, unknown>;
}
