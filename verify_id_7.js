
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
    console.log("Reading ID 7...");
    try {
        const item = await prisma.cabangToko.findUnique({
            where: { id: targetId },
        });
        if (item) {
            console.log("CURRENT DATA FOR ID 7:");
            console.log("Name:", item.namaCabang);
            console.log("Length:", item.mapsUrl.length);
            console.log("Value:", item.mapsUrl);
        } else {
            console.log("ID 7 not found!");
        }
    } catch (e) {
        console.error("Read failed:", e.message);
    }
}

main()
    .finally(() => prisma.$disconnect());
