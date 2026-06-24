import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  createManualBackupController,
  downloadBackupController,
  downloadCurrentLocalDbController,
  listBackupHistoryController,
  restoreBackupController,
} from "./backup.controller.js";

const router = Router();

router.use(authenticate);

router.get("/history", listBackupHistoryController);

router.post("/manual", createManualBackupController);

router.get("/download-current", downloadCurrentLocalDbController);

router.get("/download/:fileName", downloadBackupController);

router.post("/restore/:fileName", restoreBackupController);

export default router;
