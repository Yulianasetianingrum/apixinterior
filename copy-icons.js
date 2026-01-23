const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'app', 'uploads', 'logo_apixinterior_golden.png.png');
const targets = [
    path.join(__dirname, 'public', 'favicon.png'),
    path.join(__dirname, 'public', 'apple-touch-icon.png')
];

console.log('Copying logo files...');
console.log('Source:', source);

if (!fs.existsSync(source)) {
    console.error('ERROR: Source file does not exist!');
    process.exit(1);
}

targets.forEach(target => {
    try {
        fs.copyFileSync(source, target);
        console.log('✓ Copied to:', target);
    } catch (err) {
        console.error('✗ Failed to copy to:', target);
        console.error(err.message);
    }
});

console.log('\nDone!');
