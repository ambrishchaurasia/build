import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { goalSchema, validate } from "../utils/validators";

const router = Router();

router.use(authMiddleware);

router.get("/", DashboardController.getDashboardData);
router.post("/sync", DashboardController.syncMetrics);
router.post("/sync/googlefit", DashboardController.syncGoogleFit);
router.post("/goals", validate(goalSchema), DashboardController.createGoal);
router.post("/goals/:goalId/toggle", DashboardController.toggleGoalCompletion);
router.delete("/goals/:goalId", DashboardController.deleteGoal);

export default router;
