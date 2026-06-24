import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createUserValidation,
  listUsersValidation,
  resetPasswordValidation,
  updateUserValidation,
  userIdValidation,
} from "./user.validation.js";
import {
  createUserController,
  deleteUserController,
  disableUserController,
  enableUserController,
  forceLogoutController,
  getUserController,
  listUserSessionsController,
  listUsersController,
  resetPasswordController,
  updateUserController,
} from "./user.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("user.view"), validate(listUsersValidation), listUsersController);
router.post("/", authorize("user.create"), validate(createUserValidation), createUserController);

router.get("/:id", authorize("user.view"), validate(userIdValidation), getUserController);
router.patch("/:id", authorize("user.edit"), validate(updateUserValidation), updateUserController);
router.patch("/:id/disable", authorize("user.disable"), validate(userIdValidation), disableUserController);
router.patch("/:id/enable", authorize("user.edit"), validate(userIdValidation), enableUserController);
router.delete("/:id", authorize("user.delete"), validate(userIdValidation), deleteUserController);

router.patch(
  "/:id/reset-password",
  authorize("user.reset_password"),
  validate(resetPasswordValidation),
  resetPasswordController
);

router.get(
  "/:id/sessions",
  authorize("user.view_sessions"),
  validate(userIdValidation),
  listUserSessionsController
);

router.post(
  "/:id/force-logout",
  authorize("user.force_logout"),
  validate(userIdValidation),
  forceLogoutController
);

export default router;