
const fs = require('fs');
const path = require('path');

console.log("CWD:", process.cwd());
const p = path.join(process.cwd(), "public", "uploads", "test_write.txt");
console.log("Target Path:", p);

try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, "test");
    console.log("Write success");
} catch (e) {
    console.error("Write failed:", e);
}
