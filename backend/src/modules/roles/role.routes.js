import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getRoleController, listRolesController, updateRolePermissionsController } from "./role.controller.js";
import { roleIdValidation, updateRolePermissionsValidation } from "./role.validation.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("role.view"), listRolesController);
router.get("/:id", authorize("role.view"), validate(roleIdValidation), getRoleController);

router.patch(
  "/:id/permissions",
  authorize("role.manage_permissions"),
  validate(updateRolePermissionsValidation),
  updateRolePermissionsController
);

export default router;