export type ShopCategory = "food_beverage" | "stationery" | "printing" | "other";
export type ShopStatus = "active" | "suspended" | "removed";

export type TransactionType =
  | "deposit"
  | "shop_payment"
  | "fine_payment"
  | "fee_payment"
  | "prepaid_purchase"
  | "postpaid_settlement"
  | "refund"
  | "waiver_adjustment"
  | "mass_payment";

export type ReferenceType =
  | "shop"
  | "semester_fee"
  | "library_fine"
  | "admin_fine"
  | "prepaid_plan"
  | "postpaid_tab";

export interface WalletBalance {
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  direction: "credit" | "debit";
  amount: number;
  status: "pending" | "success" | "failed";
  referenceType: ReferenceType | null;
  referenceId: string | null;
  shop: { id: string; name: string } | null;
  gateway: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

export interface Shop {
  id: string;
  name: string;
  category: ShopCategory;
  logoUrl: string | null;
  rating: number;
  status: ShopStatus;
}

export interface ShopDetail extends Shop {
  qrToken: string;
}

export interface PrepaidPlan {
  id: string;
  name: string;
  price: number;
  validityDays: number;
}

export interface PrepaidBalance {
  id: string;
  balance: number;
  status: "active" | "expired";
  expiresAt: string | null;
  shop: { id: string; name: string; logoUrl: string | null; status: ShopStatus };
  plan: PrepaidPlan;
}

export interface PostpaidCharge {
  id: string;
  amount: number;
  description: string | null;
  chargedAt: string;
}

export interface PostpaidTab {
  id: string;
  monthPeriod: string;
  totalAmount: number;
  status: "open" | "billed" | "paid";
  shop: { id: string; name: string; logoUrl: string | null };
  charges: PostpaidCharge[];
}

export type DueItemType = "semester_fee" | "library_fine" | "admin_fine" | "postpaid_tab";
export type DueItemStatus = "pending" | "paid" | "waived" | "overdue" | "under_review";

export interface DueItem {
  id: string;
  type: DueItemType;
  title: string;
  detail: string | null;
  amount: number;
  dueDate: string | null;
  status: DueItemStatus;
  canPay: boolean;
  canDispute: boolean;
}

export interface DuesResponse {
  semesterFees: DueItem[];
  libraryFines: DueItem[];
  adminFines: DueItem[];
  postpaidTabs: DueItem[];
  summary: { pendingCount: number; pendingTotal: number; underReviewCount: number };
}

export interface DueItemRef {
  type: DueItemType;
  id: string;
}

export interface PaymentResult {
  message: string;
  transactionId: string;
  amountPaid: number;
  itemsPaid: number;
  walletBalance: number;
}

export interface QrScanResult {
  message: string;
  transactionId: string;
  amount: number;
  source: "prepaid_balance" | "wallet";
  shop: { id: string; name: string };
}

export interface AppNotification {
  id: string;
  type: string | null;
  title: string | null;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}
