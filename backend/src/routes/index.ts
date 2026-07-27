import { Router } from "express";
import { authRouter } from "../features/auth/auth.routes";
import { healthRouter } from "../features/health/health.routes";
import { walletRouter } from "../features/wallet/wallet.routes";
import { shopsRouter } from "../features/shops/shops.routes";
import { paymentsRouter } from "../features/payments/payments.routes";
import { duesRouter } from "../features/dues/dues.routes";
import { foodRouter } from "../features/food/food.routes";
import { studentsRouter } from "../features/students/students.routes";
import { notificationsRouter } from "../features/notifications/notifications.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/wallet", walletRouter);
apiRouter.use("/shops", shopsRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/dues", duesRouter);
apiRouter.use("/food", foodRouter);
apiRouter.use("/students", studentsRouter);
apiRouter.use("/notifications", notificationsRouter);
