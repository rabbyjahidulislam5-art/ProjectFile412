import type { NextFunction, Request, RequestHandler, Response } from "express";

// Generic over Express's Request type parameters so route handlers can declare
// their own params/body shapes and still be wrapped.
type AsyncRouteHandler<P, ResBody, ReqBody, ReqQuery> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction,
) => Promise<unknown>;

// Wraps an async Express handler so rejected promises reach the global error handler.
export function asyncHandler<P = Record<string, string>, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown>(
  handler: AsyncRouteHandler<P, ResBody, ReqBody, ReqQuery>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
