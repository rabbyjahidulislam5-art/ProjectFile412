import { Prisma, type ReferenceType, type TransactionType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/api-error";
import { toAmount } from "../../lib/money";
import { writeAuditLog } from "../../lib/audit";
import { pushToUser } from "../../realtime/gateway";
import { RealtimeEvent } from "../../realtime/events";
import { createNotification } from "../notifications/notifications.service";
import type { DisputeFineInput, DueItemRef, MassPayInput } from "./dues.validation";

export type DueItemType = DueItemRef["type"];
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

// Each due type maps to a fixed transaction type and reference, so the payment
// engine below stays generic instead of branching per source table.
const TRANSACTION_TYPE: Record<DueItemType, TransactionType> = {
  semester_fee: "fee_payment",
  library_fine: "fine_payment",
  admin_fine: "fine_payment",
  postpaid_tab: "postpaid_settlement",
};

const REFERENCE_TYPE: Record<DueItemType, ReferenceType> = {
  semester_fee: "semester_fee",
  library_fine: "library_fine",
  admin_fine: "admin_fine",
  postpaid_tab: "postpaid_tab",
};

const TYPE_LABEL: Record<DueItemType, string> = {
  semester_fee: "Semester fee",
  library_fine: "Library fine",
  admin_fine: "Administrative fine",
  postpaid_tab: "Food tab",
};

function isOverdue(dueDate: Date | null, status: string): boolean {
  if (status !== "pending" || !dueDate) return false;
  return dueDate < new Date();
}

function formatMonth(monthPeriod: string): string {
  const [year, month] = monthPeriod.split("-");
  if (!year || !month) return monthPeriod;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export async function getDues(userId: string) {
  const [semesterFees, libraryFines, adminFines, postpaidTabs, pendingDisputes] = await Promise.all([
    prisma.semesterFee.findMany({ where: { studentId: userId }, orderBy: { dueDate: "asc" } }),
    prisma.libraryFine.findMany({ where: { studentId: userId }, orderBy: { dueDate: "asc" } }),
    prisma.adminFine.findMany({ where: { studentId: userId }, orderBy: { createdAt: "desc" } }),
    prisma.postpaidTab.findMany({
      where: { studentId: userId, status: { in: ["billed", "paid"] } },
      orderBy: { monthPeriod: "desc" },
      include: { shop: { select: { id: true, name: true } } },
    }),
    // Only admin fines carry a student-initiated appeal (Module 1 §5.7).
    prisma.fineWaiver.findMany({
      where: { requestedBy: userId, fineSource: "admin", status: "pending" },
      select: { fineId: true },
    }),
  ]);

  const disputedFineIds = new Set(pendingDisputes.map((waiver) => waiver.fineId));

  const mapFee = (fee: (typeof semesterFees)[number]): DueItem => ({
    id: fee.id,
    type: "semester_fee",
    title: TYPE_LABEL.semester_fee,
    detail: "Synced with Accounts Office",
    amount: toAmount(fee.amount),
    dueDate: fee.dueDate?.toISOString() ?? null,
    status: isOverdue(fee.dueDate, fee.status) ? "overdue" : fee.status,
    canPay: fee.status === "pending",
    canDispute: false,
  });

  const mapLibraryFine = (fine: (typeof libraryFines)[number]): DueItem => ({
    id: fine.id,
    type: "library_fine",
    title: fine.fineType === "lost" ? "Lost item fine" : "Late return fine",
    detail: "Synced with Library",
    amount: toAmount(fine.amount),
    dueDate: fine.dueDate?.toISOString() ?? null,
    status: isOverdue(fine.dueDate, fine.status) ? "overdue" : fine.status,
    canPay: fine.status === "pending",
    canDispute: false,
  });

  const mapAdminFine = (fine: (typeof adminFines)[number]): DueItem => {
    const underReview = fine.status === "pending" && disputedFineIds.has(fine.id);
    return {
      id: fine.id,
      type: "admin_fine",
      title: TYPE_LABEL.admin_fine,
      detail: fine.reason ?? "Synced with Admin Office",
      amount: toAmount(fine.amount),
      dueDate: fine.incidentDate?.toISOString() ?? null,
      // A fine under appeal is frozen: it can be neither paid nor re-disputed
      // until Admin Office rules on it (Module 1 §3.6).
      status: underReview ? "under_review" : isOverdue(fine.incidentDate, fine.status) ? "overdue" : fine.status,
      canPay: fine.status === "pending" && !underReview,
      canDispute: fine.status === "pending" && !underReview,
    };
  };

  const mapTab = (tab: (typeof postpaidTabs)[number]): DueItem => ({
    id: tab.id,
    type: "postpaid_tab",
    title: `${tab.shop.name} — ${formatMonth(tab.monthPeriod)}`,
    detail: "Monthly food tab",
    amount: toAmount(tab.totalAmount),
    dueDate: null,
    status: tab.status === "paid" ? "paid" : "pending",
    canPay: tab.status === "billed",
    canDispute: false,
  });

  const groups = {
    semesterFees: semesterFees.map(mapFee),
    libraryFines: libraryFines.map(mapLibraryFine),
    adminFines: adminFines.map(mapAdminFine),
    postpaidTabs: postpaidTabs.map(mapTab),
  };

  const allItems = Object.values(groups).flat();
  const payable = allItems.filter((item) => item.canPay);

  return {
    ...groups,
    summary: {
      pendingCount: payable.length,
      pendingTotal: Number(payable.reduce((sum, item) => sum + item.amount, 0).toFixed(2)),
      underReviewCount: allItems.filter((item) => item.status === "under_review").length,
    },
  };
}

interface ResolvedItem {
  ref: DueItemRef;
  amount: Prisma.Decimal;
  shopId: string | null;
}

/**
 * Loads each selected item inside the caller's transaction and re-verifies it is
 * still payable. Doing this within the transaction is what makes a batch safe:
 * an item paid or waived elsewhere between selection and submit aborts the
 * whole thing rather than partially clearing (Module 1 §3.7).
 */
async function resolvePayableItems(
  tx: Prisma.TransactionClient,
  userId: string,
  refs: readonly DueItemRef[],
): Promise<ResolvedItem[]> {
  const resolved: ResolvedItem[] = [];

  for (const ref of refs) {
    if (ref.type === "semester_fee") {
      const fee = await tx.semesterFee.findFirst({ where: { id: ref.id, studentId: userId } });
      if (!fee) throw ApiError.notFound("One of the selected items no longer exists");
      if (fee.status !== "pending") throw ApiError.conflict("stale");
      resolved.push({ ref, amount: fee.amount, shopId: null });
      continue;
    }

    if (ref.type === "library_fine") {
      const fine = await tx.libraryFine.findFirst({ where: { id: ref.id, studentId: userId } });
      if (!fine) throw ApiError.notFound("One of the selected items no longer exists");
      if (fine.status !== "pending") throw ApiError.conflict("stale");
      resolved.push({ ref, amount: fine.amount, shopId: null });
      continue;
    }

    if (ref.type === "admin_fine") {
      const fine = await tx.adminFine.findFirst({ where: { id: ref.id, studentId: userId } });
      if (!fine) throw ApiError.notFound("One of the selected items no longer exists");
      if (fine.status !== "pending") throw ApiError.conflict("stale");

      const openDispute = await tx.fineWaiver.findFirst({
        where: { fineSource: "admin", fineId: fine.id, status: "pending" },
        select: { id: true },
      });
      if (openDispute) {
        throw ApiError.conflict("under_review");
      }
      resolved.push({ ref, amount: fine.amount, shopId: null });
      continue;
    }

    const tab = await tx.postpaidTab.findFirst({ where: { id: ref.id, studentId: userId } });
    if (!tab) throw ApiError.notFound("One of the selected items no longer exists");
    if (tab.status !== "billed") throw ApiError.conflict("stale");
    resolved.push({ ref, amount: tab.totalAmount, shopId: tab.shopId });
  }

  return resolved;
}

async function markItemPaid(tx: Prisma.TransactionClient, ref: DueItemRef) {
  switch (ref.type) {
    case "semester_fee":
      await tx.semesterFee.update({ where: { id: ref.id }, data: { status: "paid" } });
      return;
    case "library_fine":
      await tx.libraryFine.update({ where: { id: ref.id }, data: { status: "paid" } });
      return;
    case "admin_fine":
      await tx.adminFine.update({ where: { id: ref.id }, data: { status: "paid" } });
      return;
    case "postpaid_tab":
      await tx.postpaidTab.update({ where: { id: ref.id }, data: { status: "paid" } });
  }
}

/**
 * Shared settlement path for both single "Pay Now" and Mass Payment. The whole
 * batch is one database transaction: the debit, every source-row status update,
 * the ledger entry, and the audit row commit together or not at all.
 */
async function settleDues(userId: string, refs: readonly DueItemRef[], mode: "single" | "mass") {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw ApiError.internal("Wallet not found for this account");

  const outcome = await prisma.$transaction(async (tx) => {
    const items = await resolvePayableItems(tx, userId, refs);
    const total = items.reduce((sum, item) => sum.plus(item.amount), new Prisma.Decimal(0));

    const debited = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: total } },
    });
    if (debited.balance.isNegative()) {
      throw ApiError.badRequest("Insufficient wallet balance");
    }

    for (const item of items) {
      await markItemPaid(tx, item.ref);
    }

    // A single payment points at its own source row; a batch is one
    // `mass_payment` row whose contents live in the audit metadata, since a
    // transaction can only carry one reference.
    const first = items[0];
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: mode === "mass" ? "mass_payment" : TRANSACTION_TYPE[first!.ref.type],
        direction: "debit",
        amount: total,
        referenceType: mode === "mass" ? null : REFERENCE_TYPE[first!.ref.type],
        referenceId: mode === "mass" ? null : first!.ref.id,
        shopId: mode === "mass" ? null : first!.shopId,
        status: "success",
      },
    });

    await writeAuditLog(
      {
        actorUserId: userId,
        action: mode === "mass" ? "dues.mass_pay" : "dues.pay",
        entityType: "transaction",
        entityId: transaction.id,
        metadata: {
          total: toAmount(total),
          items: items.map((item) => ({
            type: item.ref.type,
            id: item.ref.id,
            amount: toAmount(item.amount),
          })),
        },
      },
      tx,
    );

    return { transaction, total, count: items.length, balance: debited.balance };
  });

  await createNotification({
    userId,
    type: "dues",
    title: mode === "mass" ? "Dues cleared" : "Payment successful",
    body: `৳${toAmount(outcome.total).toFixed(2)} paid for ${outcome.count} item${outcome.count === 1 ? "" : "s"}.`,
  });
  pushToUser(userId, { event: RealtimeEvent.WalletBalanceUpdated });
  pushToUser(userId, { event: RealtimeEvent.DuesUpdated });
  pushToUser(userId, { event: RealtimeEvent.FoodTabUpdated });

  return {
    message: mode === "mass" ? "All selected dues cleared" : "Payment successful",
    transactionId: outcome.transaction.id,
    amountPaid: toAmount(outcome.total),
    itemsPaid: outcome.count,
    walletBalance: toAmount(outcome.balance),
  };
}

// Prisma surfaces our thrown ApiError untouched, but the two sentinel conflict
// messages are translated here into the wording the spec calls for.
function translateSettlementError(error: unknown): never {
  if (error instanceof ApiError && error.statusCode === 409) {
    if (error.message === "under_review") {
      throw ApiError.conflict("A selected fine is under review and can't be paid right now");
    }
    if (error.message === "stale") {
      throw ApiError.conflict("Some items changed since you selected them — please review and retry");
    }
  }
  throw error;
}

export async function payDue(userId: string, ref: DueItemRef) {
  try {
    return await settleDues(userId, [ref], "single");
  } catch (error) {
    return translateSettlementError(error);
  }
}

export async function massPayDues(userId: string, input: MassPayInput) {
  try {
    return await settleDues(userId, input.items, "mass");
  } catch (error) {
    return translateSettlementError(error);
  }
}

export async function disputeAdminFine(userId: string, fineId: string, input: DisputeFineInput) {
  const fine = await prisma.adminFine.findFirst({ where: { id: fineId, studentId: userId } });
  if (!fine) throw ApiError.notFound("Fine not found");
  if (fine.status !== "pending") throw ApiError.badRequest("This fine can no longer be disputed");

  const existing = await prisma.fineWaiver.findFirst({
    where: { fineSource: "admin", fineId, status: "pending" },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict("An appeal for this fine is already under review");

  const waiver = await prisma.$transaction(async (tx) => {
    const created = await tx.fineWaiver.create({
      data: {
        fineSource: "admin",
        fineId,
        requestedBy: userId,
        reason: input.reason,
        status: "pending",
      },
    });

    await writeAuditLog(
      {
        actorUserId: userId,
        action: "dues.admin_fine.disputed",
        entityType: "fine_waiver",
        entityId: created.id,
        metadata: { fineId, amount: toAmount(fine.amount) },
      },
      tx,
    );

    return created;
  });

  pushToUser(userId, { event: RealtimeEvent.DuesUpdated });

  return {
    message: "Appeal submitted — awaiting Admin Office review",
    waiverId: waiver.id,
  };
}
