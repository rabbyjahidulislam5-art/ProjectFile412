import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as shopsController from "./shops.controller";
import { listShopsSchema, purchasePlanParamsSchema, shopIdSchema } from "./shops.validation";

export const shopsRouter = Router();

// Browsing is Login Required (any role); prepaid actions are student-only.
shopsRouter.use(authenticate);

shopsRouter.get("/", validate({ query: listShopsSchema }), shopsController.list);
shopsRouter.get("/:id", validate({ params: shopIdSchema }), shopsController.getOne);
shopsRouter.get(
  "/:id/prepaid-plans",
  authorize("student"),
  validate({ params: shopIdSchema }),
  shopsController.listPrepaidPlans,
);
shopsRouter.post(
  "/:id/prepaid-plans/:planId/purchase",
  authorize("student"),
  validate({ params: purchasePlanParamsSchema }),
  shopsController.purchasePrepaidPlan,
);
