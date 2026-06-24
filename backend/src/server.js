import http from "http";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = http.createServer(app);

    server.listen(env.port, () => {
      logger.info(`School ERP backend running on port ${env.port}`);
      logger.info(`Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.warn(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed");
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }

  setTimeout(() => {
    logger.error("Forced shutdown because graceful shutdown timed out");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection", {
    reason: reason instanceof Error ? reason.message : reason,
  });

  shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    message: error.message,
    stack: error.stack,
  });

  process.exit(1);
});

startServer();