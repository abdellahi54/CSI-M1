const { pool } = require('./config/db');

async function testRoleAccess() {
    const client = await pool.connect();
    try {
        // Simulate what the API does
        await client.query('SET ROLE role_enseignant');
        console.log('Role set to role_enseignant');

        // Try to query bareme_remuneration
        const baremes = await client.query('SELECT * FROM bareme_remuneration');
        console.log('Baremes query successful:', baremes.rows);

        // Try to query offre
        const offres = await client.query("SELECT * FROM offre WHERE etat = 'EN ATTENTE DE VALIDATION' LIMIT 5");
        console.log('Offres query successful:', offres.rows);

    } catch (err) {
        console.error('Error with role_enseignant:', err.message);
    } finally {
        await client.query('RESET ROLE');
        client.release();
        pool.end();
    }
}

testRoleAccess();
