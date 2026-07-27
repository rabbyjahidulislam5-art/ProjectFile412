import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/api-error";
import * as shopsService from "./shops.service";
import type { ListShopsQuery } from "./shops.validation";

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await shopsService.listShops(req.query as unknown as ListShopsQuery));
});

export const getOne = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json(await shopsService.getShop(req.params.id));
});

export const listPrepaidPlans = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json(await shopsService.listPrepaidPlans(req.params.id));
});

export const purchasePrepaidPlan = asyncHandler(
  async (req: Request<{ id: string; planId: string }>, res: Response) => {
    if (!req.auth) throw ApiError.unauthorized();
    res
      .status(201)
      .json(await shopsService.purchasePrepaidPlan(req.auth.sub, req.params.id, req.params.planId));
  },
);
