import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/api-error";
import { toAmount } from "../../lib/money";
import { writeAuditLog } from "../../lib/audit";
import { pushToUser } from "../../realtime/gateway";
import { RealtimeEvent } from "../../realtime/events";
import { createNotification } from "../notifications/notifications.service";
import type { ListShopsQuery } from "./shops.validation";

export async function listShops(query: ListShopsQuery) {
  // Suspended and removed shops are filtered server-side — never sent to the client.
  const shops = await prisma.shop.findMany({
    where: { status: "active", ...(query.category ? { category: query.category } : {}) },
    orderBy: [{ rating: "desc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, logoUrl: true, rating: true, status: true },
  });

  return { shops: shops.map((shop) => ({ ...shop, rating: toAmount(shop.rating) })) };
}

export async function getShop(shopId: string) {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, status: { not: "removed" } },
    select: {
      id: true,
      name: true,
      category: true,
      logoUrl: true,
      rating: true,
      status: true,
      qrToken: true,
    },
  });

  if (!shop) throw ApiError.notFound("Shop not found");

  return { shop: { ...shop, rating: toAmount(shop.rating) } };
}

export async function listPrepaidPlans(shopId: string) {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, status: { not: "removed" } },
    select: { id: true, category: true },
  });

  if (!shop) throw ApiError.notFound("Shop not found");

  // Prepaid plans are a food-shop concept only (Module 1 §3.4 business logic).
  if (shop.category !== "food_beverage") {
    return { plans: [] };
  }

  const plans = await prisma.prepaidPlan.findMany({
    where: { shopId },
    orderBy: { price: "asc" },
    select: { id: true, name: true, price: true, validityDays: true },
  });

  return { plans: plans.map((plan) => ({ ...plan, price: toAmount(plan.price) })) };
}

export async function purchasePrepaidPlan(userId: string, shopId: string, planId: string) {
  const [shop, plan, wallet] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, name: true, category: true, status: true } }),
    prisma.prepaidPlan.findUnique({ where: { id: planId } }),
    prisma.wallet.findUnique({ where: { userId } }),
  ]);

  if (!shop || shop.status === "removed") throw ApiError.notFound("Shop not found");
  if (shop.status !== "active") throw ApiError.badRequest("This shop is temporarily unavailable");
  if (shop.category !== "food_beverage") throw ApiError.badRequest("This shop does not offer prepaid plans");
  if (!plan || plan.shopId !== shopId) throw ApiError.notFound("Prepaid plan not found");
  if (!wallet) throw ApiError.internal("Wallet not found for this account");

  if (wallet.balance.lessThan(plan.price)) {
    throw ApiError.badRequest("Insufficient wallet balance");
  }

  const expiresAt = new Date(Date.now() + plan.validityDays * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    // Re-read the balance inside the transaction so two concurrent purchases
    // can't both pass the check above and overdraw the wallet.
    const locked = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: plan.price } },
    });
    if (locked.balance.isNegative()) {
      throw ApiError.badRequest("Insufficient wallet balance");
    }

    const existing = await tx.prepaidBalance.findFirst({
      where: { studentId: userId, shopId, status: "active" },
    });

    // Buying again while a plan is still live tops up the balance and extends
    // validity rather than stranding the student with two separate balances.
    const prepaidBalance = existing
      ? await tx.prepaidBalance.update({
          where: { id: existing.id },
          data: {
            balance: { increment: plan.price },
            planId: plan.id,
            expiresAt: existing.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : expiresAt,
          },
        })
      : await tx.prepaidBalance.create({
          data: {
            studentId: userId,
            shopId,
            planId: plan.id,
            balance: plan.price,
            expiresAt,
            status: "active",
          },
        });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "prepaid_purchase",
        direction: "debit",
        amount: plan.price,
        referenceType: "prepaid_plan",
        referenceId: plan.id,
        shopId,
        status: "success",
      },
    });

    await writeAuditLog(
      {
        actorUserId: userId,
        action: "food.prepaid_plan.purchased",
        entityType: "prepaid_balance",
        entityId: prepaidBalance.id,
        metadata: { shopId, planId: plan.id, amount: toAmount(plan.price) },
      },
      tx,
    );

    return { prepaidBalance, transaction, newBalance: locked.balance };
  });

  await createNotification({
    userId,
    type: "food",
    title: "Prepaid plan activated",
    body: `${plan.name} is now active at ${shop.name}.`,
  });
  pushToUser(userId, { event: RealtimeEvent.WalletBalanceUpdated });
  pushToUser(userId, { event: RealtimeEvent.FoodTabUpdated });

  return {
    message: "Prepaid plan purchased",
    prepaidBalanceId: result.prepaidBalance.id,
    walletBalance: toAmount(result.newBalance),
  };
}
