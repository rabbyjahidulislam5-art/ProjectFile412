import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as studentsController from "./students.controller";
import { updateStudentProfileSchema } from "./students.validation";

export const studentsRouter = Router();

studentsRouter.use(authenticate, authorize("student"));

studentsRouter.patch("/me", validate({ body: updateStudentProfileSchema }), studentsController.updateProfile);
