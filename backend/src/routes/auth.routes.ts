import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { signupSchema, loginSchema, validate } from "../utils/validators";

const router = Router();

router.post("/signup", validate(signupSchema), AuthController.signup);
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/google", AuthController.googleAuth);
router.post("/github/callback", authMiddleware, AuthController.githubCallback);
router.post("/github/disconnect", authMiddleware, AuthController.githubDisconnect);
router.post("/logout", AuthController.logout);
router.get("/me", authMiddleware, AuthController.me);

export default router;