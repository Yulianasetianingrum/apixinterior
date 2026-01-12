const fs = require('fs');
const path = require('path');

const pagePath = path.resolve('page.module.css');
const previewPath = path.resolve('admin/admin_dashboard/admin_pengaturan/toko/preview/preview.module.css');
const destPath = path.resolve('page.module.merged.css');

console.log('Merging to:', destPath);

try {
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    const previewContent = fs.readFileSync(previewPath, 'utf8');

    // Avoid double merge
    if (pageContent.includes('/* MERGED PREVIEW STYLES */')) {
        console.log('Already merged content detected in source.');
        fs.writeFileSync(destPath, pageContent);
    } else {
        fs.writeFileSync(destPath, pageContent + '\n\n/* MERGED PREVIEW STYLES */\n' + previewContent);
    }

    console.log('Write complete. Size:', fs.statSync(destPath).size);
    process.exit(0);
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
