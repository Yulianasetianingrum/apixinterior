
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const logPath = path.join(__dirname, 'nuke_log.txt');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logPath, msg + '\n');
}

async function main() {
    log(`Starting Nuke at ${new Date().toISOString()}`);
    try {
        const deleted = await prisma.homepageSectionDraft.deleteMany({
            where: { type: 'TESTIMONIALS' }
        });
        log(`Deleted ${deleted.count} sections.`);
    } catch (e) {
        log(`Error: ${e.message}`);
    } finally {
        await prisma.$disconnect();
        log("Done.");
    }
}

main();
