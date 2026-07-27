import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import * as foodController from "./food.controller";

export const foodRouter = Router();

// Read-only for the student: charges only ever originate on the shop side.
foodRouter.use(authenticate, authorize("student"));

foodRouter.get("/prepaid-balances", foodController.prepaidBalances);
foodRouter.get("/postpaid-tabs", foodController.postpaidTabs);
