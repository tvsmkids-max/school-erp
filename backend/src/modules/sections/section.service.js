import { env } from "../../config/env.js";
import { ActivityLog, ClassModel, Section } from "../../models/nativeModels.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";

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
    throw new ApiError(500, "Native section service requires DB_MODE=mongodb.");
  }
};

const sanitizeSection = (section, classRecord = null) => ({
  _id: section._id,
  tenantId: section.tenantId,
  branchId: section.branchId,
  classId: section.classId,
  className: classRecord?.displayName || classRecord?.name || null,
  name: section.name,
  code: section.code,
  sortOrder: section.sortOrder,
  status: section.status,
  isDeleted: section.isDeleted,
  createdBy: section.createdBy,
  updatedBy: section.updatedBy,
  createdAt: section.createdAt,
  updatedAt: section.updatedAt,
});

const addActivityLog = async ({ actor, action, message, entityId }) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module: "Sections",
    action,
    message,
    entityType: "Section",
    entityId,
    ipAddress: null,
    userAgent: null,
    createdAt: new Date().toISOString(),
  });
};

const findClassById = async (actor, classId) => {
  return ClassModel.findOne({
    _id: classId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();
};

const validateClass = async (actor, classId) => {
  const classRecord = await findClassById(actor, classId);

  if (!classRecord) {
    throw new ApiError(400, "Selected class is invalid", [
      { field: "classId", message: "Class not found" },
    ]);
  }

  return classRecord;
};

const validateUniqueSection = async (
  actor,
  { classId, code, name },
  excludeId = null,
) => {
  const duplicateCode = await Section.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    classId,
    code: normalizeCode(code),
    isDeleted: false,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  if (duplicateCode) {
    throw new ApiError(409, "Section code already exists for this class", [
      { field: "code", message: "Section code already exists for this class" },
    ]);
  }

  const duplicateName = await Section.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    classId,
    name: name.trim(),
    isDeleted: false,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  if (duplicateName) {
    throw new ApiError(409, "Section name already exists for this class", [
      { field: "name", message: "Section name already exists for this class" },
    ]);
  }
};

const findSectionById = async (actor, id) => {
  return Section.findOne({
    _id: id,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();
};

export const listSections = async ({ actor, query }) => {
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

  if (query.classId) {
    mongoQuery.classId = query.classId;
  }

  if (query.status && query.status !== "all") {
    mongoQuery.status = query.status;
  }

  if (search) {
    mongoQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const [sections, total] = await Promise.all([
    Section.find(mongoQuery)
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Section.countDocuments(mongoQuery),
  ]);

  const classIds = [...new Set(sections.map((section) => section.classId))];

  const classes = await ClassModel.find({
    _id: { $in: classIds },
  }).lean();

  const classMap = new Map(classes.map((item) => [item._id, item]));

  return {
    sections: sections.map((section) =>
      sanitizeSection(section, classMap.get(section.classId) || null),
    ),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createSection = async ({ actor, payload }) => {
  ensureMongoMode();

  const classRecord = await validateClass(actor, payload.classId);

  await validateUniqueSection(actor, {
    classId: classRecord._id,
    code: payload.code,
    name: payload.name,
  });

  const section = await Section.create({
    _id: createId("section"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    classId: classRecord._id,
    name: payload.name.trim(),
    code: normalizeCode(payload.code),
    sortOrder: Number(payload.sortOrder),
    status: payload.status || "active",
    isDeleted: false,
    createdBy: actor._id,
    updatedBy: actor._id,
  });

  await addActivityLog({
    actor,
    action: "SECTION_CREATED",
    message: `Section created: ${classRecord.displayName || classRecord.name}-${section.name}`,
    entityId: section._id,
  });

  return sanitizeSection(section.toObject(), classRecord);
};

export const getSectionById = async ({ actor, id }) => {
  ensureMongoMode();

  const section = await findSectionById(actor, id);

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const classRecord = await findClassById(actor, section.classId);

  return sanitizeSection(section, classRecord);
};

export const updateSection = async ({ actor, id, payload }) => {
  ensureMongoMode();

  const section = await findSectionById(actor, id);

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const nextClassId = payload.classId || section.classId;
  const classRecord = await validateClass(actor, nextClassId);
  const nextName =
    payload.name !== undefined ? payload.name.trim() : section.name;
  const nextCode =
    payload.code !== undefined ? normalizeCode(payload.code) : section.code;

  await validateUniqueSection(
    actor,
    {
      classId: nextClassId,
      code: nextCode,
      name: nextName,
    },
    section._id,
  );

  await Section.updateOne(
    { _id: section._id },
    {
      $set: {
        classId: nextClassId,
        name: nextName,
        code: nextCode,
        ...(payload.sortOrder !== undefined
          ? { sortOrder: Number(payload.sortOrder) }
          : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        updatedBy: actor._id,
      },
    },
  );

  const updated = await Section.findById(section._id).lean();

  await addActivityLog({
    actor,
    action: "SECTION_UPDATED",
    message: `Section updated: ${classRecord.displayName || classRecord.name}-${updated.name}`,
    entityId: updated._id,
  });

  return sanitizeSection(updated, classRecord);
};

export const disableSection = async ({ actor, id }) => {
  ensureMongoMode();

  const section = await findSectionById(actor, id);

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  await Section.updateOne(
    { _id: section._id },
    {
      $set: {
        status: "inactive",
        updatedBy: actor._id,
      },
    },
  );

  const updated = await Section.findById(section._id).lean();
  const classRecord = await findClassById(actor, updated.classId);

  await addActivityLog({
    actor,
    action: "SECTION_DISABLED",
    message: `Section disabled: ${updated.name}`,
    entityId: updated._id,
  });

  return sanitizeSection(updated, classRecord);
};

export const deleteSection = async ({ actor, id }) => {
  ensureMongoMode();

  const section = await findSectionById(actor, id);

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  await Section.updateOne(
    { _id: section._id },
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
    action: "SECTION_DELETED",
    message: `Section deleted: ${section.name}`,
    entityId: section._id,
  });

  return { deleted: true };
};
