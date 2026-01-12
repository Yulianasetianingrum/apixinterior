const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB Check...");
    try {
        // Try to access the missing table
        const count = await prisma.post.count();
        console.log("SUCCESS: Posts table exists. Count:", count);
    } catch (e) {
        console.error("FAILURE: Error accessing Post table.");
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
