
try {
    console.log('Resolving recharts...');
    const path = require.resolve('recharts');
    console.log('RECHARTS_FOUND at ' + path);
} catch (e) {
    console.log('RECHARTS_NOT_FOUND');
    console.error(e.message);
}
