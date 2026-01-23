
const fs = require('fs');
const log = [];
log.push("Simple Diagnostic");
log.push(`CWD: ${process.cwd()}`);
log.push(`.next exists: ${fs.existsSync('./.next')}`);
log.push(`package.json exists: ${fs.existsSync('./package.json')}`);
log.push(`middleware.ts exists: ${fs.existsSync('./middleware.ts')}`);
log.push(`node version: ${process.version}`);
fs.writeFileSync('simple_diag.txt', log.join('\n'));
console.log("Done");
