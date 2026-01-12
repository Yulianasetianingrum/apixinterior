const { Client } = require('ssh2');
const conn = new Client();

const commands = [
    'mysql -e "CREATE DATABASE IF NOT EXISTS apix_interior;"',
    'mysql -e "CREATE USER IF NOT EXISTS \'apix_user\'@\'localhost\' IDENTIFIED BY \'Apix_P@ssw0rd_2024\';"',
    'mysql -e "GRANT ALL PRIVILEGES ON apix_interior.* TO \'apix_user\'@\'localhost\';"',
    'mysql -e "FLUSH PRIVILEGES;"'
];

conn.on('ready', () => {
    console.log('Client :: ready');
    let i = 0;

    function runNext() {
        if (i >= commands.length) {
            console.log('Database setup completed successfully!');
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
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
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
    password: '1Juni2020#com'
});
