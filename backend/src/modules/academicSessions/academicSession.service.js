import { env } from "../../config/env.js";
import { AcademicSession, ActivityLog } from "../../models/nativeModels.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";

const now = () => new Date().toISOString();

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const toTime = (dateString) =>
  new Date(`${dateString}T00:00:00.000Z`).getTime();

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(
      500,
      "Native academic session service requires DB_MODE=mongodb.",
    );
  }
};

const sanitizeSession = (session) => ({
  _id: session._id,
  tenantId: session.tenantId,
  branchId: session.branchId,
  name: session.name,
  startDate: session.startDate,
  endDate: session.endDate,
  isCurrent: session.isCurrent,
  status: session.status,
  isDeleted: session.isDeleted,
  createdBy: session.createdBy,
  updatedBy: session.updatedBy,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

const addActivityLog = async ({ actor, action, message, entityId }) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module: "Academic Sessions",
    action,
    message,
    entityType: "AcademicSession",
    entityId,
    ipAddress: null,
    userAgent: null,
    createdAt: now(),
  });
};

const validateSessionDates = ({ startDate, endDate }) => {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid session date", [
      { field: "startDate/endDate", message: "Dates must be valid" },
    ]);
  }

  if (start.getTime() >= end.getTime()) {
    throw new ApiError(400, "Start date must be before end date", [
      { field: "startDate", message: "Start date must be before end date" },
    ]);
  }

  const startMonth = start.getUTCMonth() + 1;
  const endMonth = end.getUTCMonth() + 1;

  if (startMonth !== 6 || endMonth !== 3) {
    throw new ApiError(400, "Academic session must run from June to March", [
      { field: "startDate", message: "Start month must be June" },
      { field: "endDate", message: "End month must be March" },
    ]);
  }
};

const validateUniqueName = async (actor, name, excludeId = null) => {
  const query = {
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    name,
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const exists = await AcademicSession.findOne(query).lean();

  if (exists) {
    throw new ApiError(409, "Academic session name already exists", [
      { field: "name", message: "Session name already exists" },
    ]);
  }
};

const validateNoOverlap = async (
  actor,
  startDate,
  endDate,
  excludeId = null,
) => {
  const sessions = await AcademicSession.find({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  const newStart = toTime(startDate);
  const newEnd = toTime(endDate);

  const overlapping = sessions.find((session) => {
    const existingStart = toTime(session.startDate);
    const existingEnd = toTime(session.endDate);

    return newStart <= existingEnd && newEnd >= existingStart;
  });

  if (overlapping) {
    throw new ApiError(
      409,
      "Academic session dates overlap with an existing session",
      [
        { field: "startDate", message: `Overlaps with ${overlapping.name}` },
        { field: "endDate", message: `Overlaps with ${overlapping.name}` },
      ],
    );
  }
};

const findSessionById = async (actor, id) => {
  return AcademicSession.findOne({
    _id: id,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();
};

export const listAcademicSessions = async ({ actor, query }) => {
  ensureMongoMode();

  const search = normalizeText(query.search);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const mongoQuery = {
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  };

  if (query.status && query.status !== "all") {
    mongoQuery.status = query.status;
  }

  if (search) {
    mongoQuery.name = { $regex: search, $options: "i" };
  }

  const [sessions, total] = await Promise.all([
    AcademicSession.find(mongoQuery)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    AcademicSession.countDocuments(mongoQuery),
  ]);

  return {
    sessions: sessions.map(sanitizeSession),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createAcademicSession = async ({ actor, payload }) => {
  ensureMongoMode();

  validateSessionDates({
    startDate: payload.startDate,
    endDate: payload.endDate,
  });

  await validateUniqueName(actor, payload.name);
  await validateNoOverlap(actor, payload.startDate, payload.endDate);

  if (payload.isCurrent === true) {
    await AcademicSession.updateMany(
      {
        tenantId: actor.tenantId,
        branchId: actor.branchId,
        isDeleted: false,
      },
      {
        $set: {
          isCurrent: false,
          updatedBy: actor._id,
        },
      },
    );
  }

  const session = await AcademicSession.create({
    _id: createId("session"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    name: payload.name.trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
    isCurrent: Boolean(payload.isCurrent),
    status: payload.status || "active",
    isDeleted: false,
    createdBy: actor._id,
    updatedBy: actor._id,
  });

  await addActivityLog({
    actor,
    action: "ACADEMIC_SESSION_CREATED",
    message: `Academic session created: ${session.name}`,
    entityId: session._id,
  });

  return sanitizeSession(session.toObject());
};

export const getCurrentAcademicSession = async ({ actor }) => {
  ensureMongoMode();

  const session = await AcademicSession.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isCurrent: true,
    isDeleted: false,
  }).lean();

  if (!session) {
    throw new ApiError(404, "Current academic session not found");
  }

  return sanitizeSession(session);
};

export const getAcademicSessionById = async ({ actor, id }) => {
  ensureMongoMode();

  const session = await findSessionById(actor, id);

  if (!session) {
    throw new ApiError(404, "Academic session not found");
  }

  return sanitizeSession(session);
};

export const updateAcademicSession = async ({ actor, id, payload }) => {
  ensureMongoMode();

  const session = await findSessionById(actor, id);

  if (!session) {
    throw new ApiError(404, "Academic session not found");
  }

  const nextName =
    payload.name !== undefined ? payload.name.trim() : session.name;
  const nextStartDate = payload.startDate || session.startDate;
  const nextEndDate = payload.endDate || session.endDate;

  validateSessionDates({
    startDate: nextStartDate,
    endDate: nextEndDate,
  });

  await validateUniqueName(actor, nextName, session._id);
  await validateNoOverlap(actor, nextStartDate, nextEndDate, session._id);

  await AcademicSession.updateOne(
    { _id: session._id },
    {
      $set: {
        name: nextName,
        startDate: nextStartDate,
        endDate: nextEndDate,
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        updatedBy: actor._id,
      },
    },
  );

  const updated = await AcademicSession.findById(session._id).lean();

  await addActivityLog({
    actor,
    action: "ACADEMIC_SESSION_UPDATED",
    message: `Academic session updated: ${updated.name}`,
    entityId: updated._id,
  });

  return sanitizeSession(updated);
};

export const setCurrentAcademicSession = async ({ actor, id }) => {
  ensureMongoMode();

  const session = await findSessionById(actor, id);

  if (!session) {
    throw new ApiError(404, "Academic session not found");
  }

  if (session.status !== "active") {
    throw new ApiError(400, "Only active session can be set as current");
  }

  await AcademicSession.updateMany(
    {
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    },
    {
      $set: {
        isCurrent: false,
        updatedBy: actor._id,
      },
    },
  );

  await AcademicSession.updateOne(
    { _id: session._id },
    {
      $set: {
        isCurrent: true,
        updatedBy: actor._id,
      },
    },
  );

  const updated = await AcademicSession.findById(session._id).lean();

  await addActivityLog({
    actor,
    action: "ACADEMIC_SESSION_SET_CURRENT",
    message: `Academic session set current: ${updated.name}`,
    entityId: updated._id,
  });

  return sanitizeSession(updated);
};

export const disableAcademicSession = async ({ actor, id }) => {
  ensureMongoMode();

  const session = await findSessionById(actor, id);

  if (!session) {
    throw new ApiError(404, "Academic session not found");
  }

  if (session.isCurrent) {
    throw new ApiError(400, "Current academic session cannot be disabled");
  }

  await AcademicSession.updateOne(
    { _id: session._id },
    {
      $set: {
        status: "inactive",
        updatedBy: actor._id,
      },
    },
  );

  const updated = await AcademicSession.findById(session._id).lean();

  await addActivityLog({
    actor,
    action: "ACADEMIC_SESSION_DISABLED",
    message: `Academic session disabled: ${updated.name}`,
    entityId: updated._id,
  });

  return sanitizeSession(updated);
};

export const deleteAcademicSession = async ({ actor, id }) => {
  ensureMongoMode();

  const session = await findSessionById(actor, id);

  if (!session) {
    throw new ApiError(404, "Academic session not found");
  }

  if (session.isCurrent) {
    throw new ApiError(400, "Current academic session cannot be deleted");
  }

  await AcademicSession.updateOne(
    { _id: session._id },
    {
      $set: {
        isDeleted: true,
        status: "inactive",
        updatedBy: actor._id,
      },
    },
  );

  await addActivityLog({
    actor,
    action: "ACADEMIC_SESSION_DELETED",
    message: `Academic session deleted: ${session.name}`,
    entityId: session._id,
  });

  return { deleted: true };
};
