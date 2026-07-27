import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authRateLimit } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import * as authController from "./auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validation";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, validate({ body: registerSchema }), authController.register);
authRouter.post("/login", authRateLimit, validate({ body: loginSchema }), authController.login);
authRouter.post(
  "/forgot-password",
  authRateLimit,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
authRouter.post(
  "/reset-password",
  authRateLimit,
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
