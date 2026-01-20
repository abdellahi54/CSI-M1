const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/enseignant/baremes',
    method: 'GET',
    headers: {
        'X-User-Role': 'ENSEIGNANT RESPONSABLE',
        'X-User-Id': '1',
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    console.log(`Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.end();
