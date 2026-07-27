import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authRateLimit, otpRateLimit } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import * as authController from "./auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, validate({ body: registerSchema }), authController.register);
authRouter.post(
  "/verify-email",
  otpRateLimit,
  validate({ body: verifyEmailSchema }),
  authController.verifyEmail,
);
authRouter.post(
  "/verify-email/resend",
  otpRateLimit,
  validate({ body: resendVerificationSchema }),
  authController.resendVerification,
);
authRouter.post("/login", authRateLimit, validate({ body: loginSchema }), authController.login);
authRouter.post(
  "/forgot-password",
  otpRateLimit,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
authRouter.post(
  "/reset-password",
  otpRateLimit,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);
authRouter.patch(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);
