import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { ApiError } from "../lib/api-error";

// Role Based / Admin Only: must run after `authenticate`.
// Never trust a client-selected dashboard — the token's role claim is authoritative.
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(ApiError.unauthorized("Authentication required"));
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return next(ApiError.forbidden("You do not have permission to access this resource"));
    }
    next();
  };
}
