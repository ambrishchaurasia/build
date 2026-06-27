"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooglefitService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class GooglefitService {
    /**
     * Fetch aggregate Google Fit metrics (steps, active minutes) for the past 7 days.
     * If token is invalid or fails, it falls back to high-fidelity simulated metrics.
     */
    static async fetchFitnessMetrics(token, email) {
        try {
            if (!token || token.startsWith("simulated_")) {
                logger_1.logger.info(`No real Google Fit token for ${email}, using simulated fitness metrics`);
                return this.generateSimulatedMetrics(email);
            }
            logger_1.logger.info(`Fetching Google Fit metrics for: ${email}`);
            const endTime = Date.now();
            const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
            const response = await axios_1.default.post("https://www.googleapis.com/fitness/v1/users/me/dataset/aggregate", {
                aggregateBy: [
                    {
                        dataTypeName: "com.google.step_count.delta"
                    },
                    {
                        dataTypeName: "com.google.active_minutes"
                    }
                ],
                bucketByTime: { durationMillis: 86400000 }, // 1 day
                startTimeMillis: startTime,
                endTimeMillis: endTime
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                timeout: 5000
            });
            const buckets = response.data?.bucket || [];
            let totalSteps = 0;
            let totalMinutes = 0;
            let activeDaysCount = 0;
            let validBuckets = 0;
            for (const bucket of buckets) {
                let dailySteps = 0;
                let dailyMinutes = 0;
                const datasets = bucket.dataset || [];
                for (const ds of datasets) {
                    const points = ds.point || [];
                    for (const pt of points) {
                        const values = pt.value || [];
                        for (const val of values) {
                            const valNum = val.intVal !== undefined ? val.intVal : (val.fpVal || 0);
                            if (pt.dataTypeName === "com.google.step_count.delta" || ds.dataSourceId?.includes("step_count")) {
                                dailySteps += valNum;
                            }
                            else if (pt.dataTypeName === "com.google.active_minutes" || ds.dataSourceId?.includes("active_minutes")) {
                                dailyMinutes += valNum;
                            }
                        }
                    }
                }
                totalSteps += dailySteps;
                totalMinutes += dailyMinutes;
                if (dailySteps > 3000 || dailyMinutes > 10) {
                    activeDaysCount++;
                }
                validBuckets++;
            }
            const averageSteps = validBuckets > 0 ? Math.round(totalSteps / validBuckets) : 0;
            return {
                workoutDays: activeDaysCount,
                steps: averageSteps,
                workoutMinutes: Math.round(totalMinutes)
            };
        }
        catch (error) {
            logger_1.logger.warn(`Google Fit API failed for ${email}: ${error.message}. Returning simulated metrics.`);
            return this.generateSimulatedMetrics(email);
        }
    }
    /**
     * Generate realistic simulated fitness metrics based on user's email
     */
    static generateSimulatedMetrics(email) {
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = email.charCodeAt(i) + ((hash << 5) - hash);
        }
        const seed = Math.abs(hash);
        const workoutDays = 3 + (seed % 5); // 3 to 7 days
        const averageSteps = 6000 + (seed % 6000); // 6,000 to 12,000 steps
        const workoutMinutes = 90 + (seed % 180); // 90 to 270 minutes total per week
        return {
            workoutDays,
            steps: averageSteps,
            workoutMinutes
        };
    }
}
exports.GooglefitService = GooglefitService;
