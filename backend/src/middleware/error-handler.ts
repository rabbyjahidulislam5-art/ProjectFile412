import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../lib/api-error";
import { logger } from "../config/logger";
import { env } from "../config/env";

// Must be registered last, after all routes.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: { message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: { message: "Validation failed", details: err.flatten().fieldErrors },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: { message: "A record with these details already exists" } });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: { message: "Record not found" } });
      return;
    }
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: {
      message: "Internal server error",
      ...(env.isProduction ? {} : { stack: (err as Error)?.stack }),
    },
  });
}
