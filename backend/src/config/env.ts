import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // Frontend origin the payment gateway returns the user to after checkout.
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),

  // Wallet top-up bounds, in BDT (Module 1 §3.2 validation).
  WALLET_MIN_TOPUP: z.coerce.number().positive().default(10),
  WALLET_MAX_TOPUP: z.coerce.number().positive().default(50000),

  // Hosted checkout entry points per provider.
  BKASH_CHECKOUT_URL: z.string().url().default("https://sandbox.bkash.com/checkout"),
  SSLCOMMERZ_CHECKOUT_URL: z.string().url().default("https://sandbox.sslcommerz.com/gwprocess/v4/api.php"),

  // Shared secret used to sign the outbound checkout handoff and verify the
  // inbound settlement webhook. Must match the value configured at the provider.
  PAYMENT_GATEWAY_SECRET: z.string().min(32, "PAYMENT_GATEWAY_SECRET must be at least 32 characters"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  isProduction: parsed.data.NODE_ENV === "production",
};
