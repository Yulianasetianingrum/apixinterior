const { execSync } = require('child_process');
const fs = require('fs');

const filesToInclude = [
    'app', 'prisma', 'lib', 'public', 'scripts',
    'package.json', 'package-lock.json', 'next.config.ts',
    'tsconfig.json', '.env', '.env.local'
];

console.log('Starting bundle...');
try {
    const cmd = `tar -czvf project.tar.gz ${filesToInclude.join(' ')}`;
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    console.log('Bundle created successfully!');
} catch (error) {
    console.error('Error creating bundle:', error);
    process.exit(1);
}
