import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "ambrish" }
  });
  
  if (!user) {
    console.log("No user found with email ambrish!");
    return;
  }

  const userId = user.id;
  console.log(`Adding demo tasks for user: ${userId}`);

  const today = new Date();
  
  // Array of day offsets: 0 = today, 1 = yesterday, etc.
  const offsets = [0, 1, 2, 3];

  for (const offset of offsets) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - offset);
    targetDate.setHours(12, 0, 0, 0); // Noon

    // Task 1: Completed
    const goal1 = await prisma.goal.create({
      data: {
        userId,
        category: "CODING",
        title: `Complete Leetcode Daily - Day ${offset}`,
        frequency: "DAILY",
        createdAt: targetDate,
        lastCompleted: targetDate
      }
    });

    await prisma.goalLog.create({
      data: {
        goalId: goal1.id,
        completedAt: targetDate
      }
    });

    // Task 2: Uncompleted
    await prisma.goal.create({
      data: {
        userId,
        category: "PROJECT",
        title: `Work on frontend UI - Day ${offset}`,
        frequency: "DAILY",
        createdAt: targetDate,
      }
    });

    // Task 3: Completed
    const goal3 = await prisma.goal.create({
      data: {
        userId,
        category: "FITNESS_MIND",
        title: `100 Pushups - Day ${offset}`,
        frequency: "DAILY",
        createdAt: targetDate,
        lastCompleted: targetDate
      }
    });

    await prisma.goalLog.create({
      data: {
        goalId: goal3.id,
        completedAt: targetDate
      }
    });
  }

  console.log("Demo tasks added successfully!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
