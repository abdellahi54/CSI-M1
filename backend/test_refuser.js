const http = require('http');

const data = JSON.stringify({ motif: 'Test de refus' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/enseignant/offres/3/refuser',
    method: 'PUT',
    headers: {
        'X-User-Role': 'ENSEIGNANT RESPONSABLE',
        'X-User-Id': '1',
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';
    console.log(`Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Response:', responseData);
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
