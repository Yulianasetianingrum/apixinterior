
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
    const id = 337;
    const img = await prisma.gambarUpload.findUnique({ where: { id: id } });
    if (!img) {
        console.log(`Image ${id} not found in DB`);
        return;
    }
    console.log(`Image ${id}: ${img.url}`);

    if (img.url) {
        const relative = img.url.replace(/^\//, "").replace(/^uploads\/gambar_upload\//, "");
        const localDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
        const localPath = path.join(localDir, relative);

        console.log(`Checking path: ${localPath}`);
        console.log(`Exists: ${fs.existsSync(localPath)}`);
        console.log(`Directory exists: ${fs.existsSync(localDir)}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
