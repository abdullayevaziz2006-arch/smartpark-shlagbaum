const http = require('http');

http.get('http://localhost:3001/api/stats', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('DATA:', data);
  });
}).on('error', (err) => {
  console.error('ERROR:', err.message);
});
