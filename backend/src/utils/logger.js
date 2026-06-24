import { env } from "../config/env.js";

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaText = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level}] ${message}${metaText}`;
};

export const logger = {
  info(message, meta) {
    console.log(formatMessage("INFO", message, meta));
  },

  warn(message, meta) {
    console.warn(formatMessage("WARN", message, meta));
  },

  error(message, meta) {
    console.error(formatMessage("ERROR", message, meta));
  },

  debug(message, meta) {
    if (env.isDevelopment) {
      console.debug(formatMessage("DEBUG", message, meta));
    }
  },
};