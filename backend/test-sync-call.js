const { PrismaClient } = require("@prisma/client");
const { LeetcodeService } = require("./dist/services/leetcode.service");
const prisma = new PrismaClient();

async function main() {
  const userId = "39207848-6ccf-4471-9a41-ee4a1c713468"; // Ambrish Chaurasia
  const leetcodeUsername = "ambrish2003"; // test username

  console.log("Calling LeetcodeService.fetchUserStats...");
  const stats = await LeetcodeService.fetchUserStats(leetcodeUsername);
  console.log("Fetched Stats:", stats);

  console.log("Upserting into database...");
  const lcMetrics = await prisma.leetcodeMetrics.upsert({
    where: { userId },
    update: {
      totalSolved: stats.totalSolved,
      easySolved: stats.easySolved,
      mediumSolved: stats.mediumSolved,
      hardSolved: stats.hardSolved,
      contestRating: stats.contestRating,
      ranking: stats.ranking,
      lastSync: new Date()
    },
    create: {
      userId,
      totalSolved: stats.totalSolved,
      easySolved: stats.easySolved,
      mediumSolved: stats.mediumSolved,
      hardSolved: stats.hardSolved,
      contestRating: stats.contestRating,
      ranking: stats.ranking
    }
  });

  console.log("SUCCESS! Metrics in database:", lcMetrics);
}

main()
  .catch(e => console.error("FAILED ERROR:", e))
  .finally(() => prisma.$disconnect());
