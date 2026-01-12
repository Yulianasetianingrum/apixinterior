const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const logStream = fs.createWriteStream('sftp-deploy.log', { flags: 'a' });
logStream.write(`Started at ${new Date().toISOString()}\n`);

const conn = new Client();

const filesToTransfer = [
    'package.json', 'package-lock.json', 'next.config.ts',
    'tsconfig.json', '.env', '.env.local'
];
const foldersToTransfer = ['app', 'prisma', 'lib', 'public', 'scripts'];

const remoteBaseDir = '/var/www/apix_interior';

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
}

conn.on('ready', () => {
    console.log('Client :: ready');
    conn.sftp((err, sftp) => {
        if (err) throw err;

        console.log('SFTP :: ready');

        // Ensure remote dir exists
        conn.exec(`mkdir -p ${remoteBaseDir}`, (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                let allItems = [...filesToTransfer];
                foldersToTransfer.forEach(f => {
                    const files = getAllFiles(f);
                    allItems = allItems.concat(files);
                });

                let i = 0;
                function transferNext() {
                    if (i >= allItems.length) {
                        console.log('All files transferred!');
                        conn.end();
                        return;
                    }

                    const localPath = allItems[i];
                    const remotePath = path.posix.join(remoteBaseDir, localPath.replace(/\\/g, '/'));
                    const remoteDir = path.posix.dirname(remotePath);

                    conn.exec(`mkdir -p ${remoteDir}`, (err, stream) => {
                        if (err) throw err;
                        stream.on('close', () => {
                            console.log(`Uploading ${localPath} -> ${remotePath}`);
                            sftp.fastPut(localPath, remotePath, (err) => {
                                if (err) {
                                    console.error(`Error uploading ${localPath}:`, err);
                                }
                                i++;
                                transferNext();
                            });
                        });
                    });
                }

                transferNext();
            });
        });
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect({
    host: '76.13.18.56',
    port: 22,
    username: 'root',
    password: '1Juni2020#com'
});
