import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", ReportController.getWeeklyReports);
router.post("/generate", ReportController.generateReport);

export default router;
