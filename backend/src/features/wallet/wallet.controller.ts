import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/api-error";
import * as walletService from "./wallet.service";
import type { AddMoneyCallbackInput, AddMoneyInput, ListTransactionsQuery } from "./wallet.validation";

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(200).json(await walletService.getBalance(req.auth.sub));
});

export const initiateAddMoney = asyncHandler(
  async (req: Request<unknown, unknown, AddMoneyInput>, res: Response) => {
    if (!req.auth) throw ApiError.unauthorized();
    res.status(201).json(await walletService.initiateAddMoney(req.auth.sub, req.body));
  },
);

// Public but signature-verified: called server-to-server by the payment provider.
export const addMoneyCallback = asyncHandler(
  async (req: Request<unknown, unknown, AddMoneyCallbackInput>, res: Response) => {
    res.status(200).json(await walletService.handleAddMoneyCallback(req.body));
  },
);

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const query = req.query as unknown as ListTransactionsQuery;
  res.status(200).json(await walletService.listTransactions(req.auth.sub, query));
});
