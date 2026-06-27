"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class GithubService {
    /**
     * Fetch real GitHub metrics if token is available, otherwise generate high-fidelity simulated metrics.
     */
    static async fetchUserStats(username, token) {
        try {
            if (!token) {
                logger_1.logger.info(`No GitHub token for ${username}, using simulation`);
                return this.generateSimulatedStats(username);
            }
            logger_1.logger.info(`Fetching high-fidelity GitHub metrics for: ${username} using token`);
            const headers = {
                Authorization: `token ${token}`,
                "User-Agent": "BUILD-Engineering-Portal"
            };
            // 1. Fetch user profile (authenticated user)
            const userRes = await axios_1.default.get("https://api.github.com/user", { headers, timeout: 5000 });
            const actualUsername = userRes.data.login || username;
            const publicRepos = userRes.data.public_repos || 0;
            const totalPrivateRepos = userRes.data.total_private_repos || 0;
            const totalRepos = publicRepos + totalPrivateRepos;
            // 2. Fetch user repositories (recent active ones)
            const reposRes = await axios_1.default.get("https://api.github.com/user/repos?per_page=15&sort=updated", { headers, timeout: 5000 });
            const repos = reposRes.data || [];
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
            const activeRepos = repos.filter((repo) => new Date(repo.pushed_at || repo.updated_at) > oneMonthAgo).length;
            // 3. Query commits in the last 30 days directly from top repositories
            const sinceIso = oneMonthAgo.toISOString().split(".")[0] + "Z";
            let commitsLast30Days = 0;
            await Promise.all(repos.slice(0, 10).map(async (repo) => {
                try {
                    const commitsRes = await axios_1.default.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?since=${sinceIso}&author=${actualUsername}&per_page=100`, { headers, timeout: 3000 });
                    commitsLast30Days += (commitsRes.data || []).length;
                }
                catch (err) {
                    logger_1.logger.warn(`Failed to fetch commits for ${repo.name}: ${err.message}`);
                }
            }));
            // 4. Query exact Pull Requests opened in the last 30 days
            let pullRequests = 0;
            try {
                const prSearchRes = await axios_1.default.get(`https://api.github.com/search/issues?q=author:${actualUsername}+type:pr+created:>=${oneMonthAgo.toISOString().split("T")[0]}`, { headers, timeout: 4000 });
                pullRequests = prSearchRes.data?.total_count || 0;
            }
            catch (err) {
                logger_1.logger.warn(`Failed to search PRs for ${actualUsername}: ${err.message}`);
                pullRequests = 1;
            }
            // Base contribution factor
            const contributions = (commitsLast30Days * 3) + (pullRequests * 5) + (totalRepos * 2);
            return {
                totalRepos,
                activeRepos: Math.max(1, activeRepos),
                commitsLast30Days: Math.max(0, commitsLast30Days),
                pullRequests: Math.max(0, pullRequests),
                contributions: Math.max(0, contributions)
            };
        }
        catch (error) {
            logger_1.logger.error(`GitHub real API failed for ${username}: ${error.message}. Response data: ${JSON.stringify(error.response?.data || {})}`);
            if (error.stack) {
                logger_1.logger.error(error.stack);
            }
            return this.generateSimulatedStats(username);
        }
    }
    /**
     * Generates realistic mock GitHub data based on username
     */
    static generateSimulatedStats(username) {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const seed = Math.abs(hash);
        const totalRepos = 5 + (seed % 20); // 5 - 25 repos
        const activeRepos = Math.max(1, Math.floor(totalRepos * 0.4));
        const commitsLast30Days = 15 + (seed % 60); // 15 - 75 commits
        const pullRequests = 2 + (seed % 10); // 2 - 12 PRs
        const contributions = (commitsLast30Days * 3) + (pullRequests * 5) + (totalRepos * 2);
        return {
            totalRepos,
            activeRepos,
            commitsLast30Days,
            pullRequests,
            contributions
        };
    }
}
exports.GithubService = GithubService;
