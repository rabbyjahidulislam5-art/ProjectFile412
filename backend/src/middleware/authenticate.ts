import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/api-error";
import { verifyAccessToken, type AccessTokenPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

// Login Required: any authenticated role may pass.
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token as string | undefined;

  if (!token) {
    return next(ApiError.unauthorized("Authentication required"));
  }

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired session"));
  }
}
