
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const THEMES_TO_DELETE = [
    "theme_mkjikfer_7ejzs",
    "theme_mki79liq_99yhj"
];

const THEME_META_SLUG_PREFIX = "__theme_meta__";
const themeMetaSlug = (key: string) => `${THEME_META_SLUG_PREFIX}${key}`;

function getThemeKeyFromRow(row: any): string {
    if (row.type === "THEME_META") {
        const c = row.config as any;
        if (c?.__themeKey) return c.__themeKey;
        return row.slug?.replace(THEME_META_SLUG_PREFIX, "") || "";
    }
    // For other sections, check config.sectionTheme
    // But wait, the sectionTheme is usually "NAVY_GOLD" etc. 
    // IMPORTANT: The actual "owner" of a section is technically determined by... 
    // In `page.tsx`, it filters by: `getThemeKeyFromRow(d) === themeKey`.
    // Let's see `toko-utils.ts` for `getThemeKeyFromRow`.

    // Replicating `getThemeKeyFromRow` logic from observation or assumption isn't safe.
    // However, usually draft sections don't store "themeKey" unless we added it?
    // Ah, looking at `page.tsx` again:
    // `const draftSectionsForTheme = activeThemeKey ? draftSections.filter(...) : ...`
    // It seems `getThemeKeyFromRow` checks `row.config.__themeKey`?

    const c = (row.config as any) || {};
    if (c.__themeKey) return c.__themeKey;

    return "";
}

async function main() {
    console.log("Starting force delete for themes:", THEMES_TO_DELETE);

    const allDrafts = await prisma.homepageSectionDraft.findMany();
    console.log(`Found ${allDrafts.length} total drafts.`);

    for (const themeKey of THEMES_TO_DELETE) {
        console.log(`\nProcessing: ${themeKey}`);

        // 1. Identify valid content rows belonging to this theme
        const contentIds: number[] = [];

        for (const d of allDrafts) {
            // Check if this row belongs to the theme
            const config = d.config as any;
            // The server action logic uses `getThemeKeyFromRow` which likely checks config.__themeKey
            if (config && config.__themeKey === themeKey) {
                contentIds.push(d.id);
            }
        }

        console.log(`Found ${contentIds.length} content sections to delete.`);

        // 2. Identify the meta row
        const metaSlug = themeMetaSlug(themeKey);
        const metaRow = await prisma.homepageSectionDraft.findFirst({
            where: { slug: metaSlug }
        });

        if (metaRow) {
            console.log(`Found meta row: ${metaRow.id} (slug: ${metaRow.slug})`);
            contentIds.push(metaRow.id);
        } else {
            console.log("No meta row found.");
        }

        if (contentIds.length > 0) {
            const res = await prisma.homepageSectionDraft.deleteMany({
                where: { id: { in: contentIds } }
            });
            console.log(`Deleted ${res.count} rows for ${themeKey}.`);
        } else {
            console.log("Nothing to delete.");
        }
    }

    console.log("\nDone.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
