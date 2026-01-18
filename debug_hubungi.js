
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("DEBUG: Checking Hubungi table...");

    // 1. ALL DATA
    const all = await prisma.hubungi.findMany();
    console.log("ALL DATA:", JSON.stringify(all, null, 2));

    // 2. LOGIC SIMULATION
    let waRow = await prisma.hubungi.findFirst({
        where: {
            prioritas: true,
            NOT: { nomor: { contains: "81234567890" } }
        },
        select: { nomor: true },
    });
    console.log("PRIORITY QUERY RESULT:", waRow);

    if (!waRow) {
        console.log("Fallback triggered...");
        waRow = await prisma.hubungi.findFirst({
            where: {
                NOT: { nomor: { contains: "81234567890" } }
            },
            orderBy: { id: "asc" },
            select: { nomor: true },
        });
        console.log("FALLBACK RESULT:", waRow);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
