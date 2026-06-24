import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { readLocalDb, writeLocalDb } from "../../config/localDb.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";

const now = () => new Date().toISOString();

const NATIVE_COLLECTIONS = [
  "tenants",
  "branches",
  "permissions",
  "roles",
  "users",
  "user_sessions",
  "academic_sessions",
  "classes",
  "sections",
  "students",
  "student_field_configs",
  "attendance_records",
  "activity_logs",
  "student_import_batches",
  "backup_history",
];

const ensureSuperAdmin = (actor) => {
  if (actor.roleKey !== "super_admin") {
    throw new ApiError(403, "Only Super Admin can access backups");
  }
};

const getBackupDir = () => {
  return path.resolve(process.cwd(), "data", "backups");
};

const safeFileName = (value) => {
  return String(value || "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
};

const getMongoDb = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(500, "MongoDB is not connected");
  }

  return mongoose.connection.db;
};

const createBackupPayload = async ({ actor, type }) => {
  if (env.dbMode === "mongodb") {
    const mongoDb = getMongoDb();
    const collections = {};

    for (const collectionName of NATIVE_COLLECTIONS) {
      collections[collectionName] = await mongoDb
        .collection(collectionName)
        .find({})
        .toArray();
    }

    return {
      _backup: {
        backupId: createId("backup"),
        createdAt: now(),
        createdBy: actor._id,
        createdByUsername: actor.username,
        type,
        source: "mongodb-native",
        collections: NATIVE_COLLECTIONS,
      },
      collections,
    };
  }

  const db = await readLocalDb();

  return {
    ...db,
    _backup: {
      backupId: createId("backup"),
      createdAt: now(),
      createdBy: actor._id,
      createdByUsername: actor.username,
      type,
      source: "local-json-db",
    },
  };
};

const writeBackupHistory = async ({
  actor,
  fileName,
  filePath,
  type,
  status,
  restoredFrom = "",
  safetyBackupFileName = "",
}) => {
  if (env.dbMode === "mongodb") {
    const mongoDb = getMongoDb();

    await mongoDb.collection("backup_history").insertOne({
      _id: createId("backupHistory"),
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      fileName,
      filePath,
      type,
      status,
      restoredFrom,
      safetyBackupFileName,
      createdBy: actor._id,
      createdAt: now(),
    });

    return;
  }

  const db = await readLocalDb();

  if (!Array.isArray(db.backup_history)) {
    db.backup_history = [];
  }

  db.backup_history.push({
    _id: createId("backupHistory"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    fileName,
    filePath,
    type,
    status,
    restoredFrom,
    safetyBackupFileName,
    createdBy: actor._id,
    createdAt: now(),
  });

  await writeLocalDb(db);
};

const createSafetyBackupBeforeRestore = async ({ actor }) => {
  const backupDir = getBackupDir();

  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `pre-restore-safety-backup-${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  const payload = await createBackupPayload({
    actor,
    type: "pre_restore_safety",
  });

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");

  return { fileName, filePath };
};

const validateBackupPayload = (payload) => {
  if (payload?._backup?.source === "mongodb-native") {
    if (!payload.collections || typeof payload.collections !== "object") {
      throw new ApiError(400, "Invalid native MongoDB backup file");
    }

    return "mongodb-native";
  }

  if (Array.isArray(payload.tenants) && Array.isArray(payload.users)) {
    return "local-json-db";
  }

  throw new ApiError(400, "Invalid backup file format");
};

const restoreNativeMongoBackup = async ({ payload }) => {
  const mongoDb = getMongoDb();

  for (const collectionName of NATIVE_COLLECTIONS) {
    const records = Array.isArray(payload.collections[collectionName])
      ? payload.collections[collectionName]
      : [];

    const collection = mongoDb.collection(collectionName);

    await collection.deleteMany({});

    if (records.length > 0) {
      await collection.insertMany(records);
    }
  }
};

export const createManualBackup = async ({ actor }) => {
  ensureSuperAdmin(actor);

  const backupDir = getBackupDir();

  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${env.dbMode}-${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  const payload = await createBackupPayload({
    actor,
    type: "manual",
  });

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");

  await writeBackupHistory({
    actor,
    fileName,
    filePath,
    type: "manual",
    status: "completed",
  });

  return {
    fileName,
    filePath,
    createdAt: now(),
  };
};

export const listBackupHistory = async ({ actor }) => {
  ensureSuperAdmin(actor);

  if (env.dbMode === "mongodb") {
    const mongoDb = getMongoDb();

    return mongoDb
      .collection("backup_history")
      .find({
        tenantId: actor.tenantId,
        branchId: actor.branchId,
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  const db = await readLocalDb();

  return (db.backup_history || [])
    .filter(
      (item) =>
        item.tenantId === actor.tenantId && item.branchId === actor.branchId,
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
};

export const getBackupFileForDownload = async ({ actor, fileName }) => {
  ensureSuperAdmin(actor);

  const safeName = safeFileName(fileName);
  const backupDir = getBackupDir();
  const filePath = path.join(backupDir, safeName);

  const resolvedBackupDir = path.resolve(backupDir);
  const resolvedFilePath = path.resolve(filePath);

  if (!resolvedFilePath.startsWith(resolvedBackupDir)) {
    throw new ApiError(400, "Invalid backup file name");
  }

  try {
    await fs.access(resolvedFilePath);
  } catch (error) {
    throw new ApiError(404, "Backup file not found");
  }

  return {
    fileName: safeName,
    filePath: resolvedFilePath,
  };
};

export const getCurrentLocalDbFile = async ({ actor }) => {
  ensureSuperAdmin(actor);

  const backupDir = getBackupDir();

  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `current-${env.dbMode}-${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  const payload = await createBackupPayload({
    actor,
    type: "current_export",
  });

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");

  return {
    fileName,
    filePath,
  };
};

export const restoreBackup = async ({ actor, fileName }) => {
  ensureSuperAdmin(actor);

  const backupFile = await getBackupFileForDownload({ actor, fileName });
  const backupRaw = await fs.readFile(backupFile.filePath, "utf-8");
  const payload = JSON.parse(backupRaw);
  const backupType = validateBackupPayload(payload);
  const safetyBackup = await createSafetyBackupBeforeRestore({ actor });

  if (env.dbMode === "mongodb") {
    if (backupType !== "mongodb-native") {
      throw new ApiError(
        400,
        "Cannot restore local JSON backup while DB_MODE=mongodb. Use native MongoDB backup.",
      );
    }

    await restoreNativeMongoBackup({ payload });
  } else {
    if (backupType !== "local-json-db") {
      throw new ApiError(
        400,
        "Cannot restore MongoDB native backup while DB_MODE=local.",
      );
    }

    await writeLocalDb(payload);
  }

  await writeBackupHistory({
    actor,
    fileName: backupFile.fileName,
    filePath: backupFile.filePath,
    type: "restore",
    status: "completed",
    restoredFrom: backupFile.fileName,
    safetyBackupFileName: safetyBackup.fileName,
  });

  return {
    restoredFrom: backupFile.fileName,
    safetyBackupFileName: safetyBackup.fileName,
    restoredAt: now(),
  };
};
