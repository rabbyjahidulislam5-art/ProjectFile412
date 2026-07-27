import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as duesController from "./dues.controller";
import { disputeFineParamsSchema, disputeFineSchema, massPaySchema, payDueSchema } from "./dues.validation";

export const duesRouter = Router();

duesRouter.use(authenticate, authorize("student"));

duesRouter.get("/", duesController.getDues);
duesRouter.post("/pay", validate({ body: payDueSchema }), duesController.pay);
duesRouter.post("/mass-pay", validate({ body: massPaySchema }), duesController.massPay);
duesRouter.post(
  "/admin-fines/:id/dispute",
  validate({ params: disputeFineParamsSchema, body: disputeFineSchema }),
  duesController.disputeAdminFine,
);
