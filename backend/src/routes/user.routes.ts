import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { profileSchema, validate } from "../utils/validators";

const router = Router();

router.use(authMiddleware);

router.get("/profile", UserController.getProfile);
router.put("/profile", validate(profileSchema), UserController.updateProfile);

export default router;
