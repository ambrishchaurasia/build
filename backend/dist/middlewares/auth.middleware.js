"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("./error.middleware");
const logger_1 = require("../utils/logger");
const JWT_SECRET = process.env.JWT_SECRET || "studentos-ai-super-secret-key";
const authMiddleware = (req, res, next) => {
    try {
        let token = "";
        // 1. Check Authorization Header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
        // 2. Check Cookie (manual parsing to avoid adding extra dependency)
        if (!token && req.headers.cookie) {
            const parsedCookies = Object.fromEntries(req.headers.cookie.split(";").map((c) => {
                const [key, ...val] = c.trim().split("=");
                return [key, val.join("=")];
            }));
            token = parsedCookies["accessToken"];
        }
        if (!token) {
            throw new error_middleware_1.ApiError(401, "Authentication token is missing");
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email || ""
        };
        next();
    }
    catch (error) {
        logger_1.logger.warn("Authentication failed", error);
        next(new error_middleware_1.ApiError(401, "Unauthorized access"));
    }
};
exports.authMiddleware = authMiddleware;
