const { Client } = require('ssh2');
const fs = require('fs');
const logStream = fs.createWriteStream('deploy-setup.log', { flags: 'a' });
const conn = new Client();

const commands = [
    'export DEBIAN_FRONTEND=noninteractive && apt update',
    'export DEBIAN_FRONTEND=noninteractive && apt upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"',
    'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -',
    'export DEBIAN_FRONTEND=noninteractive && apt install -y nodejs mysql-server git',
    'npm install -g pm2'
];

conn.on('ready', () => {
    console.log('Client :: ready');
    let i = 0;

    function runNext() {
        if (i >= commands.length) {
            console.log('All commands completed successfully!');
            conn.end();
            return;
        }

        const cmd = commands[i];
        console.log(`Running: ${cmd}`);

        conn.exec(cmd, (err, stream) => {
            if (err) {
                console.error(`Error executing ${cmd}:`, err);
                conn.end();
                return;
            }
            stream.on('close', (code, signal) => {
                console.log(`Command ${cmd} exited with code ${code}`);
                if (code === 0) {
                    i++;
                    runNext();
                } else {
                    console.error('Command failed, stopping.');
                    conn.end();
                }
            }).on('data', (data) => {
                process.stdout.write(data);
                logStream.write(data);
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
                logStream.write(data);
            });
        });
    }

    runNext();
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect({
    host: '76.13.18.56',
    port: 22,
    username: 'root',
    password: '1Juni2020#com',
    readyTimeout: 20000
});
