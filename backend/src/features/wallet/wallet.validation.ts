import { z } from "zod";
import { env } from "../../config/env";

export const addMoneySchema = z.object({
  provider: z.enum(["bkash", "sslcommerz"], { errorMap: () => ({ message: "Select a payment method" }) }),
  amount: z.coerce
    .number()
    .positive("Enter an amount")
    .min(env.WALLET_MIN_TOPUP, `Minimum top-up is ৳${env.WALLET_MIN_TOPUP}`)
    .max(env.WALLET_MAX_TOPUP, `Maximum top-up is ৳${env.WALLET_MAX_TOPUP}`)
    .refine((value) => Number.isInteger(value * 100), "Amount can have at most 2 decimal places"),
});

export const addMoneyCallbackSchema = z.object({
  transactionId: z.string().uuid(),
  status: z.enum(["success", "failed"]),
  gatewayRef: z.string().min(1).max(100),
  amount: z.string().min(1),
  signature: z.string().min(1),
});

const isoDate = z.string().datetime({ offset: true }).or(z.string().date());

export const listTransactionsSchema = z
  .object({
    type: z
      .enum([
        "deposit",
        "shop_payment",
        "fine_payment",
        "fee_payment",
        "prepaid_purchase",
        "postpaid_settlement",
        "refund",
        "waiver_adjustment",
        "mass_payment",
      ])
      .optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    shop_id: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  })
  .refine(
    (query) => !query.from || !query.to || new Date(query.from) <= new Date(query.to),
    { message: "Start date must be on or before the end date", path: ["from"] },
  );

export type AddMoneyInput = z.infer<typeof addMoneySchema>;
export type AddMoneyCallbackInput = z.infer<typeof addMoneyCallbackSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>;
