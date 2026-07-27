import { prisma } from "../../lib/prisma";
import { toAmount } from "../../lib/money";

export async function listPrepaidBalances(userId: string) {
  const balances = await prisma.prepaidBalance.findMany({
    where: { studentId: userId },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      shop: { select: { id: true, name: true, logoUrl: true, status: true } },
      plan: { select: { id: true, name: true, price: true, validityDays: true } },
    },
  });

  const now = new Date();

  return {
    balances: balances.map((balance) => ({
      id: balance.id,
      balance: toAmount(balance.balance),
      // A lapsed row that hasn't been touched since expiry still reads `active`
      // in the database; present it honestly without needing a write here.
      status: balance.expiresAt && balance.expiresAt <= now ? ("expired" as const) : balance.status,
      expiresAt: balance.expiresAt?.toISOString() ?? null,
      shop: balance.shop,
      plan: { ...balance.plan, price: toAmount(balance.plan.price) },
    })),
  };
}

export async function listPostpaidTabs(userId: string) {
  const tabs = await prisma.postpaidTab.findMany({
    where: { studentId: userId, status: { in: ["open", "billed"] } },
    orderBy: [{ status: "desc" }, { monthPeriod: "desc" }],
    include: {
      shop: { select: { id: true, name: true, logoUrl: true } },
      charges: { orderBy: { chargedAt: "desc" } },
    },
  });

  return {
    tabs: tabs.map((tab) => ({
      id: tab.id,
      monthPeriod: tab.monthPeriod,
      totalAmount: toAmount(tab.totalAmount),
      status: tab.status,
      shop: tab.shop,
      charges: tab.charges.map((charge) => ({
        id: charge.id,
        amount: toAmount(charge.amount),
        description: charge.description,
        chargedAt: charge.chargedAt.toISOString(),
      })),
    })),
  };
}
