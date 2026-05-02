const http = require('http');
http.get('http://localhost:3000/uploads/logos/d9b2eeea-09fd-4c54-b2ad-17d0d65c59b2.jpg', res => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
}).on('error', err => {
  console.log('ERROR:', err.message);
});
