const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log("Checking Prisma Client Keys...");
const keys = Object.keys(prisma); // This implies initialization

// Access property to force lazy load if needed
const hasDynamicPage = 'dynamicPage' in prisma;
const hasPost = 'post' in prisma;

console.log("Has dynamicPage:", hasDynamicPage);
console.log("Has post:", hasPost);

if (!hasDynamicPage) {
    console.log("Available keys:", keys);
}
