import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import {
  listGroupedPermissionCatalog,
  listMyPermissions,
  listPermissionCatalog,
} from "./permission.controller.js";

const router = Router();

router.get("/me", authenticate, listMyPermissions);
router.get("/", authenticate, authorize("permission.view"), listPermissionCatalog);
router.get("/catalog", authenticate, authorize("permission.view"), listPermissionCatalog);

router.get(
  "/grouped",
  authenticate,
  authorize("permission.view"),
  listGroupedPermissionCatalog
);

export default router;