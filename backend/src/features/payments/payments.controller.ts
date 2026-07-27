import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/api-error";
import * as paymentsService from "./payments.service";
import type { QrScanInput } from "./payments.validation";

export const qrScan = asyncHandler(async (req: Request<unknown, unknown, QrScanInput>, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(201).json(await paymentsService.payByQrScan(req.auth.sub, req.body));
});
