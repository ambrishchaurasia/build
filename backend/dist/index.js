"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/user", user_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/reports", report_routes_1.default);
app.use("/api/ai", ai_routes_1.default);
// Base route
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", service: "BUILD Backend" });
});
// Error handling middleware
app.use(error_middleware_1.errorMiddleware);
// Start server
app.listen(PORT, () => {
    logger_1.logger.info(`BUILD server started on port ${PORT}`);
});
// Nodemon refresh trigger comment
