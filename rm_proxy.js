
const fs = require('fs');
const path = 'd:/apix_interior/proxy.ts';
try {
    if (fs.existsSync(path)) {
        console.log(`File exists. Size: ${fs.statSync(path).size}`);
        fs.unlinkSync(path);
        console.log("Successfully unlinked (deleted) proxy.ts");
    } else {
        console.log("proxy.ts does not exist according to fs.existsSync");
    }
} catch (err) {
    console.error(`Error deleting file: ${err.message}`);
}
