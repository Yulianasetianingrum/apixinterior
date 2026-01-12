const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const logFile = 'sftp-deploy.log';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
}

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

log('Starting SFTP transfer...');

conn.on('ready', () => {
    log('SSH READY');
    conn.sftp((err, sftp) => {
        if (err) { log('SFTP ERROR: ' + err.message); throw err; }

        log('SFTP READY');

        conn.exec(`mkdir -p ${remoteBaseDir}`, (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                let allItems = [...filesToTransfer];
                foldersToTransfer.forEach(f => {
                    const files = getAllFiles(f);
                    allItems = allItems.concat(files);
                });

                log(`Total items to transfer: ${allItems.length}`);

                let i = 0;
                function transferNext() {
                    if (i >= allItems.length) {
                        log('TRANSFER COMPLETE!');
                        conn.end();
                        return;
                    }

                    const localPath = allItems[i];
                    const remotePath = path.posix.join(remoteBaseDir, localPath.replace(/\\/g, '/'));
                    const remoteDir = path.posix.dirname(remotePath);

                    conn.exec(`mkdir -p ${remoteDir}`, (err, stream) => {
                        if (err) throw err;
                        stream.on('close', () => {
                            log(`Uploading [${i + 1}/${allItems.length}] ${localPath}`);
                            sftp.fastPut(localPath, remotePath, (err) => {
                                if (err) {
                                    log(`Error uploading ${localPath}: ${err.message}`);
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
    log('Connection Error: ' + err.message);
}).connect({
    host: '76.13.18.56',
    port: 22,
    username: 'root',
    password: '1Juni2020#com'
});
