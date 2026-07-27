import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { ApiError } from "../../lib/api-error";
import * as studentsService from "./students.service";
import type { UpdateStudentProfileInput } from "./students.validation";

export const updateProfile = asyncHandler(
  async (req: Request<unknown, unknown, UpdateStudentProfileInput>, res: Response) => {
    if (!req.auth) throw ApiError.unauthorized();
    res.status(200).json(await studentsService.updateProfile(req.auth.sub, req.body));
  },
);
