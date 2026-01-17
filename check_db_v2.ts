import { prisma } from './lib/prisma';
import fs from 'fs';

async function main() {
    try {
        const h = await prisma.hubungi.findMany();
        const sections = await prisma.homepageSectionPublished.findMany({ where: { type: 'FOOTER' } });
        const settings = await prisma.navbarSetting.findMany();

        const dump = {
            hubungi: h,
            footer_sections: sections,
            nav_settings: settings
        };

        fs.writeFileSync('db_dump.json', JSON.stringify(dump, null, 2));
        console.log('Dump complete');
    } catch (e) {
        console.error(e);
    }
}

main();
