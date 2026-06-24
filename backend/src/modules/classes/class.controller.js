import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createClass,
  deleteClass,
  disableClass,
  getClassById,
  listClasses,
  updateClass,
} from "./class.service.js";

export const listClassesController = asyncHandler(async (req, res) => {
  const result = await listClasses({ actor: req.user, query: req.validated.query });

  return res
    .status(200)
    .json(new ApiResponse(200, result.classes, "Classes loaded successfully", result.meta));
});

export const createClassController = asyncHandler(async (req, res) => {
  const classRecord = await createClass({ actor: req.user, payload: req.validated.body });

  return res.status(201).json(new ApiResponse(201, classRecord, "Class created successfully"));
});

export const getClassController = asyncHandler(async (req, res) => {
  const classRecord = await getClassById({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, classRecord, "Class loaded successfully"));
});

export const updateClassController = asyncHandler(async (req, res) => {
  const classRecord = await updateClass({
    actor: req.user,
    id: req.validated.params.id,
    payload: req.validated.body,
  });

  return res.status(200).json(new ApiResponse(200, classRecord, "Class updated successfully"));
});

export const disableClassController = asyncHandler(async (req, res) => {
  const classRecord = await disableClass({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, classRecord, "Class disabled successfully"));
});

export const deleteClassController = asyncHandler(async (req, res) => {
  const result = await deleteClass({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, result, "Class deleted successfully"));
});
