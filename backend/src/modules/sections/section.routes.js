import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createSectionValidation,
  listSectionsValidation,
  sectionIdValidation,
  updateSectionValidation,
} from "./section.validation.js";
import {
  createSectionController,
  deleteSectionController,
  disableSectionController,
  getSectionController,
  listSectionsController,
  updateSectionController,
} from "./section.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("section.view"),
  validate(listSectionsValidation),
  listSectionsController
);

router.post(
  "/",
  authorize("section.create"),
  validate(createSectionValidation),
  createSectionController
);

router.get(
  "/:id",
  authorize("section.view"),
  validate(sectionIdValidation),
  getSectionController
);

router.patch(
  "/:id",
  authorize("section.edit"),
  validate(updateSectionValidation),
  updateSectionController
);

router.patch(
  "/:id/disable",
  authorize("section.edit"),
  validate(sectionIdValidation),
  disableSectionController
);

router.delete(
  "/:id",
  authorize("section.delete"),
  validate(sectionIdValidation),
  deleteSectionController
);

export default router;
