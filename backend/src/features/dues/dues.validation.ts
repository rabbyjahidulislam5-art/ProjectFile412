import { z } from "zod";

export const dueItemSchema = z.object({
  type: z.enum(["semester_fee", "library_fine", "admin_fine", "postpaid_tab"]),
  id: z.string().uuid("Invalid item id"),
});

export const payDueSchema = dueItemSchema;

export const massPaySchema = z.object({
  items: z
    .array(dueItemSchema)
    .min(1, "Select at least one item to pay")
    .max(50, "You can pay at most 50 items at once")
    .refine(
      (items) => new Set(items.map((item) => `${item.type}:${item.id}`)).size === items.length,
      "The same item was selected more than once",
    ),
});

export const disputeFineParamsSchema = z.object({
  id: z.string().uuid("Invalid fine id"),
});

export const disputeFineSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please describe your reason in at least 10 characters")
    .max(1000, "Reason is too long"),
});

export type DueItemRef = z.infer<typeof dueItemSchema>;
export type MassPayInput = z.infer<typeof massPaySchema>;
export type DisputeFineInput = z.infer<typeof disputeFineSchema>;
