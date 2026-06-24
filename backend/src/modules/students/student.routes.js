import { Router } from "express";
import multer from "multer";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  bulkStudentDeleteValidation,
  bulkStudentStatusValidation,
  createStudentValidation,
  listStudentsValidation,
  studentIdValidation,
  updateStudentStatusValidation,
  updateStudentValidation,
} from "./student.validation.js";

import {
  bulkDeleteStudentsController,
  bulkUpdateStudentStatusController,
  createStudentController,
  deleteStudentController,
  getStudentController,
  listStudentsController,
  updateStudentController,
  updateStudentStatusController,
} from "./student.controller.js";

import {
  commitStudentImportController,
  downloadStudentImportTemplateController,
  listStudentImportBatchesController,
  previewStudentImportController,
  rollbackStudentImportController,
} from "./studentImport.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("student.view"),
  validate(listStudentsValidation),
  listStudentsController,
);

router.post(
  "/",
  authorize("student.create"),
  validate(createStudentValidation),
  createStudentController,
);

router.post(
  "/bulk/status",
  authorize("student.bulk_update"),
  validate(bulkStudentStatusValidation),
  bulkUpdateStudentStatusController,
);

router.post(
  "/bulk/delete",
  authorize("student.delete"),
  validate(bulkStudentDeleteValidation),
  bulkDeleteStudentsController,
);

router.get(
  "/import/template",
  authorize("student.create"),
  downloadStudentImportTemplateController,
);

router.get(
  "/import/history",
  authorize("student.create"),
  listStudentImportBatchesController,
);

router.post(
  "/import/preview",
  authorize("student.create"),
  upload.single("file"),
  previewStudentImportController,
);

router.post(
  "/import/:batchId/commit",
  authorize("student.create"),
  commitStudentImportController,
);

router.post(
  "/import/:batchId/rollback",
  authorize("student.delete"),
  rollbackStudentImportController,
);

router.get(
  "/:id",
  authorize("student.view"),
  validate(studentIdValidation),
  getStudentController,
);

router.patch(
  "/:id",
  authorize("student.edit"),
  validate(updateStudentValidation),
  updateStudentController,
);

router.patch(
  "/:id/status",
  authorize("student.edit"),
  validate(updateStudentStatusValidation),
  updateStudentStatusController,
);

router.delete(
  "/:id",
  authorize("student.delete"),
  validate(studentIdValidation),
  deleteStudentController,
);

export default router;
