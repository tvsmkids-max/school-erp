import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  classIdValidation,
  createClassValidation,
  listClassesValidation,
  updateClassValidation,
} from "./class.validation.js";
import {
  createClassController,
  deleteClassController,
  disableClassController,
  getClassController,
  listClassesController,
  updateClassController,
} from "./class.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("class.view"), validate(listClassesValidation), listClassesController);
router.post("/", authorize("class.create"), validate(createClassValidation), createClassController);
router.get("/:id", authorize("class.view"), validate(classIdValidation), getClassController);
router.patch("/:id", authorize("class.edit"), validate(updateClassValidation), updateClassController);
router.patch("/:id/disable", authorize("class.edit"), validate(classIdValidation), disableClassController);
router.delete("/:id", authorize("class.delete"), validate(classIdValidation), deleteClassController);

export default router;
