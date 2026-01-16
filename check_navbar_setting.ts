
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const setting = await prisma.navbarSetting.findFirst();
    console.log("Global Navbar Setting:", setting);

    const activeThemeMeta = await prisma.homepageSectionDraft.findFirst({
        where: { slug: "__active_theme__" },
    });
    console.log("Active Theme Meta:", activeThemeMeta?.config);

    const publishedMeta = await prisma.homepageSectionPublished.findFirst({
        where: { slug: { startsWith: "__theme_meta__" } },
    });
    console.log("Published Theme Meta:", publishedMeta?.slug, publishedMeta?.config);
}

main();
