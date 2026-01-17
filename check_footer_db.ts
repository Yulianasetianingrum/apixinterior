import { prisma } from "./lib/prisma";

async function main() {
    console.log("Checking FOOTER sections...");

    const footerDrafts = await prisma.homepageSectionDraft.findMany({
        where: { type: "FOOTER" as any }
    });

    if (footerDrafts.length === 0) {
        console.log("No FOOTER section found in Draft. Creating one...");
        await prisma.homepageSectionDraft.create({
            data: {
                type: "FOOTER" as any,
                title: "Footer Utama",
                slug: "footer",
                enabled: true,
                sortOrder: 999,
                config: {
                    copyright: `© ${new Date().getFullYear()} Apix Interior. All rights reserved.`,
                    useGlobalContact: true,
                    useGlobalSocial: true,
                    sectionTheme: "FOLLOW_NAVBAR"
                }
            }
        });
        console.log("Created default FOOTER section in Draft.");
    } else {
        for (const d of footerDrafts) {
            const cfg = (d.config as any) || {};
            console.log(`Draft FOOTER #${d.id} config:`, cfg);
            if (!cfg.copyright) {
                console.log(`Updating Draft FOOTER #${d.id} with default copyright...`);
                await prisma.homepageSectionDraft.update({
                    where: { id: d.id },
                    data: {
                        config: {
                            ...cfg,
                            copyright: `© ${new Date().getFullYear()} Apix Interior. All rights reserved.`
                        }
                    }
                });
            }
        }
    }

    // Also check Published
    const footerPublished = await prisma.homepageSectionPublished.findMany({
        where: { type: "FOOTER" as any }
    });

    for (const p of footerPublished) {
        const cfg = (p.config as any) || {};
        console.log(`Published FOOTER #${p.id} config:`, cfg);
    }

    console.log("Done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
