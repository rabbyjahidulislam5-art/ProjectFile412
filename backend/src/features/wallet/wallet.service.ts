import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/api-error";
import { logger } from "../../config/logger";
import { toAmount, toDecimal } from "../../lib/money";
import { writeAuditLog } from "../../lib/audit";
import { pushToUser } from "../../realtime/gateway";
import { RealtimeEvent } from "../../realtime/events";
import { createNotification } from "../notifications/notifications.service";
import { buildCheckoutUrl, verifySignature } from "./wallet.gateway";
import type { AddMoneyCallbackInput, AddMoneyInput, ListTransactionsQuery } from "./wallet.validation";

// A student's wallet is created alongside their account at registration, so a
// missing row means the data is corrupt rather than merely absent.
export async function getWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw ApiError.internal("Wallet not found for this account");
  return wallet;
}

export async function getBalance(userId: string) {
  const wallet = await getWallet(userId);
  return {
    balance: toAmount(wallet.balance),
    currency: wallet.currency,
    updatedAt: wallet.updatedAt.toISOString(),
  };
}

export async function initiateAddMoney(userId: string, input: AddMoneyInput) {
  const wallet = await getWallet(userId);
  const amount = toDecimal(input.amount);

  // The pending row is written before the redirect so a student who abandons
  // checkout still leaves an auditable trace (Module 1 §3.2 business logic).
  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      userId,
      type: "deposit",
      direction: "credit",
      amount,
      gateway: input.provider,
      status: "pending",
    },
  });

  await writeAuditLog({
    actorUserId: userId,
    action: "wallet.add_money.initiated",
    entityType: "transaction",
    entityId: transaction.id,
    metadata: { provider: input.provider, amount: input.amount },
  });

  return {
    transactionId: transaction.id,
    checkoutUrl: buildCheckoutUrl({
      provider: input.provider,
      transactionId: transaction.id,
      amount: amount.toFixed(2),
    }),
  };
}

export async function handleAddMoneyCallback(input: AddMoneyCallbackInput) {
  const signatureValid = verifySignature(
    {
      transactionId: input.transactionId,
      amount: input.amount,
      status: input.status,
      gatewayRef: input.gatewayRef,
    },
    input.signature,
  );

  if (!signatureValid) {
    logger.warn({ transactionId: input.transactionId }, "Rejected add-money callback with invalid signature");
    throw ApiError.unauthorized("Invalid callback signature");
  }

  const transaction = await prisma.transaction.findUnique({ where: { id: input.transactionId } });
  if (!transaction || transaction.type !== "deposit") {
    throw ApiError.notFound("Transaction not found");
  }

  // Gateways retry callbacks; settling twice would double-credit the wallet.
  if (transaction.status !== "pending") {
    return { message: "Transaction already settled", status: transaction.status };
  }

  // The signed amount must match what we recorded, so a tampered callback
  // cannot inflate the credit even with a valid signature over its own values.
  if (!transaction.amount.equals(toDecimal(input.amount))) {
    logger.warn({ transactionId: transaction.id }, "Add-money callback amount mismatch");
    throw ApiError.badRequest("Callback amount does not match the initiated transaction");
  }

  if (input.status === "failed") {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "failed", gatewayRef: input.gatewayRef },
    });
    await createNotification({
      userId: transaction.userId,
      type: "wallet",
      title: "Top-up failed",
      body: `Your ৳${toAmount(transaction.amount).toFixed(2)} top-up could not be completed.`,
    });
    return { message: "Transaction marked as failed", status: "failed" as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "success", gatewayRef: input.gatewayRef },
    });
    await tx.wallet.update({
      where: { id: transaction.walletId },
      data: { balance: { increment: transaction.amount } },
    });
    await writeAuditLog(
      {
        actorUserId: transaction.userId,
        action: "wallet.add_money.settled",
        entityType: "transaction",
        entityId: transaction.id,
        metadata: { gatewayRef: input.gatewayRef, amount: toAmount(transaction.amount) },
      },
      tx,
    );
  });

  await createNotification({
    userId: transaction.userId,
    type: "wallet",
    title: "Money added",
    body: `৳${toAmount(transaction.amount).toFixed(2)} has been added to your wallet.`,
  });
  pushToUser(transaction.userId, { event: RealtimeEvent.WalletBalanceUpdated });

  return { message: "Transaction settled", status: "success" as const };
}

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  const where: Prisma.TransactionWhereInput = { userId };

  if (query.type) where.type = query.type;
  if (query.shop_id) where.shopId = query.shop_id;
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      // `to` is a day boundary from the date filter, so include the whole day.
      ...(query.to ? { lte: new Date(new Date(query.to).setHours(23, 59, 59, 999)) } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { shop: { select: { id: true, name: true } } },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: rows.map((row) => ({
      id: row.id,
      type: row.type,
      direction: row.direction,
      amount: toAmount(row.amount),
      status: row.status,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      shop: row.shop,
      gateway: row.gateway,
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
