
const fs = require('fs');
const path = 'd:/apix_interior/proxy.ts';
try {
    if (fs.existsSync(path)) {
        console.log(`Deleting ${path}...`);
        fs.unlinkSync(path);
        console.log("Deleted.");
    } else {
        console.log("File not found.");
    }
} catch (e) {
    console.error(`Error: ${e.message}`);
}
