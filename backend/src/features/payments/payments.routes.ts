import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as paymentsController from "./payments.controller";
import { qrScanSchema } from "./payments.validation";

export const paymentsRouter = Router();

paymentsRouter.use(authenticate, authorize("student"));

paymentsRouter.post("/qr-scan", validate({ body: qrScanSchema }), paymentsController.qrScan);
