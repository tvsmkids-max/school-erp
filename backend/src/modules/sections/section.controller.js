import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createSection,
  deleteSection,
  disableSection,
  getSectionById,
  listSections,
  updateSection,
} from "./section.service.js";

export const listSectionsController = asyncHandler(async (req, res) => {
  const result = await listSections({
    actor: req.user,
    query: req.validated.query,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result.sections, "Sections loaded successfully", result.meta));
});

export const createSectionController = asyncHandler(async (req, res) => {
  const section = await createSection({
    actor: req.user,
    payload: req.validated.body,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, section, "Section created successfully"));
});

export const getSectionController = asyncHandler(async (req, res) => {
  const section = await getSectionById({
    actor: req.user,
    id: req.validated.params.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, section, "Section loaded successfully"));
});

export const updateSectionController = asyncHandler(async (req, res) => {
  const section = await updateSection({
    actor: req.user,
    id: req.validated.params.id,
    payload: req.validated.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, section, "Section updated successfully"));
});

export const disableSectionController = asyncHandler(async (req, res) => {
  const section = await disableSection({
    actor: req.user,
    id: req.validated.params.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, section, "Section disabled successfully"));
});

export const deleteSectionController = asyncHandler(async (req, res) => {
  const result = await deleteSection({
    actor: req.user,
    id: req.validated.params.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Section deleted successfully"));
});
