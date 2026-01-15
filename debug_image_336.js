
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
    const id = 336; // Based on screenshot
    const img = await prisma.gambarUpload.findUnique({ where: { id: id } });
    if (!img) {
        console.log(`Image ${id} not found in DB`);
        return;
    }
    console.log(`Image ${id}: ${img.url}`);

    if (img.url) {
        const relativePath = img.url.replace(/^\//, "").replace(/^uploads\/gambar_upload\//, "");
        const localPath = path.join(process.cwd(), "public", "uploads", "gambar_upload", relativePath);
        const exists = fs.existsSync(localPath);
        console.log(`Checking path: ${localPath}`);
        console.log(`Exists on disk: ${exists}`);

        // Also check directory listing to see what's there
        const dir = path.dirname(localPath);
        if (fs.existsSync(dir)) {
            console.log(`Directory ${dir} exists. Listing partial content:`);
            const files = fs.readdirSync(dir);
            const match = files.filter(f => f.includes(relativePath.split('-')[1] || "unexpected"));
            console.log("Matching files:", match);
        } else {
            console.log(`Directory ${dir} DOES NOT EXIST`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
