import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

interface AuditEntry {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

type PrismaTx = Prisma.TransactionClient;

// Every state-changing action writes one audit row (Module 0 §9). Pass the
// transaction client when the action is part of a larger atomic write so the
// audit trail commits or rolls back with it.
export function writeAuditLog(entry: AuditEntry, tx: PrismaTx | typeof prisma = prisma) {
  return tx.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata,
    },
  });
}
