import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  commitStudentImport,
  createStudentImportTemplateBuffer,
  listStudentImportBatches,
  previewStudentImport,
  rollbackStudentImport,
} from "./studentImport.service.js";

export const downloadStudentImportTemplateController = asyncHandler(
  async (req, res) => {
    const buffer = createStudentImportTemplateBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="student-import-template.xlsx"',
    );

    return res.status(200).send(buffer);
  },
);

export const previewStudentImportController = asyncHandler(async (req, res) => {
  const batch = await previewStudentImport({
    actor: req.user,
    file: req.file,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, batch, "Student import preview created"));
});

export const commitStudentImportController = asyncHandler(async (req, res) => {
  const batch = await commitStudentImport({
    actor: req.user,
    batchId: req.params.batchId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, batch, "Student import committed successfully"));
});

export const rollbackStudentImportController = asyncHandler(
  async (req, res) => {
    const batch = await rollbackStudentImport({
      actor: req.user,
      batchId: req.params.batchId,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, batch, "Student import rolled back successfully"),
      );
  },
);

export const listStudentImportBatchesController = asyncHandler(
  async (req, res) => {
    const result = await listStudentImportBatches({
      actor: req.user,
      query: req.query,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result.batches,
          "Student import history loaded",
          result.meta,
        ),
      );
  },
);
