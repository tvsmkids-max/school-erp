import mongoose from "mongoose";
import { env } from "./env.js";
import { initLocalDb, getLocalDbStatus } from "./localDb.js";
import { logger } from "../utils/logger.js";

const dbStateMap = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const connectDB = async () => {
  if (env.dbMode === "local") {
    const localState = await initLocalDb(env.localDbFile);
    logger.warn(
      "Running with LOCAL JSON DB. Use MongoDB Atlas for production.",
    );
    logger.info(`Local DB file: ${localState.filePath}`);
    return localState;
  }

  if (env.dbMode === "mongodb") {
    try {
      const state = await initLocalDb(env.localDbFile);
      logger.info(`MongoDB connected: ${mongoose.connection.host}`);
      logger.warn(
        "Running with MongoDB JSON bridge. Normalize collections before final production scale.",
      );
      return state;
    } catch (error) {
      logger.error(`MongoDB connection failed: ${error.message}`);
      throw error;
    }
  }

  throw new Error("Invalid DB_MODE. Use local or mongodb.");
};

export const disconnectDB = async () => {
  if (env.dbMode === "local") {
    logger.info("Local DB disconnected");
    return;
  }

  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};

export const getDatabaseStatus = () => {
  if (env.dbMode === "local") {
    return getLocalDbStatus();
  }

  return {
    ...getLocalDbStatus(),
    mongooseState: dbStateMap[mongoose.connection.readyState] || "unknown",
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};
