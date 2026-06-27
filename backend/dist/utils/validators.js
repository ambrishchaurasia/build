"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.goalSchema = exports.profileSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
const error_middleware_1 = require("../middlewares/error.middleware");
exports.signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.string().min(3, "Username must be at least 3 characters"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters")
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().min(3, "Username must be at least 3 characters"),
    password: zod_1.z.string().min(1, "Password is required")
});
exports.profileSchema = zod_1.z.object({
    careerGoal: zod_1.z.enum([
        "Software Engineer",
        "Data Scientist",
        "AI Engineer",
        "ML Engineer",
        "Product Manager",
        "Research Engineer"
    ]),
    semester: zod_1.z.number().int().min(1).max(10),
    cgpa: zod_1.z.number().min(0).max(10),
    targetPlacementYear: zod_1.z.number().int().min(2024).max(2035),
    targetCompanyType: zod_1.z.string().min(1, "Target company type is required")
});
exports.goalSchema = zod_1.z.object({
    category: zod_1.z.enum(["CODING", "PROJECT", "FITNESS_MIND", "HABIT"]),
    title: zod_1.z.string().min(2, "Title must be at least 2 characters"),
    description: zod_1.z.string().optional(),
    frequency: zod_1.z.enum(["DAILY", "WEEKLY"])
});
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessages = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message
                }));
                next(new error_middleware_1.ApiError(400, "Validation failed", errorMessages));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
