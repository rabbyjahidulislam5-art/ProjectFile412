import type { CookieOptions, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/api-error";
import { parseDurationMs } from "../../lib/duration";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import * as authService from "./auth.service";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.validation";

// Frontend (Vercel) and backend (Render) are different sites in production, so
// cross-origin fetch calls need SameSite=None (which in turn requires Secure).
// Same-origin localhost dev keeps Lax, since None without HTTPS is rejected by browsers.
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? "none" : "lax",
  path: "/",
};

async function issueSession(res: Response, user: { id: string; role: UserRole }) {
  const shopId = user.role === "shop_staff" ? await authService.getShopIdForStaff(user.id) : undefined;

  const accessToken = signAccessToken({ sub: user.id, role: user.role, shopId });
  const refreshToken = signRefreshToken({ sub: user.id });

  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: parseDurationMs(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie("refresh_token", refreshToken, {
    ...baseCookieOptions,
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export const register = asyncHandler(async (req: Request<unknown, unknown, RegisterInput>, res: Response) => {
  // No session is issued here — the account stays pending until the OTP sent
  // to the student's university email is verified (see verifyEmail below).
  const result = await authService.registerStudent(req.body);
  res.status(201).json(result);
});

export const verifyEmail = asyncHandler(
  async (req: Request<unknown, unknown, VerifyEmailInput>, res: Response) => {
    const result = await authService.verifyEmail(req.body);
    res.status(200).json(result);
  },
);

export const resendVerification = asyncHandler(
  async (req: Request<unknown, unknown, ResendVerificationInput>, res: Response) => {
    const result = await authService.resendVerificationOtp(req.body);
    res.status(200).json(result);
  },
);

export const login = asyncHandler(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
  const user = await authService.login(req.body);
  await issueSession(res, user);
  res.status(200).json({ user });
});

export const forgotPassword = asyncHandler(
  async (req: Request<unknown, unknown, ForgotPasswordInput>, res: Response) => {
    const result = await authService.requestPasswordReset(req.body);
    res.status(200).json(result);
  },
);

export const resetPassword = asyncHandler(
  async (req: Request<unknown, unknown, ResetPasswordInput>, res: Response) => {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(result);
  },
);

export const changePassword = asyncHandler(
  async (req: Request<unknown, unknown, ChangePasswordInput>, res: Response) => {
    if (!req.auth) throw ApiError.unauthorized();
    const result = await authService.changePassword(req.auth.sub, req.body);
    res.status(200).json(result);
  },
);

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const user = await authService.getCurrentUser(req.auth.sub);
  res.status(200).json({ user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token as string | undefined;
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await authService.getCurrentUser(payload.sub);
  await issueSession(res, user);
  res.status(200).json({ user });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("access_token", baseCookieOptions);
  res.clearCookie("refresh_token", baseCookieOptions);
  res.status(200).json({ message: "Logged out" });
});
