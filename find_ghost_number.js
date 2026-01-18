
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Hubungi table...");
    const all = await prisma.hubungi.findMany();
    console.log("Total entries:", all.length);
    all.forEach(h => {
        console.log(`ID: ${h.id}, Nomor: ${h.nomor}, Prioritas: ${h.prioritas}`);
    });

    const ghost = all.find(h => h.nomor.includes('1234567890'));
    if (ghost) {
        console.log("FOUND GHOST NUMBER!");
    } else {
        console.log("Ghost number NOT found in Hubungi.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
