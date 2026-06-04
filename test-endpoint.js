const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/attendees/ext_cmo8wwnzh07fpmu0f4b3z1imi/profile',
  method: 'GET',
  headers: {
    // Just testing, maybe we'll get a 401 Unauthorized but the logic will be executed.
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
