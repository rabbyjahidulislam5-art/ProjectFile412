import rateLimit from "express-rate-limit";

// General API traffic.
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter window for credential-guessing-prone auth routes.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many attempts. Please try again later." } },
});

// OTP verify/resend endpoints are brute-force targets on a 6-digit code —
// IP-level backstop on top of the per-account attempt/cooldown checks in
// auth.service.ts.
export const otpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many attempts. Please try again later." } },
});
