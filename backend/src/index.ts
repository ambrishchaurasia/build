import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import aiRoutes from "./routes/ai.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);

// Base route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "BUILD Backend" });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  logger.info(`BUILD server started on port ${PORT}`);
});
// Nodemon refresh trigger comment

