import { env } from "../../config/env.js";
import { ActivityLog, ClassModel, Section } from "../../models/nativeModels.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";

const now = () => new Date().toISOString();

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(500, "Native class service requires DB_MODE=mongodb.");
  }
};

const sanitizeClass = (classRecord) => ({
  _id: classRecord._id,
  tenantId: classRecord.tenantId,
  branchId: classRecord.branchId,
  name: classRecord.name,
  displayName: classRecord.displayName,
  code: classRecord.code,
  sortOrder: classRecord.sortOrder,
  status: classRecord.status,
  isDeleted: classRecord.isDeleted,
  createdBy: classRecord.createdBy,
  updatedBy: classRecord.updatedBy,
  createdAt: classRecord.createdAt,
  updatedAt: classRecord.updatedAt,
});

const addActivityLog = async ({ actor, action, message, entityId }) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module: "Classes",
    action,
    message,
    entityType: "Class",
    entityId,
    ipAddress: null,
    userAgent: null,
    createdAt: now(),
  });
};

const validateUniqueClass = async (actor, { name, code }, excludeId = null) => {
  const duplicateName = await ClassModel.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    name,
    isDeleted: false,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  if (duplicateName) {
    throw new ApiError(409, "Class name already exists", [
      { field: "name", message: "Class name already exists" },
    ]);
  }

  const duplicateCode = await ClassModel.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    code: normalizeCode(code),
    isDeleted: false,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  if (duplicateCode) {
    throw new ApiError(409, "Class code already exists", [
      { field: "code", message: "Class code already exists" },
    ]);
  }
};

const findClassById = async (actor, id) => {
  return ClassModel.findOne({
    _id: id,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();
};

export const listClasses = async ({ actor, query }) => {
  ensureMongoMode();

  const search = normalizeText(query.search);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 50);
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
    mongoQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const [classes, total] = await Promise.all([
    ClassModel.find(mongoQuery)
      .sort({ sortOrder: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    ClassModel.countDocuments(mongoQuery),
  ]);

  return {
    classes: classes.map(sanitizeClass),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createClass = async ({ actor, payload }) => {
  ensureMongoMode();

  await validateUniqueClass(actor, {
    name: payload.name.trim(),
    code: payload.code,
  });

  const classRecord = await ClassModel.create({
    _id: createId("class"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    name: payload.name.trim(),
    displayName: payload.displayName
      ? payload.displayName.trim()
      : payload.name.trim(),
    code: normalizeCode(payload.code),
    sortOrder: Number(payload.sortOrder),
    status: payload.status || "active",
    isDeleted: false,
    createdBy: actor._id,
    updatedBy: actor._id,
  });

  await addActivityLog({
    actor,
    action: "CLASS_CREATED",
    message: `Class created: ${classRecord.displayName}`,
    entityId: classRecord._id,
  });

  return sanitizeClass(classRecord.toObject());
};

export const getClassById = async ({ actor, id }) => {
  ensureMongoMode();

  const classRecord = await findClassById(actor, id);

  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  return sanitizeClass(classRecord);
};

export const updateClass = async ({ actor, id, payload }) => {
  ensureMongoMode();

  const classRecord = await findClassById(actor, id);

  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const nextName =
    payload.name !== undefined ? payload.name.trim() : classRecord.name;

  const nextCode =
    payload.code !== undefined ? normalizeCode(payload.code) : classRecord.code;

  await validateUniqueClass(
    actor,
    {
      name: nextName,
      code: nextCode,
    },
    classRecord._id,
  );

  await ClassModel.updateOne(
    { _id: classRecord._id },
    {
      $set: {
        name: nextName,
        code: nextCode,
        ...(payload.displayName !== undefined
          ? { displayName: payload.displayName.trim() }
          : {}),
        ...(payload.sortOrder !== undefined
          ? { sortOrder: Number(payload.sortOrder) }
          : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        updatedBy: actor._id,
      },
    },
  );

  const updated = await ClassModel.findById(classRecord._id).lean();

  await addActivityLog({
    actor,
    action: "CLASS_UPDATED",
    message: `Class updated: ${updated.displayName}`,
    entityId: updated._id,
  });

  return sanitizeClass(updated);
};

export const disableClass = async ({ actor, id }) => {
  ensureMongoMode();

  const classRecord = await findClassById(actor, id);

  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  await ClassModel.updateOne(
    { _id: classRecord._id },
    {
      $set: {
        status: "inactive",
        updatedBy: actor._id,
      },
    },
  );

  const updated = await ClassModel.findById(classRecord._id).lean();

  await addActivityLog({
    actor,
    action: "CLASS_DISABLED",
    message: `Class disabled: ${updated.displayName}`,
    entityId: updated._id,
  });

  return sanitizeClass(updated);
};

export const deleteClass = async ({ actor, id }) => {
  ensureMongoMode();

  const classRecord = await findClassById(actor, id);

  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const linkedSection = await Section.findOne({
    classId: classRecord._id,
    isDeleted: false,
  }).lean();

  if (linkedSection) {
    throw new ApiError(
      400,
      "Class cannot be deleted because sections are linked",
    );
  }

  await ClassModel.updateOne(
    { _id: classRecord._id },
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
    action: "CLASS_DELETED",
    message: `Class deleted: ${classRecord.displayName}`,
    entityId: classRecord._id,
  });

  return { deleted: true };
};
