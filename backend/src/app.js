import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import { env } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { globalRateLimiter } from "./middlewares/rateLimit.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import menuRoutes from "./modules/menus/menu.routes.js";
import permissionRoutes from "./modules/permissions/permission.routes.js";
import roleRoutes from "./modules/roles/role.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import academicSessionRoutes from "./modules/academicSessions/academicSession.routes.js";
import classRoutes from "./modules/classes/class.routes.js";
import sectionRoutes from "./modules/sections/section.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import studentFieldConfigRoutes from "./modules/studentFieldConfig/studentFieldConfig.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import backupRoutes from "./modules/backups/backup.routes.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(mongoSanitize());
app.use(hpp());

app.use(globalRateLimiter);

if (env.isDevelopment) {
  app.use(morgan("dev"));
}

app.get("/favicon.ico", (req, res) => {
  return res.status(204).end();
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "School ERP Backend API is running",
    data: {
      school: "THAKUR VIRENDRA SINGH MEMORIAL SCHOOL",
      board: "MPBSE",
      apiVersion: "v1",
      health: "/api/v1/health",
    },
  });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/menus", menuRoutes);
app.use("/api/v1/permissions", permissionRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/academic-sessions", academicSessionRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/sections", sectionRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/student-field-config", studentFieldConfigRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/backups", backupRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
