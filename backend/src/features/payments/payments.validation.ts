import { z } from "zod";

export const qrScanSchema = z.object({
  qrToken: z.string().trim().min(1, "Scan a valid QR code").max(100),
  amount: z.coerce
    .number()
    .positive("Enter an amount greater than zero")
    .max(1_000_000, "Amount is too large")
    .refine((value) => Number.isInteger(value * 100), "Amount can have at most 2 decimal places"),
});

export type QrScanInput = z.infer<typeof qrScanSchema>;
