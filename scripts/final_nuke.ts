
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("=== FINAL NUKE START ===");

    // 1. List all theme meta rows
    const allParams = await prisma.homepageSectionDraft.findMany({});

    const metas = allParams.filter(p => {
        // Check by type (casted) OR by slug convention
        const type = (p as any).type;
        const slug = p.slug || "";
        return type === "THEME_META" || slug.startsWith("__theme_meta__");
    });

    console.log(`Found ${metas.length} POTENTIAL theme metas.`);

    const TO_NUKE = [
        "theme_mkjikfer_7ejzs",
        "theme_mki79liq_99yhj"
    ];

    for (const m of metas) {
        const config = (m.config as any) || {};
        const key = config.__themeKey || m.slug?.replace("__theme_meta__", "") || "";

        console.log(`Checking meta ID ${m.id}: Key="${key}", Slug="${m.slug}"`);

        if (TO_NUKE.includes(key) || TO_NUKE.some(k => m.slug?.includes(k))) {
            console.log(`  -> MATCH!! DELETING ID ${m.id}...`);
            await prisma.homepageSectionDraft.delete({ where: { id: m.id } });
            console.log("     Deleted.");

            // Also delete content sections for this key
            // We must iterate all drafts again to find children
            const children = allParams.filter(p => {
                const c = (p.config as any) || {};
                return c.__themeKey === key && p.id !== m.id;
            });

            if (children.length > 0) {
                console.log(`     Deleting ${children.length} child sections...`);
                await prisma.homepageSectionDraft.deleteMany({
                    where: { id: { in: children.map(c => c.id) } }
                });
            }
        }
    }

    console.log("=== FINAL NUKE END ===");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
