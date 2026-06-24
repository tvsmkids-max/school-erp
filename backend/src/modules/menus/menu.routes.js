import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getMyMenu } from "./menu.controller.js";

const router = Router();

router.get("/me", authenticate, getMyMenu);

export default router;