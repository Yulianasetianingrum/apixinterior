
const http = require('http');

http.get('http://localhost:3000', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Look for links that might be Custom Promo
        // Custom promo usually has class or just find hrefs with /promo
        const promoLinks = data.match(/href="\/promo[^"]*"/g);
        console.log("Promo Links Found:");
        if (promoLinks) {
            promoLinks.forEach(l => console.log(l));
        } else {
            console.log("No /promo links found");
        }

        // Also check for fallback /cari links
        const cariLinks = data.match(/href="\/cari[^"]*"/g);
        console.log("Cari Links Found:");
        if (cariLinks) {
            cariLinks.forEach(l => console.log(l));
        }
    });
}).on('error', err => {
    console.error(err);
});
