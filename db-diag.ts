import prisma from "./src/lib/prisma";

async function check() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        balance: true,
        subscriptionTier: true,
        portfolios: {
          include: {
            items: true
          }
        }
      }
    });
    console.log("DB USERS:", JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("DB ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
