import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getStudentFieldConfigController,
  getStudentFieldDefinitionsController,
  resetStudentFieldConfigController,
  updateStudentFieldConfigController,
} from "./studentFieldConfig.controller.js";
import { updateStudentFieldConfigValidation } from "./studentFieldConfig.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("student_field_config.view"),
  getStudentFieldConfigController
);

router.get(
  "/definitions",
  authorize("student_field_config.view"),
  getStudentFieldDefinitionsController
);

router.patch(
  "/",
  authorize("student_field_config.edit"),
  validate(updateStudentFieldConfigValidation),
  updateStudentFieldConfigController
);

router.post(
  "/reset-defaults",
  authorize("student_field_config.edit"),
  resetStudentFieldConfigController
);

export default router;
