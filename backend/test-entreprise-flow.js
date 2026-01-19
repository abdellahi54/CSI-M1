const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testEntrepriseFlow() {
    const testUser = {
        email: `entreprise_${Date.now()}@test.com`,
        mot_de_passe: 'password123',
        siret: '12345678901234',
        raison_sociale: 'Test Corp',
        adresse: '123 Test St',
        forme_juridique: 'SAS'
    };

    console.log('--- 1. Register Entreprise ---');
    let response = await fetch(`${BASE_URL}/auth/register-entreprise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });

    let data = await response.json();
    console.log('Status:', response.status);
    // console.log('Response:', data);

    if (response.status !== 201 && response.status !== 200) {
        console.error('Registration failed');
        return;
    }

    const token = data.token;
    console.log('Got token');

    console.log('\n--- 2. Get Profile ---');
    response = await fetch(`${BASE_URL}/entreprises/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log('Status:', response.status);
    console.log('Profile:', data);

    console.log('\n--- 3. Update Profile ---');
    const updateData = {
        raison_sociale: 'Test Corp Updated',
        adresse: '456 New Addr'
    };
    response = await fetch(`${BASE_URL}/entreprises/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
    });
    data = await response.json();
    console.log('Status:', response.status);
    console.log('Updated Profile:', data);
}

testEntrepriseFlow();
