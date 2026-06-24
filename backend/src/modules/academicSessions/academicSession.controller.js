import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createAcademicSession,
  deleteAcademicSession,
  disableAcademicSession,
  getAcademicSessionById,
  getCurrentAcademicSession,
  listAcademicSessions,
  setCurrentAcademicSession,
  updateAcademicSession,
} from "./academicSession.service.js";

export const listAcademicSessionsController = asyncHandler(async (req, res) => {
  const result = await listAcademicSessions({ actor: req.user, query: req.validated.query });

  return res.status(200).json(
    new ApiResponse(
      200,
      result.sessions,
      "Academic sessions loaded successfully",
      result.meta
    )
  );
});

export const createAcademicSessionController = asyncHandler(async (req, res) => {
  const session = await createAcademicSession({ actor: req.user, payload: req.validated.body });

  return res
    .status(201)
    .json(new ApiResponse(201, session, "Academic session created successfully"));
});

export const getCurrentAcademicSessionController = asyncHandler(async (req, res) => {
  const session = await getCurrentAcademicSession({ actor: req.user });

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Current academic session loaded"));
});

export const getAcademicSessionController = asyncHandler(async (req, res) => {
  const session = await getAcademicSessionById({ actor: req.user, id: req.validated.params.id });

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Academic session loaded successfully"));
});

export const updateAcademicSessionController = asyncHandler(async (req, res) => {
  const session = await updateAcademicSession({
    actor: req.user,
    id: req.validated.params.id,
    payload: req.validated.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Academic session updated successfully"));
});

export const setCurrentAcademicSessionController = asyncHandler(async (req, res) => {
  const session = await setCurrentAcademicSession({ actor: req.user, id: req.validated.params.id });

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Academic session set as current"));
});

export const disableAcademicSessionController = asyncHandler(async (req, res) => {
  const session = await disableAcademicSession({ actor: req.user, id: req.validated.params.id });

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Academic session disabled successfully"));
});

export const deleteAcademicSessionController = asyncHandler(async (req, res) => {
  const result = await deleteAcademicSession({ actor: req.user, id: req.validated.params.id });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Academic session deleted successfully"));
});
