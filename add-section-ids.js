const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'admin', 'admin_dashboard', 'admin_pengaturan', 'toko', 'page.tsx');

console.log('Adding data-section-id attributes to section forms...');
console.log('File:', filePath);

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// List of section types to update (all except HERO which is already done)
const sectionTypes = [
    'CATEGORY_GRID',
    'CATEGORY_GRID_COMMERCE',
    'PRODUCT_CAROUSEL',
    'PRODUCT_LISTING',
    'HIGHLIGHT_COLLECTION',
    'ROOM_CATEGORY',
    'GALLERY',
    'BRANCHES',
    'CONTACT',
    'SOCIAL',
    'CUSTOM_PROMO',
    'TESTIMONIALS',
    'FOOTER'
];

let replacements = 0;

sectionTypes.forEach(sectionType => {
    // Pattern to match: {section.type === "TYPE" && (
    //                     <div className={styles.sectionEditForm}>
    const pattern = new RegExp(
        `(\\{section\\.type === "${sectionType}" && \\(\\s+<div className=\\{styles\\.sectionEditForm\\})>`,
        'g'
    );

    const replacement = `$1 data-section-id={section.id}>`;

    const newContent = content.replace(pattern, replacement);

    if (newContent !== content) {
        console.log(`✓ Updated ${sectionType}`);
        replacements++;
        content = newContent;
    } else {
        console.log(`✗ Not found or already updated: ${sectionType}`);
    }
});

if (replacements > 0) {
    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n✅ Successfully updated ${replacements} section types!`);
} else {
    console.log('\n❌ No replacements made.');
}
