import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { env } from "./env.js";

const MONGO_STORE_COLLECTION = "erp_json_store";
const MONGO_STORE_KEY = "main";

const defaultDatabase = () => ({
  _meta: {
    engine: env.dbMode === "mongodb" ? "mongodb-json" : "local-json",
    warning:
      env.dbMode === "mongodb"
        ? "MongoDB JSON bridge. Future upgrade should migrate to normalized MongoDB collections."
        : "Development only. Use MongoDB Atlas in production.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  tenants: [],
  branches: [],
  roles: [],
  permissions: [],
  users: [],
  students: [],
  student_field_configs: [],
  student_promotion_logs: [],
  student_import_batches: [],
  attendance_records: [],
  backup_history: [],
  user_sessions: [],
  academic_sessions: [],
  classes: [],
  sections: [],
  activity_logs: [],
});

let localDbState = {
  connected: false,
  engine: null,
  filePath: null,
  mongoCollection: null,
  startedAt: null,
};

const resolveFilePath = (filePath) => {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(process.cwd(), filePath);
};

const ensureMongoConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is required when DB_MODE=mongodb");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri, {
    autoIndex: env.isDevelopment,
    serverSelectionTimeoutMS: 10000,
  });
};

const getMongoCollection = () => {
  return mongoose.connection.db.collection(MONGO_STORE_COLLECTION);
};

const initMongoJsonDb = async () => {
  await ensureMongoConnection();

  const collection = getMongoCollection();
  const existing = await collection.findOne({ key: MONGO_STORE_KEY });

  if (!existing) {
    await collection.insertOne({
      key: MONGO_STORE_KEY,
      db: defaultDatabase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await collection.createIndex({ key: 1 }, { unique: true });

  localDbState = {
    connected: true,
    engine: "mongodb-json",
    filePath: null,
    mongoCollection: MONGO_STORE_COLLECTION,
    startedAt: new Date().toISOString(),
  };

  return localDbState;
};

export const initLocalDb = async (filePath) => {
  if (env.dbMode === "mongodb") {
    return initMongoJsonDb();
  }

  const resolvedPath = resolveFilePath(filePath || "./data/local-db.json");
  const dirName = path.dirname(resolvedPath);

  await fs.mkdir(dirName, { recursive: true });

  try {
    await fs.access(resolvedPath);
  } catch (error) {
    const initialDb = defaultDatabase();
    await fs.writeFile(
      resolvedPath,
      JSON.stringify(initialDb, null, 2),
      "utf-8",
    );
  }

  localDbState = {
    connected: true,
    engine: "local-json",
    filePath: resolvedPath,
    mongoCollection: null,
    startedAt: new Date().toISOString(),
  };

  return localDbState;
};

export const getLocalDbStatus = () => {
  return {
    engine:
      localDbState.engine ||
      (env.dbMode === "mongodb" ? "mongodb-json" : "local-json"),
    state: localDbState.connected ? "connected" : "disconnected",
    filePath: localDbState.filePath,
    mongoCollection: localDbState.mongoCollection,
    startedAt: localDbState.startedAt,
  };
};

export const readLocalDb = async () => {
  if (!localDbState.connected) {
    await initLocalDb(env.localDbFile);
  }

  if (localDbState.engine === "mongodb-json") {
    const collection = getMongoCollection();
    const doc = await collection.findOne({ key: MONGO_STORE_KEY });

    if (!doc?.db) {
      const initialDb = defaultDatabase();
      await collection.updateOne(
        { key: MONGO_STORE_KEY },
        {
          $set: { db: initialDb, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
      return initialDb;
    }

    return doc.db;
  }

  if (!localDbState.filePath) {
    throw new Error("Local DB is not initialized");
  }

  const raw = await fs.readFile(localDbState.filePath, "utf-8");
  return JSON.parse(raw);
};

export const writeLocalDb = async (db) => {
  if (!localDbState.connected) {
    await initLocalDb(env.localDbFile);
  }

  const updatedDb = {
    ...db,
    _meta: {
      ...(db._meta || {}),
      engine:
        localDbState.engine === "mongodb-json" ? "mongodb-json" : "local-json",
      warning:
        localDbState.engine === "mongodb-json"
          ? "MongoDB JSON bridge. Future upgrade should migrate to normalized MongoDB collections."
          : "Development only. Use MongoDB Atlas in production.",
      updatedAt: new Date().toISOString(),
    },
  };

  if (localDbState.engine === "mongodb-json") {
    const collection = getMongoCollection();
    await collection.updateOne(
      { key: MONGO_STORE_KEY },
      {
        $set: {
          db: updatedDb,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    return updatedDb;
  }

  if (!localDbState.filePath) {
    throw new Error("Local DB is not initialized");
  }

  await fs.writeFile(
    localDbState.filePath,
    JSON.stringify(updatedDb, null, 2),
    "utf-8",
  );
  return updatedDb;
};

export const getLocalCollection = async (collectionName) => {
  const db = await readLocalDb();
  return Array.isArray(db[collectionName]) ? db[collectionName] : [];
};

export const setLocalCollection = async (collectionName, records) => {
  const db = await readLocalDb();
  db[collectionName] = Array.isArray(records) ? records : [];
  await writeLocalDb(db);
  return db[collectionName];
};
