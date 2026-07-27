import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/api-error";
import { toAmount, toDecimal } from "../../lib/money";
import { writeAuditLog } from "../../lib/audit";
import { pushToUser, pushToUsers } from "../../realtime/gateway";
import { RealtimeEvent } from "../../realtime/events";
import { createNotification } from "../notifications/notifications.service";
import type { QrScanInput } from "./payments.validation";

export type PaymentSource = "prepaid_balance" | "wallet";

/**
 * The single choke point for the shop payment loop (Module 1 §3.5): one atomic
 * write covering the debit, the ledger row, and the audit trail, followed by a
 * notification fan-out to both sides.
 *
 * At a food shop an active prepaid balance is consumed first and the main
 * wallet is only touched when there is no usable prepaid balance. Every other
 * shop category always pays from the wallet.
 */
export async function payByQrScan(userId: string, input: QrScanInput) {
  const amount = toDecimal(input.amount);

  const shop = await prisma.shop.findUnique({
    where: { qrToken: input.qrToken },
    select: { id: true, name: true, category: true, status: true },
  });

  if (!shop || shop.status === "removed") {
    throw ApiError.badRequest("This QR code isn't valid");
  }
  if (shop.status !== "active") {
    throw ApiError.badRequest("This shop can no longer accept payments");
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw ApiError.internal("Wallet not found for this account");

  const result = await prisma.$transaction(async (tx) => {
    let source: PaymentSource = "wallet";
    let prepaidBalanceId: string | null = null;

    if (shop.category === "food_beverage") {
      const prepaid = await tx.prepaidBalance.findFirst({
        where: { studentId: userId, shopId: shop.id, status: "active" },
      });

      if (prepaid) {
        const isExpired = prepaid.expiresAt !== null && prepaid.expiresAt <= new Date();

        if (isExpired) {
          // Lazily retire the balance the moment we notice it lapsed, then fall
          // through to the wallet rather than silently rejecting the payment.
          await tx.prepaidBalance.update({ where: { id: prepaid.id }, data: { status: "expired" } });
        } else if (prepaid.balance.greaterThanOrEqualTo(amount)) {
          await tx.prepaidBalance.update({
            where: { id: prepaid.id },
            data: { balance: { decrement: amount } },
          });
          source = "prepaid_balance";
          prepaidBalanceId = prepaid.id;
        }
      }
    }

    if (source === "wallet") {
      const debited = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
      // The decrement is the real check: it runs against the row's committed
      // value, so a concurrent payment cannot slip past a stale pre-read.
      if (debited.balance.isNegative()) {
        throw ApiError.badRequest("Insufficient wallet balance");
      }
    }

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "shop_payment",
        direction: "debit",
        amount,
        // The reference records which pot actually funded the payment, so the
        // ledger can label a meal-plan payment distinctly from a wallet one.
        referenceType: source === "prepaid_balance" ? "prepaid_plan" : "shop",
        referenceId: source === "prepaid_balance" ? prepaidBalanceId : shop.id,
        shopId: shop.id,
        status: "success",
      },
    });

    await writeAuditLog(
      {
        actorUserId: userId,
        action: "payment.qr_scan",
        entityType: "transaction",
        entityId: transaction.id,
        metadata: { shopId: shop.id, amount: input.amount, source },
      },
      tx,
    );

    return { transaction, source };
  });

  const paidAmount = toAmount(amount);

  // Student side: confirmation plus a balance refresh signal.
  pushToUser(userId, { event: RealtimeEvent.WalletBalanceUpdated });
  if (result.source === "prepaid_balance") {
    pushToUser(userId, { event: RealtimeEvent.FoodTabUpdated });
  }

  // Shop side: the live "payment received" banner every staff account sees.
  const staff = await prisma.shopStaff.findMany({
    where: { shopId: shop.id },
    select: { userId: true },
  });
  await Promise.all(
    staff.map((member) =>
      createNotification({
        userId: member.userId,
        type: "payment_received",
        title: "Payment received",
        body: `৳${paidAmount.toFixed(2)} received at ${shop.name}.`,
      }),
    ),
  );
  pushToUsers(
    staff.map((member) => member.userId),
    { event: RealtimeEvent.WalletBalanceUpdated, payload: { shopId: shop.id } },
  );

  return {
    message: "Payment successful",
    transactionId: result.transaction.id,
    amount: paidAmount,
    source: result.source,
    shop: { id: shop.id, name: shop.name },
  };
}
