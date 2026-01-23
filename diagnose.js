
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function check() {
    const log = [];
    log.push("--- Diagnostic Report ---");
    log.push(new Date().toISOString());

    // 1. Check .next folder
    if (fs.existsSync('./.next')) {
        log.push("[PASS] .next folder exists");
    } else {
        log.push("[FAIL] .next folder missing - build probably failed");
    }

    // 2. Check Database
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        log.push("[PASS] Database connection successful");
        const count = await prisma.homepageSection.count();
        log.push(`[PASS] Found ${count} homepage sections`);
    } catch (e) {
        log.push(`[FAIL] Database connection failed: ${e.message}`);
    } finally {
        await prisma.$disconnect();
    }

    // 3. Check Sharp
    try {
        const sharp = require('sharp');
        log.push("[PASS] Sharp loaded successfully");
    } catch (e) {
        log.push(`[FAIL] Sharp load failed: ${e.message}`);
    }

    // 4. Check Middleware
    if (fs.existsSync('./middleware.ts')) {
        log.push("[PASS] middleware.ts exists");
    }

    fs.writeFileSync('diagnostic_result.txt', log.join('\n'));
}

check();
