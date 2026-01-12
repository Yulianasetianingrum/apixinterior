
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require("@prisma/client");

// Load .env manually
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
            }
        });
    }
} catch (e) {
    console.log("Error loading .env", e);
}

const prisma = new PrismaClient();

async function main() {
    const targetId = 7;
    const fullUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.7707336605604!2d106.96402257499095!3d-6.293832693695207!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d049216585b%3A0x69c6e1c0ddbb1f1b!2sAPIX%20INTERIOR!5e0!3m2!1sid!2sid!4v1767962639406!5m2!1sid!2sid";

    // 1. Force Alter Table to TEXT to be absolutely sure
    try {
        console.log("Altering table to ensure mapsUrl is TEXT...");
        await prisma.$executeRawUnsafe("ALTER TABLE cabang_toko MODIFY mapsUrl TEXT");
        console.log("Alter Table Success!");
    } catch (e) {
        console.error("Alter Table Failed (might already be text or diff DB type):", e.message);
    }

    // 2. Update the data
    console.log("Updating ID 7...");
    try {
        const updated = await prisma.cabangToko.update({
            where: { id: targetId },
            data: { mapsUrl: fullUrl }
        });
        console.log("Update Success! New Length:", updated.mapsUrl.length);
    } catch (e) {
        console.error("Update failed:", e.message);
    }
}

main()
    .finally(() => prisma.$disconnect());
