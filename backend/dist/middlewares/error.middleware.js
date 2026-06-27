"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.ApiError = void 0;
const logger_1 = require("../utils/logger");
class ApiError extends Error {
    statusCode;
    errors;
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ApiError = ApiError;
const errorMiddleware = (err, req, res, next) => {
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err.message || "Internal Server Error";
    const errors = err instanceof ApiError ? err.errors : [];
    logger_1.logger.error(`API Error: ${statusCode} - ${message}`, err);
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};
exports.errorMiddleware = errorMiddleware;
