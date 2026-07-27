import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import * as notificationsController from "./notifications.controller";
import { listNotificationsSchema, notificationIdSchema } from "./notifications.validation";

export const notificationsRouter = Router();

// Login Required, any role (Module 0 §7).
notificationsRouter.use(authenticate);

notificationsRouter.get("/", validate({ query: listNotificationsSchema }), notificationsController.list);
notificationsRouter.get("/unread-count", notificationsController.unreadCount);
notificationsRouter.patch(
  "/:id/read",
  validate({ params: notificationIdSchema }),
  notificationsController.markRead,
);
