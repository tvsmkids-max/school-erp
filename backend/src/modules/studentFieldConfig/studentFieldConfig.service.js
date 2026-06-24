import { env } from "../../config/env.js";
import { ActivityLog, StudentFieldConfig } from "../../models/nativeModels.js";
import {
  getFlatStudentFields,
  STUDENT_FIELD_DEFINITIONS,
} from "../../constants/studentFields.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";

const now = () => new Date().toISOString();

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(
      500,
      "Native student field config service requires DB_MODE=mongodb.",
    );
  }
};

const addActivityLog = async ({ actor, action, message }) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module: "Student Field Configuration",
    action,
    message,
    entityType: "StudentFieldConfig",
    entityId: null,
    ipAddress: null,
    userAgent: null,
    createdAt: now(),
  });
};

const ensureConfigRecords = async (actor) => {
  const flatFields = getFlatStudentFields();
  let createdCount = 0;

  for (const field of flatFields) {
    const exists = await StudentFieldConfig.findOne({
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      fieldKey: field.fieldKey,
    }).lean();

    if (!exists) {
      await StudentFieldConfig.create({
        _id: createId("studentField"),
        tenantId: actor.tenantId,
        branchId: actor.branchId,
        groupKey: field.groupKey,
        groupLabel: field.groupLabel,
        fieldKey: field.fieldKey,
        label: field.label,
        isVisible: field.defaultVisible,
        isMandatory: field.defaultMandatory,
        isReadOnly: field.defaultReadOnly,
        sortOrder: field.sortOrder,
        status: "active",
        createdBy: actor._id,
        updatedBy: actor._id,
      });

      createdCount += 1;
    }
  }

  return createdCount;
};

const groupedConfig = (configs) => {
  const groups = new Map();

  for (const config of configs.sort(
    (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
  )) {
    if (!groups.has(config.groupKey)) {
      groups.set(config.groupKey, {
        groupKey: config.groupKey,
        groupLabel: config.groupLabel,
        fields: [],
      });
    }

    groups.get(config.groupKey).fields.push({
      _id: config._id,
      fieldKey: config.fieldKey,
      label: config.label,
      isVisible: config.isVisible,
      isMandatory: config.isMandatory,
      isReadOnly: config.isReadOnly,
      sortOrder: config.sortOrder,
      status: config.status,
      updatedAt: config.updatedAt,
    });
  }

  return [...groups.values()];
};

export const getStudentFieldConfig = async ({ actor }) => {
  ensureMongoMode();

  await ensureConfigRecords(actor);

  const configs = await StudentFieldConfig.find({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    status: "active",
  }).lean();

  return groupedConfig(configs);
};

export const updateStudentFieldConfig = async ({ actor, fields }) => {
  ensureMongoMode();

  await ensureConfigRecords(actor);

  const flatDefinitions = getFlatStudentFields();

  for (const update of fields) {
    const definition = flatDefinitions.find(
      (item) => item.fieldKey === update.fieldKey,
    );

    if (!definition) {
      throw new ApiError(400, `Invalid student field: ${update.fieldKey}`);
    }

    const patch = {};

    if (update.label !== undefined) patch.label = update.label.trim();
    if (update.isVisible !== undefined) patch.isVisible = update.isVisible;
    if (update.isMandatory !== undefined)
      patch.isMandatory = update.isMandatory;
    if (update.isReadOnly !== undefined) patch.isReadOnly = update.isReadOnly;
    if (update.sortOrder !== undefined)
      patch.sortOrder = Number(update.sortOrder);

    if (patch.isMandatory === true) {
      patch.isVisible = true;
    }

    patch.updatedBy = actor._id;

    const result = await StudentFieldConfig.updateOne(
      {
        tenantId: actor.tenantId,
        branchId: actor.branchId,
        fieldKey: update.fieldKey,
      },
      { $set: patch },
    );

    if (result.matchedCount === 0) {
      throw new ApiError(
        404,
        `Student field config not found: ${update.fieldKey}`,
      );
    }
  }

  await addActivityLog({
    actor,
    action: "STUDENT_FIELD_CONFIG_UPDATED",
    message: `Student field configuration updated (${fields.length} fields)`,
  });

  const configs = await StudentFieldConfig.find({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    status: "active",
  }).lean();

  return groupedConfig(configs);
};

export const resetStudentFieldConfigDefaults = async ({ actor }) => {
  ensureMongoMode();

  await StudentFieldConfig.deleteMany({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
  });

  const flatFields = getFlatStudentFields();

  await StudentFieldConfig.insertMany(
    flatFields.map((field) => ({
      _id: createId("studentField"),
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      groupKey: field.groupKey,
      groupLabel: field.groupLabel,
      fieldKey: field.fieldKey,
      label: field.label,
      isVisible: field.defaultVisible,
      isMandatory: field.defaultMandatory,
      isReadOnly: field.defaultReadOnly,
      sortOrder: field.sortOrder,
      status: "active",
      createdBy: actor._id,
      updatedBy: actor._id,
    })),
  );

  await addActivityLog({
    actor,
    action: "STUDENT_FIELD_CONFIG_RESET",
    message: "Student field configuration reset to defaults",
  });

  const configs = await StudentFieldConfig.find({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    status: "active",
  }).lean();

  return groupedConfig(configs);
};

export const getStudentFieldDefinitions = () => {
  return STUDENT_FIELD_DEFINITIONS;
};
