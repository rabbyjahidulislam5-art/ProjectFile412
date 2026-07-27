import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as walletController from "./wallet.controller";
import { addMoneyCallbackSchema, addMoneySchema, listTransactionsSchema } from "./wallet.validation";

export const walletRouter = Router();

// Settlement webhook is public — the provider has no session — but every field
// is HMAC-verified in the service before anything is credited.
walletRouter.post(
  "/add-money/callback",
  validate({ body: addMoneyCallbackSchema }),
  walletController.addMoneyCallback,
);

walletRouter.use(authenticate, authorize("student"));

walletRouter.get("/balance", walletController.getBalance);
walletRouter.post("/add-money/initiate", validate({ body: addMoneySchema }), walletController.initiateAddMoney);
walletRouter.get("/transactions", validate({ query: listTransactionsSchema }), walletController.listTransactions);
