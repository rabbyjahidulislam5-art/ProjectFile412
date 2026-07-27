import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/api-error";
import * as duesService from "./dues.service";
import type { DisputeFineInput, DueItemRef, MassPayInput } from "./dues.validation";

export const getDues = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(200).json(await duesService.getDues(req.auth.sub));
});

export const pay = asyncHandler(async (req: Request<unknown, unknown, DueItemRef>, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(201).json(await duesService.payDue(req.auth.sub, req.body));
});

export const massPay = asyncHandler(async (req: Request<unknown, unknown, MassPayInput>, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(201).json(await duesService.massPayDues(req.auth.sub, req.body));
});

export const disputeAdminFine = asyncHandler(
  async (req: Request<{ id: string }, unknown, DisputeFineInput>, res: Response) => {
    if (!req.auth) throw ApiError.unauthorized();
    res.status(201).json(await duesService.disputeAdminFine(req.auth.sub, req.params.id, req.body));
  },
);
