import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/api-error";
import * as foodService from "./food.service";

export const prepaidBalances = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(200).json(await foodService.listPrepaidBalances(req.auth.sub));
});

export const postpaidTabs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(200).json(await foodService.listPostpaidTabs(req.auth.sub));
});
