import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  academicSessionIdValidation,
  createAcademicSessionValidation,
  listAcademicSessionsValidation,
  updateAcademicSessionValidation,
} from "./academicSession.validation.js";
import {
  createAcademicSessionController,
  deleteAcademicSessionController,
  disableAcademicSessionController,
  getAcademicSessionController,
  getCurrentAcademicSessionController,
  listAcademicSessionsController,
  setCurrentAcademicSessionController,
  updateAcademicSessionController,
} from "./academicSession.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("academic_session.view"),
  validate(listAcademicSessionsValidation),
  listAcademicSessionsController
);

router.post(
  "/",
  authorize("academic_session.create"),
  validate(createAcademicSessionValidation),
  createAcademicSessionController
);

router.get(
  "/current",
  authorize("academic_session.view"),
  getCurrentAcademicSessionController
);

router.get(
  "/:id",
  authorize("academic_session.view"),
  validate(academicSessionIdValidation),
  getAcademicSessionController
);

router.patch(
  "/:id",
  authorize("academic_session.edit"),
  validate(updateAcademicSessionValidation),
  updateAcademicSessionController
);

router.patch(
  "/:id/set-current",
  authorize("academic_session.set_current"),
  validate(academicSessionIdValidation),
  setCurrentAcademicSessionController
);

router.patch(
  "/:id/disable",
  authorize("academic_session.edit"),
  validate(academicSessionIdValidation),
  disableAcademicSessionController
);

router.delete(
  "/:id",
  authorize("academic_session.delete"),
  validate(academicSessionIdValidation),
  deleteAcademicSessionController
);

export default router;
