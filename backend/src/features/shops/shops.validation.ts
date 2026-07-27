import { z } from "zod";

export const listShopsSchema = z.object({
  category: z.enum(["food_beverage", "stationery", "printing", "other"]).optional(),
});

export const shopIdSchema = z.object({
  id: z.string().uuid("Invalid shop id"),
});

export const purchasePlanParamsSchema = z.object({
  id: z.string().uuid("Invalid shop id"),
  planId: z.string().uuid("Invalid plan id"),
});

export type ListShopsQuery = z.infer<typeof listShopsSchema>;
