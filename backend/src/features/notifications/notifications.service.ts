import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/api-error";
import { pushToUser } from "../../realtime/gateway";
import { RealtimeEvent } from "../../realtime/events";

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
}

type PrismaTx = Prisma.TransactionClient;

// Persists the row first so an offline recipient can backfill on reconnect,
// then pushes live to any open socket (Module 0 §8).
export async function createNotification(
  input: NotificationInput,
  tx: PrismaTx | typeof prisma = prisma,
) {
  const notification = await tx.notification.create({
    data: { userId: input.userId, type: input.type, title: input.title, body: input.body },
  });

  pushToUser(input.userId, {
    event: RealtimeEvent.NotificationCreated,
    payload: {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt.toISOString(),
    },
  });

  return notification;
}

export async function listNotifications(userId: string, page: number, limit: number) {
  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications: rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(userId: string, notificationId: string) {
  // Scoped by userId so one user can never mark another's notification read.
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  if (result.count === 0) {
    throw ApiError.notFound("Notification not found");
  }

  return { message: "Notification marked as read" };
}
