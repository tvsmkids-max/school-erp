import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { loginValidation } from "./auth.validation.js";
import { login, logout, logoutAll, me, refresh, sessions } from "./auth.controller.js";

const router = Router();

router.post("/login", authRateLimiter, validate(loginValidation), login);
router.post("/refresh", authRateLimiter, refresh);

router.post("/logout", authenticate, logout);
router.post("/logout-all", authenticate, logoutAll);
router.get("/me", authenticate, me);
router.get("/sessions", authenticate, sessions);

export default router;