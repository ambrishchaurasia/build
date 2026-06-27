"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const error_middleware_1 = require("../middlewares/error.middleware");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "studentos-ai-super-secret-key";
const JWT_EXPIRES_IN = "7d"; // Access token validity
class AuthController {
    static async signup(req, res, next) {
        try {
            const { name, email, password } = req.body;
            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new error_middleware_1.ApiError(400, "User with this email already exists");
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // Create user
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    xp: 100, // Start with 100 XP
                    level: 1,
                    tokens: 5 // Start with 5 tokens
                }
            });
            // Generate JWT
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email || undefined }, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });
            // Set cookie for web clients
            res.cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            logger_1.logger.info(`User signed up: ${user.email}`);
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    xp: user.xp,
                    level: user.level,
                    tokens: user.tokens
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            // Find user
            const user = await prisma.user.findUnique({
                where: { email },
                include: { profile: true }
            });
            if (!user) {
                throw new error_middleware_1.ApiError(401, "Invalid email or password");
            }
            // Verify password
            if (!user.password) {
                throw new error_middleware_1.ApiError(401, "Invalid email or password");
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw new error_middleware_1.ApiError(401, "Invalid email or password");
            }
            // Generate JWT
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email || undefined }, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });
            // Set cookie for web clients
            res.cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            logger_1.logger.info(`User logged in: ${user.email}`);
            res.status(200).json({
                success: true,
                message: "Logged in successfully",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    xp: user.xp,
                    level: user.level,
                    tokens: user.tokens,
                    hasProfile: !!user.profile
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            res.clearCookie("accessToken");
            res.status(200).json({
                success: true,
                message: "Logged out successfully"
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { profile: true }
            });
            if (!user) {
                throw new error_middleware_1.ApiError(404, "User not found");
            }
            res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    xp: user.xp,
                    level: user.level,
                    tokens: user.tokens,
                    hasProfile: !!user.profile,
                    hasGithubToken: !!user.githubToken,
                    hasGoogleFitToken: !!user.googleFitToken,
                    profile: user.profile
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async googleAuth(req, res, next) {
        try {
            const { email, name, avatar } = req.body;
            // Find or create user
            let user = await prisma.user.findUnique({
                where: { email },
                include: { profile: true }
            });
            if (!user) {
                // Create new user with google provider
                const randomPassword = await bcryptjs_1.default.hash(Math.random().toString(), 10);
                user = await prisma.user.create({
                    data: {
                        name,
                        email,
                        password: randomPassword,
                        avatar,
                        provider: "google",
                        xp: 150, // Google Sign Up rewards 150 XP
                        level: 1,
                        tokens: 10
                    },
                    include: { profile: true }
                });
                logger_1.logger.info(`New user registered via Google: ${email}`);
            }
            else {
                logger_1.logger.info(`User logged in via Google: ${email}`);
            }
            // Generate JWT
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email || undefined }, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });
            // Set cookie for web clients
            res.cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            res.status(200).json({
                success: true,
                message: "Google authentication completed",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    xp: user.xp,
                    level: user.level,
                    tokens: user.tokens,
                    hasProfile: !!user.profile
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async githubCallback(req, res, next) {
        try {
            const userId = req.user?.id;
            const { code } = req.body;
            if (!userId) {
                throw new error_middleware_1.ApiError(401, "Unauthorized");
            }
            if (!code) {
                throw new error_middleware_1.ApiError(400, "Authorization code is required");
            }
            const clientId = process.env.GITHUB_CLIENT_ID;
            const clientSecret = process.env.GITHUB_CLIENT_SECRET;
            if (!clientId || !clientSecret) {
                logger_1.logger.warn("GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not configured. Simulating GitHub link.");
                const simulatedToken = "simulated_github_token_" + Math.random().toString(36).substring(2, 10);
                await prisma.user.update({
                    where: { id: userId },
                    data: { githubToken: simulatedToken }
                });
                return res.status(200).json({
                    success: true,
                    message: "GitHub linked successfully (Simulated fallback)"
                });
            }
            logger_1.logger.info(`Exchanging code for token with GitHub for User ${userId}`);
            const tokenRes = await axios_1.default.post("https://github.com/login/oauth/access_token", {
                client_id: clientId,
                client_secret: clientSecret,
                code
            }, {
                headers: {
                    Accept: "application/json"
                }
            });
            const githubToken = tokenRes.data?.access_token;
            if (!githubToken) {
                throw new error_middleware_1.ApiError(400, "Failed to exchange authorization code for access token");
            }
            await prisma.user.update({
                where: { id: userId },
                data: { githubToken }
            });
            res.status(200).json({
                success: true,
                message: "GitHub linked successfully",
                githubToken
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async githubDisconnect(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new error_middleware_1.ApiError(401, "Unauthorized");
            }
            await prisma.user.update({
                where: { id: userId },
                data: { githubToken: null }
            });
            res.status(200).json({
                success: true,
                message: "GitHub account disconnected successfully"
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
