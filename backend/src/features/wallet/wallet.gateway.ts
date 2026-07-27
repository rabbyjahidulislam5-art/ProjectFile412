import crypto from "node:crypto";
import { env } from "../../config/env";

export type GatewayProvider = "bkash" | "sslcommerz";

const CHECKOUT_URL: Record<GatewayProvider, string> = {
  bkash: env.BKASH_CHECKOUT_URL,
  sslcommerz: env.SSLCOMMERZ_CHECKOUT_URL,
};

// Canonical field order — both sides must sign exactly the same string, so the
// order is fixed here rather than derived from object key iteration.
function canonicalPayload(fields: {
  transactionId: string;
  amount: string;
  status: string;
  gatewayRef: string;
}): string {
  return [fields.transactionId, fields.amount, fields.status, fields.gatewayRef].join("|");
}

export function sign(fields: Parameters<typeof canonicalPayload>[0]): string {
  return crypto.createHmac("sha256", env.PAYMENT_GATEWAY_SECRET).update(canonicalPayload(fields)).digest("hex");
}

// Timing-safe comparison — a plain === leaks signature bytes through response timing.
export function verifySignature(
  fields: Parameters<typeof canonicalPayload>[0],
  providedSignature: string,
): boolean {
  const expected = sign(fields);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

// Builds the hosted-checkout handoff URL. The provider redirects the student
// back to `returnUrl` and independently calls our signed webhook to settle.
export function buildCheckoutUrl(input: {
  provider: GatewayProvider;
  transactionId: string;
  amount: string;
}): string {
  const url = new URL(CHECKOUT_URL[input.provider]);
  url.searchParams.set("merchant_txn_id", input.transactionId);
  url.searchParams.set("amount", input.amount);
  url.searchParams.set("currency", "BDT");
  url.searchParams.set("return_url", `${env.APP_BASE_URL}/student/wallet/add-money?ref=${input.transactionId}`);
  url.searchParams.set(
    "signature",
    sign({ transactionId: input.transactionId, amount: input.amount, status: "initiated", gatewayRef: "" }),
  );
  return url.toString();
}
