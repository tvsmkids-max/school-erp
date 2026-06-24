import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createManualBackup,
  getBackupFileForDownload,
  getCurrentLocalDbFile,
  listBackupHistory,
  restoreBackup,
} from "./backup.service.js";

export const createManualBackupController = asyncHandler(async (req, res) => {
  const backup = await createManualBackup({ actor: req.user });

  return res
    .status(201)
    .json(new ApiResponse(201, backup, "Backup created successfully"));
});

export const listBackupHistoryController = asyncHandler(async (req, res) => {
  const history = await listBackupHistory({ actor: req.user });

  return res
    .status(200)
    .json(new ApiResponse(200, history, "Backup history loaded"));
});

export const downloadBackupController = asyncHandler(async (req, res) => {
  const backup = await getBackupFileForDownload({
    actor: req.user,
    fileName: req.params.fileName,
  });

  return res.download(backup.filePath, backup.fileName);
});

export const downloadCurrentLocalDbController = asyncHandler(
  async (req, res) => {
    const file = await getCurrentLocalDbFile({ actor: req.user });

    return res.download(file.filePath, file.fileName);
  },
);

export const restoreBackupController = asyncHandler(async (req, res) => {
  const result = await restoreBackup({
    actor: req.user,
    fileName: req.params.fileName,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Backup restored successfully"));
});
