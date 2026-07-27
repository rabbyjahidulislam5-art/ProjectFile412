import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/api-error";
import * as notificationsService from "./notifications.service";
import type { ListNotificationsQuery } from "./notifications.validation";

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const { page, limit } = req.query as unknown as ListNotificationsQuery;
  res.status(200).json(await notificationsService.listNotifications(req.auth.sub, page, limit));
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(200).json({ count: await notificationsService.countUnread(req.auth.sub) });
});

export const markRead = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  res.status(200).json(await notificationsService.markRead(req.auth.sub, req.params.id));
});
