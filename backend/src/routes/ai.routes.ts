import { Router } from "express";
import { AiController } from "../controllers/ai.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/chat", authMiddleware, AiController.chat);

export default router;
