import { Router } from "express";
import { getDatabaseStatus } from "../../config/db.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          app: "School ERP Backend",
          school: "THAKUR VIRENDRA SINGH MEMORIAL SCHOOL",
          board: "MPBSE",
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
          database: getDatabaseStatus(),
        },
        "Backend health check successful"
      )
    );
  })
);

export default router;