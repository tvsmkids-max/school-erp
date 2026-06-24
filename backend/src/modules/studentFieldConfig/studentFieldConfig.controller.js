import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getStudentFieldConfig,
  getStudentFieldDefinitions,
  resetStudentFieldConfigDefaults,
  updateStudentFieldConfig,
} from "./studentFieldConfig.service.js";

export const getStudentFieldConfigController = asyncHandler(async (req, res) => {
  const config = await getStudentFieldConfig({ actor: req.user });

  return res
    .status(200)
    .json(new ApiResponse(200, config, "Student field configuration loaded"));
});

export const updateStudentFieldConfigController = asyncHandler(async (req, res) => {
  const config = await updateStudentFieldConfig({
    actor: req.user,
    fields: req.validated.body.fields,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, config, "Student field configuration updated"));
});

export const resetStudentFieldConfigController = asyncHandler(async (req, res) => {
  const config = await resetStudentFieldConfigDefaults({ actor: req.user });

  return res
    .status(200)
    .json(new ApiResponse(200, config, "Student field configuration reset to defaults"));
});

export const getStudentFieldDefinitionsController = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, getStudentFieldDefinitions(), "Student field definitions loaded"));
});
