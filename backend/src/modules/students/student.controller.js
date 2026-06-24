import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  bulkDeleteStudents,
  bulkUpdateStudentStatus,
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
  updateStudentStatus,
} from "./student.service.js";

export const listStudentsController = asyncHandler(async (req, res) => {
  const result = await listStudents({
    actor: req.user,
    query: req.validated.query,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.students,
        "Students loaded successfully",
        result.meta
      )
    );
});

export const createStudentController = asyncHandler(async (req, res) => {
  const student = await createStudent({
    actor: req.user,
    payload: req.validated.body,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, student, "Student created successfully"));
});

export const getStudentController = asyncHandler(async (req, res) => {
  const student = await getStudentById({
    actor: req.user,
    id: req.validated.params.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student loaded successfully"));
});

export const updateStudentController = asyncHandler(async (req, res) => {
  const student = await updateStudent({
    actor: req.user,
    id: req.validated.params.id,
    payload: req.validated.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student updated successfully"));
});

export const updateStudentStatusController = asyncHandler(async (req, res) => {
  const student = await updateStudentStatus({
    actor: req.user,
    id: req.validated.params.id,
    status: req.validated.body.status,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student status updated successfully"));
});

export const deleteStudentController = asyncHandler(async (req, res) => {
  const result = await deleteStudent({
    actor: req.user,
    id: req.validated.params.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Student deleted successfully"));
});

export const bulkUpdateStudentStatusController = asyncHandler(async (req, res) => {
  const result = await bulkUpdateStudentStatus({
    actor: req.user,
    studentIds: req.validated.body.studentIds,
    status: req.validated.body.status,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Student bulk status updated successfully"
      )
    );
});

export const bulkDeleteStudentsController = asyncHandler(async (req, res) => {
  const result = await bulkDeleteStudents({
    actor: req.user,
    studentIds: req.validated.body.studentIds,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Students bulk deleted successfully"
      )
    );
});