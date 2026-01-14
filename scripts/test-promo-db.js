
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking Prisma Client connection...");
        const config = await prisma.promoPageConfig.findFirst({ where: { id: 1 } });
        console.log("PromoPageConfig found:", config);
        console.log("SUCCESS: Prisma Client can access promoPageConfig");
    } catch (error) {
        console.error("ERROR:", error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
