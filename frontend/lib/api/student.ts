import { apiRequest } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth";
import type {
  AppNotification,
  DueItemRef,
  DuesResponse,
  Pagination,
  PaymentResult,
  PrepaidBalance,
  PostpaidTab,
  PrepaidPlan,
  QrScanResult,
  Shop,
  ShopCategory,
  ShopDetail,
  TransactionsResponse,
  TransactionType,
  WalletBalance,
} from "@/types/student";

// Query keys live beside the fetchers so a mutation can invalidate exactly the
// views it affects without guessing at key shapes.
export const queryKeys = {
  walletBalance: ["wallet", "balance"] as const,
  transactions: (filters: TransactionFilters) => ["wallet", "transactions", filters] as const,
  shops: (category?: ShopCategory) => ["shops", category ?? "all"] as const,
  shop: (shopId: string) => ["shops", shopId] as const,
  prepaidPlans: (shopId: string) => ["shops", shopId, "prepaid-plans"] as const,
  dues: ["dues"] as const,
  prepaidBalances: ["food", "prepaid-balances"] as const,
  postpaidTabs: ["food", "postpaid-tabs"] as const,
  notifications: ["notifications"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  me: ["auth", "me"] as const,
};

export interface TransactionFilters {
  type?: TransactionType;
  from?: string;
  to?: string;
  shop_id?: string;
  page?: number;
  limit?: number;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

// ─── Wallet ─────────────────────────────────────────────────────────────────

export const getWalletBalance = () => apiRequest<WalletBalance>("/wallet/balance");

export const getTransactions = (filters: TransactionFilters = {}) =>
  apiRequest<TransactionsResponse>(`/wallet/transactions${toQueryString({ ...filters })}`);

export const initiateAddMoney = (body: { provider: "bkash" | "sslcommerz"; amount: number }) =>
  apiRequest<{ transactionId: string; checkoutUrl: string }>("/wallet/add-money/initiate", {
    method: "POST",
    body,
  });

// ─── Shops ──────────────────────────────────────────────────────────────────

export const getShops = (category?: ShopCategory) =>
  apiRequest<{ shops: Shop[] }>(`/shops${toQueryString({ category })}`);

export const getShop = (shopId: string) => apiRequest<{ shop: ShopDetail }>(`/shops/${shopId}`);

export const getPrepaidPlans = (shopId: string) =>
  apiRequest<{ plans: PrepaidPlan[] }>(`/shops/${shopId}/prepaid-plans`);

export const purchasePrepaidPlan = (shopId: string, planId: string) =>
  apiRequest<{ message: string; prepaidBalanceId: string; walletBalance: number }>(
    `/shops/${shopId}/prepaid-plans/${planId}/purchase`,
    { method: "POST" },
  );

// ─── Payments ───────────────────────────────────────────────────────────────

export const payByQrScan = (body: { qrToken: string; amount: number }) =>
  apiRequest<QrScanResult>("/payments/qr-scan", { method: "POST", body });

// ─── Dues ───────────────────────────────────────────────────────────────────

export const getDues = () => apiRequest<DuesResponse>("/dues");

export const payDue = (body: DueItemRef) => apiRequest<PaymentResult>("/dues/pay", { method: "POST", body });

export const massPayDues = (items: DueItemRef[]) =>
  apiRequest<PaymentResult>("/dues/mass-pay", { method: "POST", body: { items } });

export const disputeAdminFine = (fineId: string, reason: string) =>
  apiRequest<{ message: string; waiverId: string }>(`/dues/admin-fines/${fineId}/dispute`, {
    method: "POST",
    body: { reason },
  });

// ─── Food ───────────────────────────────────────────────────────────────────

export const getPrepaidBalances = () =>
  apiRequest<{ balances: PrepaidBalance[] }>("/food/prepaid-balances");

export const getPostpaidTabs = () => apiRequest<{ tabs: PostpaidTab[] }>("/food/postpaid-tabs");

// ─── Profile & notifications ────────────────────────────────────────────────

export const getMe = () => apiRequest<{ user: AuthUser }>("/auth/me");

export const updateProfile = (body: { phone: string }) =>
  apiRequest<{ user: AuthUser; message: string }>("/students/me", { method: "PATCH", body });

export const changePassword = (body: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => apiRequest<{ message: string }>("/auth/change-password", { method: "PATCH", body });

export const logout = () => apiRequest<{ message: string }>("/auth/logout", { method: "POST" });

export const getNotifications = (page = 1) =>
  apiRequest<{ notifications: AppNotification[]; pagination: Pagination }>(
    `/notifications${toQueryString({ page })}`,
  );

export const getUnreadCount = () => apiRequest<{ count: number }>("/notifications/unread-count");

export const markNotificationRead = (id: string) =>
  apiRequest<{ message: string }>(`/notifications/${id}/read`, { method: "PATCH" });
