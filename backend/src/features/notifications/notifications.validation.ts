import { z } from "zod";

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const notificationIdSchema = z.object({
  id: z.string().uuid("Invalid notification id"),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
