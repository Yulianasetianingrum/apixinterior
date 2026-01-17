
const sharp = require('sharp');
const fs = require('fs');

async function testSharp() {
    try {
        console.log("Sharp version:", sharp.versions);
        const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        const output = await sharp(buffer).resize(10, 10).toBuffer();
        console.log("Sharp success! Result size:", output.length);
        process.exit(0);
    } catch (e) {
        console.error("Sharp failed:", e);
        process.exit(1);
    }
}

testSharp();
