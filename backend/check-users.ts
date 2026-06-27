import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email })));
  
  const goals = await prisma.goal.findMany();
  console.log("Total Goals:", goals.length);
  
  // Also check exactly how many goals exist for each user
  for (const u of users) {
    const ug = goals.filter(g => g.userId === u.id);
    console.log(`User ${u.email} has ${ug.length} goals.`);
  }
}

main().finally(() => prisma.$disconnect());
